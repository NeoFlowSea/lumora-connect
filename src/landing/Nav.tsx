import { useEffect, useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";
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
   Desktop: links, language, sign in and one green button.
   Phones: logo, the green button and a menu with the same links as 48px rows. */
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
    { label: t("home.nav.lumora"), href: "#/", on: page === "" },
    { label: t("home.nav.about"), href: "#/about", on: page === "about" },
    { label: t("home.nav.hackathons"), href: "#/hackathons", on: page === "hackathons" },
    { label: t("home.nav.connect"), href: "#/connect", on: page === "connect" || page === "company" },
    { label: t("common.nav.jobs"), href: "#/jobs", on: page === "jobs" },
    { label: t("home.nav.contact"), href: "#/contacts", on: page === "contacts" },
  ];

  const signedIn = !!user;
  const main = signedIn
    ? { label: t("common.nav.openApp"), act: onOpenApp }
    : { label: t("common.nav.signUp"), act: () => go("#/register") };

  const follow = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    onAnchor(e, href);
  };

  return (
    // one solid colour from the first frame; it does not change on scroll
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-paper">
      <div className={`${wrap} flex h-16 items-center gap-4 md:h-18 xl:gap-6`}>
        <a href="#/" onClick={(e) => follow(e, "#/")} aria-label={t("common.brand")} className="flex min-h-11 shrink-0 items-center">
          {/* the mark alone: the nav already says "Lumora" next to it */}
          <LogoTile size={32} />
        </a>

        <nav aria-label={t("landing.nav.label")} className="hidden items-center gap-1 xl:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => follow(e, l.href)} aria-current={l.on ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[15px] transition-colors hover:bg-tint hover:text-ink ${l.on ? "bg-tint text-ink" : "text-mist"}`}>
              {l.label}
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
            {main.label}
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
              <a key={l.href} href={l.href} onClick={(e) => follow(e, l.href)} aria-current={l.on ? "page" : undefined} className={`flex min-h-12 items-center border-b border-line text-[16px] last:border-b-0 ${l.on ? "font-semibold text-ink" : "text-ink/85"}`}>
                {l.label}
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
                {main.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
