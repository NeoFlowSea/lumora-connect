import type { ReactNode } from "react";
import { BadgeCheck, Briefcase, Building2, CalendarDays, ExternalLink, LayoutGrid, LogOut, ScrollText, Users as UsersIcon } from "lucide-react";
import { Wordmark } from "../components/Logo";
import { LangSwitch } from "../components/LangSwitch";
import { NotificationBell } from "../app/Notifications";
import { api, statsNow } from "../api";
import { useSession } from "../api/hooks";
import { t, useLang } from "../i18n";
import { go } from "../lib/router";

export type AdminSection = "overview" | "verification" | "companies" | "users" | "events" | "opportunities" | "audit";

const sections: { key: AdminSection; icon: typeof LayoutGrid; href: string }[] = [
  { key: "overview", icon: LayoutGrid, href: "#/admin" },
  { key: "verification", icon: BadgeCheck, href: "#/admin/verification" },
  { key: "companies", icon: Building2, href: "#/admin/companies" },
  { key: "users", icon: UsersIcon, href: "#/admin/users" },
  { key: "events", icon: CalendarDays, href: "#/admin/events" },
  { key: "opportunities", icon: Briefcase, href: "#/admin/opportunities" },
  { key: "audit", icon: ScrollText, href: "#/admin/audit" },
];

export function AdminShell({ section, children }: { section: AdminSection; children: ReactNode }) {
  useLang();
  const user = useSession(); // re-renders on every DB change, so the counts below stay fresh
  if (!user || user.kind !== "admin") return null;
  const s = statsNow();
  const countFor = (k: AdminSection) => (k === "companies" ? s.pendingCompanies : k === "verification" ? s.pendingVerifications : 0);

  async function signOut() {
    await api.auth.logout();
    go("#/");
  }

  return (
    <div className="min-h-[100svh] bg-cloud">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 md:gap-3 md:px-8">
          <button onClick={() => go("#/admin")} aria-label={t("admin.shell.home")} className="flex min-h-11 shrink-0 items-center">
            <Wordmark size={30} />
          </button>
          <span className="hidden rounded-md bg-tint px-2 py-0.5 text-[12px] font-semibold text-sky sm:inline">{t("admin.shell.badge")}</span>
          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <span className="hidden max-w-[180px] truncate text-[13px] font-semibold lg:block" title={user.email}>
              {user.name}
            </span>
            <span className="hidden rounded-md border border-line px-2 py-0.5 text-[12px] font-semibold text-mist xl:inline">
              {t(user.level === "super" ? "admin.level.super" : "admin.level.moderator")}
            </span>
            <LangSwitch className="hidden sm:inline-flex" />
            <NotificationBell />
            <a href="#/" className="hidden min-h-11 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-mist transition-colors hover:bg-tint hover:text-ink md:flex">
              <ExternalLink size={15} /> {t("admin.shell.viewSite")}
            </a>
            <button
              onClick={signOut}
              aria-label={t("common.nav.signOut")}
              title={t("common.nav.signOut")}
              className="grid h-11 w-11 place-items-center rounded-lg text-mist transition-colors hover:bg-tint hover:text-ink"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        {/* phones: horizontally scrollable section bar with 44px targets */}
        <nav aria-label={t("admin.shell.sections")} className="scrollbar-none flex gap-1 overflow-x-auto border-t border-line px-2 py-1 md:hidden">
          {sections.map((x) => {
            const on = x.key === section;
            const n = countFor(x.key);
            return (
              <button
                key={x.key}
                onClick={() => go(x.href)}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold ${on ? "bg-tint text-accent" : "text-mist"}`}
              >
                <x.icon size={15} />
                {t(`admin.nav.${x.key}`)}
                {n > 0 && <CountBadge n={n} />}
              </button>
            );
          })}
          <LangSwitch className="ml-1 shrink-0 self-center sm:hidden" />
        </nav>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-8 px-4 pb-16 pt-[132px] md:px-8 md:pt-24">
        <aside className="sticky top-24 hidden h-fit w-[220px] shrink-0 md:block">
          <nav aria-label={t("admin.shell.sections")} className="grid gap-0.5">
            {sections.map((x) => {
              const on = x.key === section;
              const n = countFor(x.key);
              return (
                <button
                  key={x.key}
                  onClick={() => go(x.href)}
                  aria-current={on ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3.5 text-left text-[14px] font-semibold transition-colors ${on ? "bg-tint text-accent" : "text-mist hover:bg-tint/50 hover:text-ink"}`}
                >
                  <x.icon size={17} />
                  <span className="min-w-0 flex-1 truncate">{t(`admin.nav.${x.key}`)}</span>
                  {n > 0 && <CountBadge n={n} />}
                </button>
              );
            })}
          </nav>
          <p className="mt-6 px-3.5 text-[12px] leading-relaxed text-mist">{t("admin.shell.localNote")}</p>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[12px] font-bold leading-none text-paper" aria-label={t("admin.shell.waiting", { n })}>
      {n}
    </span>
  );
}

/** page title block used by every admin section */
export function AdminHeader({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="break-words text-[clamp(24px,3vw,32px)]">{title}</h1>
        {text && <p className="mt-1 max-w-[70ch] text-[14px] text-mist">{text}</p>}
      </div>
      {action}
    </div>
  );
}

/** small segmented filter chip used by admin lists */
export function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-[13px] font-semibold transition-colors md:min-h-9 ${
        on ? "border-sky bg-tint text-ink" : "border-line text-mist hover:border-sky hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
