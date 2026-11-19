import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Bell, Briefcase, Building2, CalendarDays, Heart, Info, Trophy } from "lucide-react";
import { api } from "../api";
import { useAction, useApi, useSession, useUnread } from "../api/hooks";
import type { Notification, NotificationKind } from "../api/types";
import { Empty, ErrorNote, Skeleton, Spinner, ago } from "../components/form";
import { btn, ease } from "../components/ui";
import { go } from "../lib/router";

const ICONS: Record<NotificationKind, typeof Bell> = {
  match: Heart,
  application: Briefcase,
  company_status: Building2,
  badge: Trophy,
  verified: BadgeCheck,
  event: CalendarDays,
  system: Info,
};

async function open(n: Notification) {
  if (!n.read) await api.notifications.markRead(n.id);
  if (n.link) go(n.link);
}

function Item({ n, onOpen, compact }: { n: Notification; onOpen: (n: Notification) => void; compact?: boolean }) {
  const Icon = ICONS[n.kind] ?? Info;
  return (
    <button
      onClick={() => onOpen(n)}
      className={`flex w-full items-start gap-3 text-left transition-colors hover:bg-tint ${compact ? "rounded-2xl px-3 py-2.5" : "rounded-2xl px-4 py-3.5"} ${
        n.read ? "" : "bg-accent/[0.07]"
      }`}
    >
      <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${n.read ? "bg-tint text-sky" : "bg-accent text-paper"}`}>
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={`text-[13px] ${n.read ? "font-medium" : "font-semibold text-ink"}`}>{n.title}</span>
          <span className="shrink-0 text-[11px] text-mist">{ago(n.at)}</span>
        </span>
        <span className={`mt-0.5 block text-[12px] text-mist ${compact ? "line-clamp-2" : ""}`}>{n.body}</span>
      </span>
      {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="unread" />}
    </button>
  );
}

/** Header bell with an unread count and a dropdown of the latest notifications. */
export function NotificationBell() {
  const user = useSession();
  const unread = useUnread();
  const [isOpen, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const list = useApi(() => (user ? api.notifications.list() : Promise.resolve([] as Notification[])), [user?.id]);
  const markAll = useAction(api.notifications.markAllRead);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  if (!user) return null;
  const items = (list.data ?? []).slice(0, 8);

  async function pick(n: Notification) {
    setOpen(false);
    await open(n);
  }

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={isOpen}
        className={`relative grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-tint ${isOpen ? "bg-tint text-ink" : "text-mist hover:text-ink"}`}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-paper">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease }}
            className="fixed inset-x-3 top-[68px] z-50 origin-top-right rounded-3xl border border-line bg-surface p-2 shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-12 md:w-[380px]"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-2">
              <span className="text-[14px] font-semibold">Notifications</span>
              {unread > 0 && (
                <button onClick={() => markAll.run()} disabled={markAll.pending} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-sky hover:text-ink disabled:opacity-60">
                  {markAll.pending && <Spinner />} Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[min(60vh,440px)] overflow-y-auto">
              {list.loading ? (
                <div className="p-2">
                  <Skeleton rows={3} className="h-14" />
                </div>
              ) : items.length === 0 ? (
                <p className="px-3 py-8 text-center text-[13px] text-mist">Nothing yet. Matches, application updates and badges show up here.</p>
              ) : (
                items.map((n) => <Item key={n.id} n={n} onOpen={pick} compact />)
              )}
            </div>
            {user.kind !== "admin" && (
              <button
                onClick={() => {
                  setOpen(false);
                  go("#/app/notifications");
                }}
                className="mt-1 w-full rounded-2xl px-3 py-2.5 text-center text-[13px] font-semibold text-sky hover:bg-tint hover:text-ink"
              >
                See all
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function NotificationsPage() {
  const list = useApi(() => api.notifications.list(), []);
  const markAll = useAction(api.notifications.markAllRead);
  const items = list.data ?? [];
  const unread = items.filter((n) => !n.read).length;
  const groups = [
    { label: "Today", items: items.filter((n) => isToday(n.at)) },
    { label: "Earlier", items: items.filter((n) => !isToday(n.at)) },
  ].filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(26px,3vw,36px)]">Notifications</h1>
          <p className="mt-1 text-[14px] text-mist">{unread ? `${unread} unread` : "You're all caught up."}</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAll.run()} disabled={markAll.pending} className={`${btn.ghost} disabled:opacity-60`}>
            {markAll.pending && <Spinner />} Mark all read
          </button>
        )}
      </div>
      <ErrorNote>{markAll.error}</ErrorNote>
      {list.loading ? (
        <Skeleton rows={4} className="h-16" />
      ) : list.error ? (
        <ErrorNote>{list.error}</ErrorNote>
      ) : !items.length ? (
        <Empty
          icon={<Bell size={20} />}
          title="No notifications yet"
          text="Matches, application updates, approvals and hackathon badges will show up here."
          action={
            <button onClick={() => go("#/app/swipe")} className={btn.primary}>
              Start swiping
            </button>
          }
        />
      ) : (
        <div className="grid gap-6">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-2 px-1 text-[13px] font-semibold text-mist">{g.label}</h2>
              <div className="grid gap-1 rounded-3xl border border-line bg-surface p-2">
                {g.items.map((n) => (
                  <Item key={n.id} n={n} onOpen={open} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
