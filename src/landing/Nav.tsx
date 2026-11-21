import { useEffect, useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";
import { useLang } from "../i18n";
import { useSession } from "../api/hooks";
import { Wordmark } from "../components/Logo";
import { LangSwitch } from "../components/LangSwitch";
import { btn } from "../components/ui";
import { go } from "../lib/router";
import { onAnchor, wrap } from "./parts";
import { Stable } from "../i18n/Stable";

/* Site header for the landing and the public pages.
   Desktop: links, language, sign in and one yellow button.
   Phones: logo, the yellow button and a menu with the same links as 48px rows. */
export function Nav({ onOpenApp }: { onOpenApp: () => void }) {
  const { t } = useLang();
  const user = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onWide = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onWide);
    };
  }, [open]);

  const links = [
    { label: t("common.nav.jobs"), href: "#/jobs" },
    { label: t("common.nav.talent"), href: "#talent" },
    { label: t("common.nav.hackathons"), href: "#hackathons" },
    { label: t("landing.nav.companies"), href: "#for-companies" },
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
    <header className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${scrolled || open ? "border-line bg-paper/95 backdrop-blur-md" : "border-transparent bg-paper/0"}`}>
      <div className={`${wrap} flex h-16 items-center gap-4 md:h-18 lg:gap-6`}>
        <a href="#/" onClick={(e) => follow(e, "#top")} aria-label={t("common.brand")} className="shrink-0">
          <Wordmark />
        </a>

        <nav aria-label={t("landing.nav.label")} className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => follow(e, l.href)} className="rounded-lg px-3 py-2 text-[15px] text-mist transition-colors hover:bg-tint hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LangSwitch className="hidden lg:inline-flex" />
          {!signedIn && (
            <button onClick={onOpenApp} className="hidden min-h-11 rounded-lg px-3 text-[15px] font-semibold text-ink transition-colors hover:bg-tint lg:block">
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
            className="grid h-11 w-11 place-items-center rounded-lg border border-line text-ink transition-colors hover:bg-tint lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div id="site-menu" className="border-t border-line bg-paper lg:hidden">
          <nav aria-label={t("landing.nav.label")} className={`${wrap} grid py-2`}>
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => follow(e, l.href)} className="flex min-h-12 items-center border-b border-line text-[16px] text-ink last:border-b-0">
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
