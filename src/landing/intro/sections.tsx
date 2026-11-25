import { useState, type FormEvent } from "react";
import { ExternalLink } from "lucide-react";
import { useLang } from "../../i18n";
import { Stable } from "../../i18n/Stable";
import { lumora, photo } from "../../content/lumora";
import { btn } from "../../components/ui";
import { Countdown } from "../../components/Countdown";
import { Fade, Rise, Section, SectionHead } from "../parts";
import { CASE_PARTNERS, NEXT_ROUND, NUMBERS, PARTNERS, REGIONS, WINNERS, bigDate, latestRound, monthYearShort } from "./content";
import { registerTeam } from "./register";

/* Sections of the intro home, in the order of the brief: numbers, how a round works, regions,
   cases and winners, partners, Lumora Connect, for companies, next round. Each one is laid out
   differently on purpose (see the anti-slop skill). */

const shortDate = monthYearShort;

/* ---------- numbers: four cards, the first one carries the colour ---------- */
export function Numbers() {
  useLang();
  return (
    <Section id="numbers" className="border-t border-line !py-14 md:!py-20">
      <Fade>
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[clamp(22px,2.4vw,28px)] tracking-[-0.02em]"><Stable k="intro.numbers.title" /></h2>
          <p className="text-[14px] text-mist"><Stable k="intro.numbers.asOf" /></p>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:gap-4">
          {NUMBERS.map((n, i) => (
            <Rise key={n.key} i={i} className={`flex min-h-[150px] flex-col justify-between rounded-xl p-5 md:min-h-[190px] md:p-6 ${i === 0 ? "bg-blue" : "border border-line"}`}>
              <span className="text-[clamp(38px,5vw,64px)] font-semibold leading-none tracking-[-0.04em] tabular-nums">{n.value}</span>
              <span className={`mt-4 text-[14px] leading-snug md:text-[15px] ${i === 0 ? "text-ink/90" : "text-mist"}`}>
                <Stable k={`intro.numbers.${n.key}`} />
              </span>
            </Rise>
          ))}
        </ul>
      </Fade>
    </Section>
  );
}

/* ---------- how it works: a numbered line, then the judges' four criteria next to a photo ---------- */
const HOW = ["partner", "case", "build", "defend"] as const;
const CRITERIA = [
  { key: "problem", judging: "problem" },
  { key: "product", judging: "product" },
  { key: "logic", judging: "reasoning" },
  { key: "presentation", judging: "delivery" },
] as const;

export function HowItWorks() {
  useLang();
  return (
    <Section id="how" className="border-t border-line">
      <Fade>
        <SectionHead title={<Stable k="intro.how.title" />} lead={<Stable k="intro.how.lead" />} />
        <ol className="grid gap-x-6 gap-y-8 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW.map((h, i) => (
            <li key={h}>
              <div className="text-[13px] tabular-nums text-sky">0{i + 1}</div>
              <h3 className="mt-2 text-[22px] tracking-[-0.02em]"><Stable k={`intro.how.${h}`} /></h3>
              <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-mist"><Stable k={`intro.how.${h}.text`} /></p>
            </li>
          ))}
        </ol>

        <div className="mt-14 grid items-stretch gap-6 md:grid-cols-[0.9fr_1.1fr] md:gap-10">
          <img
            src={photo("school21-judge", 800)}
            alt={lumora.photos["school21-judge"]}
            width={800}
            height={533}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] h-full w-full rounded-xl bg-cloud object-cover"
          />
          <div>
            <h3 className="text-[clamp(22px,2.4vw,28px)] tracking-[-0.02em]"><Stable k="intro.how.criteria" /></h3>
            <dl className="mt-5 divide-y divide-line border-y border-line">
              {CRITERIA.map((c) => (
                <div key={c.key} className="grid gap-1 py-4 sm:grid-cols-[150px_1fr] sm:gap-6">
                  <dt className="text-[17px] font-semibold"><Stable k={`intro.crit.${c.key}`} /></dt>
                  <dd className="text-[16px] text-mist">
                    <Stable texts={lumora.judging.find((j) => j.key === c.judging)!.q} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Fade>
    </Section>
  );
}

/* ---------- regions: a plain list, no cards ---------- */
export function Regions() {
  useLang();
  return (
    <Section id="regions" className="bg-cloud">
      <Fade>
        <SectionHead title={<Stable k="intro.regions.title" />} lead={<Stable k="intro.regions.lead" />} />
        <ul className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
          {REGIONS.map((r) => {
            const last = latestRound(r.match);
            return (
              <li key={r.key} className="flex min-h-13 items-baseline justify-between gap-4 border-b border-line py-3">
                <span className="text-[17px] font-medium"><Stable k={`intro.region.${r.key}`} /></span>
                {last && <span className="shrink-0 text-[14px] tabular-nums text-mist">{shortDate(last)}</span>}
              </li>
            );
          })}
        </ul>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-[14px] text-mist"><Stable k="intro.regions.abroad" /></span>
          <span className="text-[24px] font-semibold tracking-[-0.02em] text-sky"><Stable k="intro.region.kazakhstan" /></span>
        </div>
      </Fade>
    </Section>
  );
}

/* ---------- cases and winners: one large project, three in a column ---------- */
export function Cases() {
  useLang();
  const projects = WINNERS.map((name) => lumora.projects.find((p) => p.project === name)!).filter(Boolean);
  const [lead, ...rest] = projects;
  return (
    <Section id="cases" className="border-t border-line">
      <Fade>
        <SectionHead title={<Stable k="intro.cases.title" />} lead={<Stable k="intro.cases.lead" />} />
        <div className="mb-10 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[14px] text-mist"><Stable k="intro.cases.from" /></span>
          {CASE_PARTNERS.map((p) => (
            <span key={p} className="rounded-md border border-line px-2.5 py-1 text-[15px] font-medium">
              {p}
            </span>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
          {lead && (
            <article>
              <img
                src={photo(lead.photo, 1600)}
                alt={lumora.photos[lead.photo]}
                width={1600}
                height={1067}
                loading="lazy"
                decoding="async"
                className="aspect-[3/2] w-full rounded-xl bg-cloud object-cover"
              />
              <Project p={lead} big />
            </article>
          )}
          <ul className="grid content-start gap-6">
            {rest.map((p) => (
              <li key={p.project} className="grid grid-cols-[112px_1fr] gap-4 sm:grid-cols-[160px_1fr]">
                <img
                  src={photo(p.photo, 800)}
                  alt={lumora.photos[p.photo]}
                  width={800}
                  height={533}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-lg bg-cloud object-cover"
                />
                <Project p={p} />
              </li>
            ))}
          </ul>
        </div>
      </Fade>
    </Section>
  );
}

function Project({ p, big = false }: { p: (typeof lumora.projects)[number]; big?: boolean }) {
  const { t } = useLang();
  const date = shortDate(p.date);
  return (
    <div className={big ? "mt-5" : "min-w-0"}>
      <div className="text-[13px] text-sky">
        {t("intro.cases.place")}, {p.event}, {date}
      </div>
      <h3 className={`mt-1 tracking-[-0.02em] ${big ? "text-[clamp(26px,3vw,36px)]" : "text-[19px]"}`}>{p.project}</h3>
      <p className={`mt-2 leading-relaxed text-mist ${big ? "max-w-[60ch] text-[16px]" : "text-[14px]"}`}>
        <Stable texts={p.summary} />
      </p>
      <p className="mt-2 text-[13px] text-mist">
        {t("intro.cases.team", { team: p.team })} · {t("intro.cases.partner", { partner: p.partner })}
      </p>
    </div>
  );
}

/* ---------- partners: name plates until the logo files arrive ---------- */
export function Partners() {
  useLang();
  return (
    <Section id="partners" className="border-t border-line">
      <Fade>
        <SectionHead title={<Stable k="intro.partners.title" />} lead={<Stable k="intro.partners.lead" />} />
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-4">
          {PARTNERS.map((p) => (
            <li key={p} className="grid min-h-[84px] place-items-center bg-paper px-4 py-5 text-center text-[16px] font-semibold tracking-[-0.01em] text-ink/90 md:min-h-[104px] md:text-[18px]">
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-mist"><Stable k="intro.partners.logoNote" /></p>
      </Fade>
    </Section>
  );
}

/* ---------- Lumora Connect: coming soon, with an email field ---------- */
const WAITLIST = "lumora-connect-waitlist";

export function ConnectSoon() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(true);
      return;
    }
    try {
      const list: string[] = JSON.parse(localStorage.getItem(WAITLIST) ?? "[]");
      if (!list.includes(value)) localStorage.setItem(WAITLIST, JSON.stringify([...list, value]));
    } catch {
      /* the preview has no server; nothing else to do */
    }
    setError(false);
    setSaved(value);
  };

  return (
    <Section id="connect" className="border-t border-line">
      <div className="grid gap-8 rounded-2xl bg-blue p-7 md:grid-cols-[1.1fr_1fr] md:gap-12 md:p-12">
        <div>
          <p className="text-[14px] font-medium text-ink/85"><Stable k="intro.connect.kicker" /></p>
          <h2 className="mt-2 text-[clamp(28px,3.4vw,42px)] tracking-[-0.03em]"><Stable k="intro.connect.title" /></h2>
          <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-ink/90"><Stable k="intro.connect.text" /></p>
          <a href="#/connect" className="mt-5 inline-flex min-h-11 items-center text-[15px] font-semibold text-ink underline underline-offset-4">
            {t("intro.connect.preview")}
          </a>
        </div>
        <form onSubmit={submit} noValidate className="self-center">
          {saved ? (
            <p role="status" className="rounded-lg bg-paper/40 p-4 text-[16px]">
              {t("intro.connect.done", { email: saved })}
            </p>
          ) : (
            <>
              <label htmlFor="connect-email" className="text-[14px] font-medium">
                {t("intro.connect.email")}
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="connect-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={error || undefined}
                  aria-describedby={error ? "connect-email-error" : "connect-email-note"}
                  placeholder="name@example.com"
                  className="min-h-12 w-full min-w-0 rounded-lg border border-ink/25 bg-paper px-4 text-[16px] text-ink placeholder:text-mist focus:border-ink"
                />
                <button type="submit" className="min-h-12 shrink-0 rounded-lg bg-ink px-5 text-[15px] font-semibold text-paper transition-colors hover:bg-white">
                  {t("intro.connect.submit")}
                </button>
              </div>
              {error ? (
                <p id="connect-email-error" className="mt-2 text-[14px] font-medium text-ink">
                  {t("intro.connect.invalid")}
                </p>
              ) : (
                <p id="connect-email-note" className="mt-2 text-[13px] text-ink/80">
                  {t("intro.connect.note")}
                </p>
              )}
            </>
          )}
        </form>
      </div>
    </Section>
  );
}

/* ---------- for companies: three plain lines and a photo ---------- */
const GETS = ["case", "judges", "hires"] as const;

export function ForCompanies() {
  const { t } = useLang();
  return (
    <Section id="companies" className="border-t border-line">
      <Fade className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
        <div>
          <h2 className="text-[clamp(28px,3.4vw,44px)] tracking-[-0.03em]"><Stable k="intro.companies.title" /></h2>
          <p className="mt-3 max-w-[52ch] text-[17px] leading-relaxed text-mist"><Stable k="intro.companies.lead" /></p>
          <ul className="mt-8 grid gap-6">
            {GETS.map((g) => (
              <li key={g} className="border-t border-line pt-4">
                <h3 className="text-[20px] tracking-[-0.015em]"><Stable k={`intro.companies.${g}`} /></h3>
                <p className="mt-1 text-[15px] text-mist"><Stable k={`intro.companies.${g}.text`} /></p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href={lumora.links.telegram} target="_blank" rel="noopener noreferrer" className={btn.primary}>
              {t("intro.companies.cta")}
              <ExternalLink size={16} aria-hidden />
            </a>
            <span className="text-[14px] text-mist"><Stable k="intro.companies.ctaNote" /></span>
          </div>
        </div>
        <img
          src={photo("school21-pitch", 1600)}
          alt={lumora.photos["school21-pitch"]}
          width={1600}
          height={1067}
          loading="lazy"
          decoding="async"
          className="aspect-[4/5] w-full rounded-xl bg-cloud object-cover lg:aspect-auto lg:h-full"
        />
      </Fade>
    </Section>
  );
}

/* ---------- next round and registration ---------- */
export function NextRound() {
  const { t } = useLang();
  const start = new Date(NEXT_ROUND.start);
  const { day, month, weekday } = bigDate(start);
  return (
    <Section id="next" className="bg-cloud">
      <Fade className="grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-16">
        <div>
          <h2 className="text-[15px] font-medium text-sky"><Stable k="intro.next.title" /></h2>
          <div className="mt-3 flex items-end gap-4">
            <span className="text-[clamp(88px,12vw,150px)] font-semibold leading-[0.85] tracking-[-0.05em] tabular-nums">{day}</span>
            <span className="pb-2 text-[18px] leading-tight">
              {month}
              <br />
              <span className="text-mist">{weekday}</span>
            </span>
          </div>
        </div>
        <div className="lg:pt-8">
          <p className="text-[clamp(24px,2.8vw,34px)] font-semibold leading-tight tracking-[-0.025em]">
            {NEXT_ROUND.venue}, <Stable k="intro.next.city" />
          </p>
          <p className="mt-2 text-[16px] text-mist"><Stable k="intro.next.team" /></p>
          <div className="mt-6">
            <div className="mb-2 text-[13px] text-mist"><Stable k="intro.next.startsIn" /></div>
            <Countdown to={NEXT_ROUND.start} />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <button type="button" onClick={registerTeam} className={`${btn.primary} !min-h-13 !px-6 !text-[16px]`}>
              {t("intro.next.register")}
            </button>
            <span className="max-w-[44ch] text-[14px] text-mist"><Stable k="intro.next.how" /></span>
          </div>
        </div>
      </Fade>
    </Section>
  );
}
