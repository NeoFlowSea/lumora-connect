import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Briefcase, Building2, CalendarDays, ExternalLink, LayoutGrid, LogOut, ScrollText, Users as UsersIcon } from "lucide-react";
import { Wordmark } from "../components/Logo";
import { NotificationBell } from "../app/Notifications";
import { api } from "../api";
import { useApi, useSession } from "../api/hooks";
import { go } from "../lib/router";

export type AdminSection = "overview" | "companies" | "users" | "events" | "opportunities" | "audit";

const sections: { key: AdminSection; label: string; icon: typeof LayoutGrid; href: string }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid, href: "#/admin" },
  { key: "companies", label: "Companies", icon: Building2, href: "#/admin/companies" },
  { key: "users", label: "Users", icon: UsersIcon, href: "#/admin/users" },
  { key: "events", label: "Events", icon: CalendarDays, href: "#/admin/events" },
  { key: "opportunities", label: "Opportunities", icon: Briefcase, href: "#/admin/opportunities" },
  { key: "audit", label: "Audit log", icon: ScrollText, href: "#/admin/audit" },
];

export function AdminShell({ section, children }: { section: AdminSection; children: ReactNode }) {
  const user = useSession();
  const queue = useApi(() => api.admin.companyQueue(), []);
  const pending = queue.data?.length ?? 0;
  if (!user || user.kind !== "admin") return null;

  async function signOut() {
    await api.auth.logout();
    go("#/");
  }

  return (
    <div className="min-h-[100svh] bg-cloud">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-5 md:px-8">
          <button onClick={() => go("#/admin")} aria-label="Admin overview" className="flex shrink-0 items-center gap-3">
            <Wordmark size={30} />
          </button>
          <span className="hidden rounded-full bg-tint px-2.5 py-1 text-[12px] font-semibold text-sky sm:inline">Admin</span>
          <div className="ml-auto flex items-center gap-1.5 md:gap-2">
            <span className="hidden max-w-[180px] truncate text-[13px] font-semibold lg:block" title={user.email}>
              {user.name}
            </span>
            <span
              className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline ${
                user.level === "super" ? "bg-accent text-paper" : "border border-line text-mist"
              }`}
            >
              {user.level === "super" ? "Super admin" : "Moderator"}
            </span>
            <NotificationBell />
            <a
              href="#/"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-mist transition-colors hover:bg-tint hover:text-ink md:flex"
            >
              <ExternalLink size={15} /> View site
            </a>
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="grid h-10 w-10 place-items-center rounded-full text-mist transition-colors hover:bg-tint hover:text-ink"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        {/* phones: horizontally scrollable section bar */}
        <nav className="scrollbar-none flex gap-1 overflow-x-auto border-t border-line px-3 py-2 md:hidden">
          {sections.map((s) => {
            const on = s.key === section;
            return (
              <button
                key={s.key}
                onClick={() => go(s.href)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  on ? "bg-tint text-accent" : "text-mist"
                }`}
              >
                <s.icon size={14} />
                {s.label}
                {s.key === "companies" && pending > 0 && <CountBadge n={pending} />}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-8 px-5 pb-16 pt-[124px] md:px-8 md:pt-24">
        <aside className="sticky top-24 hidden h-fit w-[220px] shrink-0 md:block">
          <nav className="grid gap-1">
            {sections.map((s) => {
              const on = s.key === section;
              return (
                <button
                  key={s.key}
                  onClick={() => go(s.href)}
                  className={`relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-[14px] font-semibold transition-colors ${
                    on ? "text-accent" : "text-mist hover:text-ink"
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="admin-nav"
                      className="absolute inset-0 rounded-2xl bg-tint"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <s.icon size={17} className="relative" />
                  <span className="relative">{s.label}</span>
                  {s.key === "companies" && pending > 0 && (
                    <span className="relative ml-auto">
                      <CountBadge n={pending} />
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <p className="mt-6 px-4 text-[11px] leading-relaxed text-mist/80">
            Demo data lives in this browser only. Changes here are not shared with other people.
          </p>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  return <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-paper">{n}</span>;
}

/** page title block used by every admin section */
export function AdminHeader({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[clamp(24px,3vw,32px)]">{title}</h1>
        {text && <p className="mt-1 max-w-[70ch] text-[13px] text-mist">{text}</p>}
      </div>
      {action}
    </div>
  );
}
