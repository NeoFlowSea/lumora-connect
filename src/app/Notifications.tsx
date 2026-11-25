import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Bell, Briefcase, Building2, CalendarDays, Handshake, Info, Trophy } from "lucide-react";
import { api } from "../api";
import { useAction, useApi, useSession, useUnread } from "../api/hooks";
import type { Notification, NotificationKind } from "../api/types";
import { Empty, ErrorNote, Skeleton, Spinner, ago } from "../components/form";
import { btn } from "../components/ui";
import { t, tp, useLang } from "../i18n";
import { go } from "../lib/router";

/* Header bell with a dropdown, and the full page at #/app/notifications.
   Stored titles and bodies were written in the language active when they were created. */

const ICONS: Record<NotificationKind, typeof Bell> = {
  match: Handshake,
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
      className={`flex w-full min-w-0 items-start gap-3 rounded-lg text-left transition-colors hover:bg-tint ${compact ? "px-2.5 py-2.5" : "px-3 py-3.5 md:px-4"} ${n.read ? "" : "bg-tint/50"}`}
    >
      <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${n.read ? "bg-tint text-sky" : "bg-blue text-white"}`}>
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-start justify-between gap-3">
          <span className={`min-w-0 break-words text-[14px] ${n.read ? "font-medium text-mist" : "font-semibold text-ink"}`}>{n.title}</span>
          <span className="shrink-0 text-[12px] text-mist">{ago(n.at)}</span>
        </span>
        {n.body && <span className={`mt-0.5 block break-words text-[13px] text-mist ${compact ? "line-clamp-2" : ""}`}>{n.body}</span>}
      </span>
      {!n.read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent">
          <span className="sr-only">{t("app.notif.unread")}</span>
        </span>
      )}
    </button>
  );
}

/** Header bell with an unread count and a dropdown of the latest notifications. */
export function NotificationBell() {
  useLang();
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
  const seeAll = user.kind === "admin" ? null : "#/app/notifications";

  async function pick(n: Notification) {
    setOpen(false);
    await open(n);
  }

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? tp("app.notif.bellUnread", unread) : t("app.notif.title")}
        aria-expanded={isOpen}
        className={`relative grid h-11 w-11 place-items-center rounded-lg transition-colors hover:bg-tint ${isOpen ? "bg-tint text-ink" : "text-mist hover:text-ink"}`}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[12px] font-bold leading-none text-paper">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          className="fixed inset-x-3 top-[68px] z-50 rounded-xl border border-line bg-surface p-1.5 shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-12 md:w-[380px]"
          role="dialog"
          aria-label={t("app.notif.title")}
        >
          <div className="flex min-h-11 items-center justify-between gap-2 px-2.5">
            <span className="text-[15px] font-semibold">{t("app.notif.title")}</span>
            {unread > 0 && (
              <button onClick={() => markAll.run()} disabled={markAll.pending} className="inline-flex min-h-11 items-center gap-1.5 px-1 text-[13px] font-semibold text-sky hover:text-ink disabled:opacity-60">
                {markAll.pending && <Spinner />} {t("app.notif.markAll")}
              </button>
            )}
          </div>
          <div className="max-h-[min(60vh,440px)] overflow-y-auto">
            {list.loading ? (
              <div className="p-2">
                <Skeleton rows={3} className="h-14" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-3 py-8 text-center text-[13px] text-mist">{t("app.notif.emptyShort")}</p>
            ) : (
              items.map((n) => <Item key={n.id} n={n} onOpen={pick} compact />)
            )}
          </div>
          {seeAll && (
            <button
              onClick={() => {
                setOpen(false);
                go(seeAll);
              }}
              className="mt-1 min-h-11 w-full rounded-lg px-3 text-center text-[14px] font-semibold text-sky hover:bg-tint hover:text-ink"
            >
              {t("app.notif.seeAll")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function NotificationsPage() {
  useLang();
  const list = useApi(() => api.notifications.list(), []);
  const markAll = useAction(api.notifications.markAllRead);
  const items = list.data ?? [];
  const unread = items.filter((n) => !n.read).length;
  const groups = [
    { key: "today", label: t("app.notif.today"), items: items.filter((n) => isToday(n.at)) },
    { key: "earlier", label: t("app.notif.earlier"), items: items.filter((n) => !isToday(n.at)) },
  ].filter((g) => g.items.length);

  return (
    <div className="mx-auto min-w-0 max-w-[760px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(26px,3vw,34px)]">{t("app.notif.title")}</h1>
          <p className="mt-1 text-[14px] text-mist">{unread ? tp("app.notif.unreadN", unread) : t("app.notif.allRead")}</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAll.run()} disabled={markAll.pending} className={`${btn.ghost} disabled:opacity-60`}>
            {markAll.pending && <Spinner />} {t("app.notif.markAll")}
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
          title={t("app.notif.emptyTitle")}
          text={t("app.notif.emptyText")}
          action={
            <button onClick={() => go("#/app/swipe")} className={btn.primary}>
              {t("app.notif.goSwipe")}
            </button>
          }
        />
      ) : (
        <div className="grid gap-6">
          {groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h2 className="mb-2 px-1 text-[14px] font-semibold text-mist">{g.label}</h2>
              <div className="grid gap-0.5 rounded-xl border border-line bg-surface p-1.5">
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
