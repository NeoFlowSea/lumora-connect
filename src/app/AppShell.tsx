import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Briefcase, Heart, Trophy, User } from "lucide-react";
import { Wordmark } from "../components/Logo";
import { useStore } from "../lib/store";
import { go, type Tab } from "../lib/router";

const tabs: { key: Tab; label: string; icon: typeof Heart }[] = [
  { key: "swipe", label: "Swipe", icon: Heart },
  { key: "opportunities", label: "Opportunities", icon: Briefcase },
  { key: "hackathons", label: "Hackathons", icon: Trophy },
  { key: "profile", label: "Profile", icon: User },
];

export function AppShell({ tab, children }: { tab: Tab; children: ReactNode }) {
  const { role } = useStore();
  return (
    <div className="min-h-[100svh] bg-cloud">
      {/* top bar: tabs on desktop */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-5 md:px-8">
          <button onClick={() => go("#/")} aria-label="Back to site">
            <Wordmark size={30} />
          </button>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {tabs.map((t) => {
              const on = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => go(`#/app/${t.key}`)}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
                    on ? "text-accent" : "text-mist hover:text-ink"
                  }`}
                >
                  {on && (
                    <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-tint" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                  )}
                  <t.icon size={16} className="relative" />
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full border border-line px-3 py-1 text-[12px] font-semibold text-mist sm:block">
              {role === "company" ? "Company view" : "Talent view"}
            </span>
            <button onClick={() => go("#/")} className="text-[13px] font-semibold text-mist hover:text-ink">
              Back to site
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 pb-28 pt-24 md:px-8 md:pb-16">{children}</main>

      {/* bottom bar: phones */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4">
          {tabs.map((t) => {
            const on = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => go(`#/app/${t.key}`)}
                className={`flex flex-col items-center gap-1 py-3 text-[10px] font-semibold tracking-tight ${on ? "text-accent" : "text-mist"}`}
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
