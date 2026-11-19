import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Briefcase, Heart, LayoutDashboard, LogOut, MessageCircle, Trophy, User as UserIcon } from "lucide-react";
import { Wordmark } from "../components/Logo";
import { NotificationBell } from "./Notifications";
import { api } from "../api";
import { useSession } from "../api/hooks";
import type { User } from "../api/types";
import { go } from "../lib/router";

export type TabDef = { key: string; label: string; icon: typeof Heart };

export function tabsFor(user: User): TabDef[] {
  if (user.kind === "company") {
    return [
      { key: "swipe", label: "Swipe", icon: Heart },
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "hackathons", label: "Hackathons", icon: Trophy },
      { key: "profile", label: "Profile", icon: UserIcon },
    ];
  }
  return [
    { key: "swipe", label: "Swipe", icon: Heart },
    { key: "opportunities", label: "Opportunities", icon: Briefcase },
    { key: "hackathons", label: "Hackathons", icon: Trophy },
    { key: "profile", label: "Profile", icon: UserIcon },
  ];
}

export function defaultTab(user: User): string {
  if (user.kind === "company" && user.status !== "approved") return "dashboard";
  return "swipe";
}

export function AppShell({ tab, children }: { tab: string; children: ReactNode }) {
  const user = useSession();
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
          <button onClick={() => go("#/")} aria-label="Back to site" className="shrink-0">
            <Wordmark size={30} />
          </button>
          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {tabs.map((t) => {
              const on = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => go(`#/app/${t.key}`)}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${on ? "text-accent" : "text-mist hover:text-ink"}`}
                >
                  {on && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-tint" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  <t.icon size={16} className="relative" />
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => go("#/app/inbox")}
              aria-label="Matches and messages"
              className={`grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-tint ${tab === "inbox" ? "text-accent" : "text-mist hover:text-ink"}`}
            >
              <MessageCircle size={19} />
            </button>
            <NotificationBell />
            <span className="ml-1 hidden max-w-[160px] truncate rounded-full border border-line px-3 py-1 text-[12px] font-semibold text-mist lg:block" title={user.email}>
              {user.name}
            </span>
            <button onClick={signOut} aria-label="Sign out" title="Sign out" className="grid h-10 w-10 place-items-center rounded-full text-mist transition-colors hover:bg-tint hover:text-ink">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {user.kind === "company" && user.status !== "approved" && (
        <div className="fixed inset-x-0 top-16 z-30 border-b border-accent/30 bg-accent/10 px-5 py-2 text-center text-[12px] text-accent backdrop-blur md:text-[13px]">
          {user.status === "pending"
            ? "Your company is waiting for admin approval. Swiping and publishing unlock once approved."
            : `Your company was not approved${user.statusNote ? `: ${user.statusNote}` : "."} Update your profile and contact Lumora.`}
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
                className={`flex min-w-0 flex-col items-center gap-1 py-3 text-[9px] font-semibold tracking-[-0.04em] ${on ? "text-accent" : "text-mist"}`}
              >
                <motion.span animate={{ scale: on ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                  <t.icon size={22} fill={on && t.key === "swipe" ? "currentColor" : "none"} />
                </motion.span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
