import { Briefcase, Handshake, House, LogIn, Trophy, UserRound } from "lucide-react";
import { useLang } from "../i18n";
import { useSession } from "../api/hooks";
import { openApp } from "../pages/PublicFrame";
import { useRoute } from "../lib/router";
import { onAnchor } from "./parts";

/* Bottom tab bar of the public site on phones, the same shape as the app's tab bar:
   Lumora, Hackathons, Connect, Jobs, and sign in (or the app when signed in). */
export function SiteTabs() {
  const { t } = useLang();
  const user = useSession();
  const page = useRoute().path[0] ?? "";

  const tabs = [
    { key: "lumora", label: t("home.nav.lumora"), href: "#/", icon: House, on: page === "" || page === "about" || page === "contacts" },
    { key: "hackathons", label: t("home.nav.hackathons"), href: "#/hackathons", icon: Trophy, on: page === "hackathons" },
    { key: "connect", label: t("home.nav.connect"), href: "#/connect", icon: Handshake, on: page === "connect" || page === "company" },
    { key: "jobs", label: t("home.tabs.jobs"), href: "#/jobs", icon: Briefcase, on: page === "jobs" },
  ];
  const cls = (on: boolean) =>
    `flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 text-[12px] font-semibold transition-colors ${on ? "text-accent" : "text-mist hover:text-ink"}`;

  return (
    <nav aria-label={t("home.tabs.label")} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">
        {tabs.map((tab) => (
          <a key={tab.key} href={tab.href} onClick={(e) => onAnchor(e, tab.href)} aria-current={tab.on ? "page" : undefined} className={cls(tab.on)}>
            <tab.icon size={22} aria-hidden />
            <span className="max-w-full truncate">{tab.label}</span>
          </a>
        ))}
        <button type="button" onClick={() => openApp()} className={cls(false)}>
          {user ? <UserRound size={22} aria-hidden /> : <LogIn size={22} aria-hidden />}
          {/* the global button rule resets font size, so the label carries its own */}
          <span className="max-w-full truncate text-[12px] font-semibold leading-normal">{user ? t("common.nav.profile") : t("common.nav.signIn")}</span>
        </button>
      </div>
    </nav>
  );
}
