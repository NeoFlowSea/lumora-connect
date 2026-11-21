import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Briefcase, Heart, LayoutDashboard, LogOut, MessageCircle, Trophy, User as UserIcon } from "lucide-react";
import { Wordmark } from "../components/Logo";
import { NotificationBell } from "./Notifications";
import { api } from "../api";
import { useSession } from "../api/hooks";
import type { User } from "../api/types";
import { go } from "../lib/router";
import { t, useLang } from "../i18n";
import { LangSwitch } from "../components/LangSwitch";

export type TabDef = { key: string; label: string; icon: typeof Heart };

/* labels are short on purpose: four of them share a 375px tab bar */

export function tabsFor(user: User): TabDef[] {
  if (user.kind === "company") {
    return [
      { key: "swipe", label: t("common.nav.swipe"), icon: Heart },
      { key: "dashboard", label: t("common.nav.dashboard"), icon: LayoutDashboard },
      { key: "hackathons", label: t("common.nav.events"), icon: Trophy },
      { key: "profile", label: t("common.nav.profile"), icon: UserIcon },
    ];
  }
  return [
    { key: "swipe", label: t("common.nav.swipe"), icon: Heart },
    { key: "opportunities", label: t("common.nav.jobs"), icon: Briefcase },
    { key: "hackathons", label: t("common.nav.events"), icon: Trophy },
    { key: "profile", label: t("common.nav.profile"), icon: UserIcon },
  ];
}

export function defaultTab(user: User): string {
  if (user.kind === "company" && user.status !== "approved") return "dashboard";
  return "swipe";
}

export function AppShell({ tab, children }: { tab: string; children: ReactNode }) {
  const user = useSession();
  useLang();
  if (!user) return null;
  const tabs = tabsFor(user);

  async function signOut() {
    await api.auth.logout();
    go("#/");
  }

  return (
    <div className="min-h-[100svh] bg-cloud">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-5 md:gap-6 md:px-8">
          <button onClick={() => go("#/")} aria-label={t("common.nav.backToSite")} className="shrink-0">
            <Wordmark size={30} />
          </button>
          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {tabs.map((t) => {
              const on = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => go(`#/app/${t.key}`)}
                  className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-[14px] font-semibold transition-colors ${on ? "text-accent" : "text-mist hover:text-ink"}`}
                >
                  {on && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-lg bg-tint" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  <t.icon size={16} className="relative" />
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => go("#/app/inbox")}
              aria-label={t("common.nav.inbox")}
              className={`grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-tint ${tab === "inbox" ? "text-accent" : "text-mist hover:text-ink"}`}
            >
              <MessageCircle size={19} />
            </button>
            <NotificationBell />
            <LangSwitch className="hidden sm:inline-flex" />
            <LangSwitch compact className="sm:hidden" />
            <span className="ml-1 hidden max-w-[160px] truncate rounded-full border border-line px-3 py-1 text-[12px] font-semibold text-mist lg:block" title={user.email}>
              {user.name}
            </span>
            <button onClick={signOut} aria-label={t("common.nav.signOut")} title={t("common.nav.signOut")} className="hidden h-10 sm:grid w-10 place-items-center rounded-full text-mist transition-colors hover:bg-tint hover:text-ink">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {user.kind === "company" && user.status !== "approved" && (
        <div className="fixed inset-x-0 top-16 z-30 border-b border-accent/30 bg-accent/10 px-5 py-2 text-center text-[12px] text-accent backdrop-blur md:text-[13px]">
          {user.status === "pending" ? t("app.shell.pending") : t("app.shell.rejected", { note: user.statusNote || "—" })}
        </div>
      )}

      <main className={`mx-auto max-w-[1240px] px-5 pb-28 md:px-8 md:pb-16 ${user.kind === "company" && user.status !== "approved" ? "pt-32" : "pt-24"}`}>{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4">
          {tabs.map((t) => {
            const on = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => go(`#/app/${t.key}`)}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[12px] font-semibold ${on ? "text-accent" : "text-mist"}`}
              >
                <motion.span animate={{ scale: on ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                  <t.icon size={22} fill={on && t.key === "swipe" ? "currentColor" : "none"} />
                </motion.span>
                <span className="max-w-full truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
