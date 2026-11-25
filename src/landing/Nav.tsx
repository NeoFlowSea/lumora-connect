import { useEffect, useState, type MouseEvent } from "react";
import { Briefcase, Handshake, House, Info, Mail, Menu, Trophy, X } from "lucide-react";
import { useLang } from "../i18n";
import { useSession } from "../api/hooks";
import { LogoTile } from "../components/Logo";
import { LangSwitch } from "../components/LangSwitch";
import { btn } from "../components/ui";
import { go, useRoute } from "../lib/router";
import { onAnchor, wrap } from "./parts";
import { Stable } from "../i18n/Stable";

/* Site header for the Lumora home, Lumora Connect and the public pages.
   Links: Lumora (home), About, Hackathons, Connect, Jobs, Contacts; the page you are on is marked.
   Desktop: links, language, sign in and one orange button.
   Phones: logo, the orange button and a menu with the same links as 48px rows. */
export function Nav({ onOpenApp }: { onOpenApp: () => void }) {
  const { t } = useLang();
  const user = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onWide = () => window.innerWidth >= 1280 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onWide);
    };
  }, [open]);

  const page = useRoute().path[0] ?? "";
  const links = [
    // k: dictionary key; labels render with Stable, so switching language does not move the links
    { k: "home.nav.lumora", href: "#/", icon: House, on: page === "" },
    { k: "home.nav.about", href: "#/about", icon: Info, on: page === "about" },
    { k: "home.nav.hackathons", href: "#/hackathons", icon: Trophy, on: page === "hackathons" },
    { k: "home.nav.connect", href: "#/connect", icon: Handshake, on: page === "connect" || page === "company" },
    { k: "common.nav.jobs", href: "#/jobs", icon: Briefcase, on: page === "jobs" },
    { k: "home.nav.contact", href: "#/contacts", icon: Mail, on: page === "contacts" },
  ];

  const signedIn = !!user;
  const main = signedIn
    ? { k: "common.nav.openApp", act: onOpenApp }
    : { k: "common.nav.signUp", act: () => go("#/register") };

  const follow = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    onAnchor(e, href);
  };

  return (
    // one solid colour from the first frame; it does not change on scroll
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-paper">
      <div className={`${wrap} flex h-16 items-center gap-4 md:h-18 xl:gap-4`}>
        <a href="#/" onClick={(e) => follow(e, "#/")} aria-label={t("common.brand")} className="flex min-h-11 shrink-0 items-center">
          {/* the mark alone: the nav already says "Lumora" next to it */}
          <LogoTile size={32} />
        </a>

        <nav aria-label={t("landing.nav.label")} className="hidden items-center gap-2 xl:flex">
          {links.map((l) => (
            // the page you are on lights up in orange (nav-on in index.css)
            <a key={l.href} href={l.href} onClick={(e) => follow(e, l.href)} aria-current={l.on ? "page" : undefined} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[15px] transition-colors ${l.on ? "nav-on font-semibold text-accent" : "text-mist hover:bg-tint hover:text-ink"}`}>
              <l.icon size={17} aria-hidden className="shrink-0" />
              <Stable k={l.k} />
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LangSwitch className="hidden xl:inline-flex" />
          {!signedIn && (
            <button onClick={onOpenApp} className="hidden min-h-11 rounded-lg px-3 text-[15px] font-semibold text-ink transition-colors hover:bg-tint xl:block">
              <Stable k="common.nav.signIn" />
            </button>
          )}
          <button onClick={main.act} className={`${btn.primary} !hidden !min-h-11 !px-4 !text-[14px] whitespace-nowrap sm:!inline-flex`}>
            <Stable k={main.k} />
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? t("common.action.close") : t("common.nav.menu")}
            className="grid h-11 w-11 place-items-center rounded-lg border border-line text-ink transition-colors hover:bg-tint xl:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div id="site-menu" className="border-t border-line bg-paper xl:hidden">
          <nav aria-label={t("landing.nav.label")} className={`${wrap} grid py-2`}>
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => follow(e, l.href)} aria-current={l.on ? "page" : undefined} className={`flex min-h-12 items-center gap-3 border-b border-line text-[16px] last:border-b-0 ${l.on ? "nav-on font-semibold text-accent" : "text-ink/85"}`}>
                <l.icon size={18} aria-hidden className="shrink-0" />
                <Stable k={l.k} />
              </a>
            ))}
          </nav>
          <div className={`${wrap} flex flex-wrap items-center justify-between gap-3 border-t border-line py-4`}>
            <LangSwitch />
            <div className="flex flex-wrap gap-2">
              {!signedIn && (
                <button
                  onClick={() => {
                    setOpen(false);
                    onOpenApp();
                  }}
                  className={btn.ghost}
                >
                  <Stable k="common.nav.signIn" />
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  main.act();
                }}
                className={`${btn.primary} sm:hidden`}
              >
                <Stable k={main.k} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
