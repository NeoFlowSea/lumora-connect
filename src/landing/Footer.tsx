import { useLang } from "../i18n";
import { lumora } from "../content/lumora";
import { Wordmark } from "../components/Logo";
import { isExternal, onAnchor, wrap } from "./parts";
import { sectionLink } from "../lib/router";
import { Stable } from "../i18n/Stable";

/* Every link goes to a real route, a section of the home or Connect page, or a real Lumora channel. */
export function Footer() {
  const { t } = useLang();
  const columns: { h: string; l: [string, string][] }[] = [
    {
      h: t("landing.footer.students"),
      l: [
        [t("landing.footer.createProfile"), "#/register?type=talent"],
        [t("common.nav.jobs"), "#/jobs"],
        [t("landing.footer.nextRound"), sectionLink("hackathons", "hackathons")],
        [t("landing.footer.projects"), sectionLink("hackathons", "talent")],
      ],
    },
    {
      h: t("landing.footer.companies"),
      l: [
        [t("landing.footer.registerCompany"), "#/register?type=company"],
        [t("landing.footer.howCompanies"), sectionLink("connect", "for-companies")],
        [t("landing.footer.faq"), sectionLink("connect", "faq")],
        [t("common.nav.signIn"), "#/login"],
      ],
    },
    {
      h: t("home.footer.lumora"),
      l: [
        [t("home.nav.about"), "#/about"],
        [t("home.nav.hackathons"), "#/hackathons"],
        [t("home.nav.connect"), "#/connect"],
        [t("home.nav.contact"), "#/contacts"],
        ["Telegram", lumora.links.telegram],
        ["Instagram", lumora.links.instagram],
        ["LinkedIn", lumora.links.linkedin],
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-cloud">
      <div className={`${wrap} grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:py-14`}>
        <div>
          <a href="#/" onClick={(e) => onAnchor(e, "#/")} aria-label={t("common.brand")} className="inline-flex min-h-11 items-center">
            <Wordmark connect={false} />
          </a>
          <p className="mt-4 max-w-[48ch] text-[14px] text-mist"><Stable k="common.footer.tagline" /></p>
        </div>
        {columns.map((c) => (
          <nav key={c.h} aria-label={c.h}>
            <h2 className="text-[14px] font-semibold tracking-normal">{c.h}</h2>
            <ul className="mt-2 text-[14px] text-mist">
              {c.l.map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={(e) => onAnchor(e, href)}
                    {...(isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="inline-flex min-h-11 items-center transition-colors hover:text-ink md:min-h-9"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className={`${wrap} flex flex-col gap-3 py-5 text-[13px] text-mist md:flex-row md:items-center md:justify-between`}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>© 2026 Lumora</span>
            <a href="#/privacy" className="inline-flex min-h-11 items-center hover:text-ink md:min-h-0">
              <Stable k="common.footer.privacy" />
            </a>
            <a href="#/terms" className="inline-flex min-h-11 items-center hover:text-ink md:min-h-0">
              <Stable k="common.footer.terms" />
            </a>
          </div>
          <span><Stable k="common.footer.preview" /></span>
        </div>
      </div>
    </footer>
  );
}
