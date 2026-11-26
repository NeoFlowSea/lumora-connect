import { useState } from "react";
import { CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import { locale, useLang } from "../i18n";
import { lumora, photo } from "../content/lumora";
import { Countdown } from "../components/Countdown";
import { Fade, wrap } from "./parts";
import { Stable } from "../i18n/Stable";

const GALLERY = ["school21-group", "school21-pitch", "tashkent-stage", "andijan-room"];

/* The next round people can register for, the four questions the jury asks,
   and the real history of past rounds underneath. */
export function NextHackathon({ allRounds = false }: { allRounds?: boolean }) {
  useLang();
  return (
    <section id="hackathons" className="scroll-mt-16 bg-blue-deep py-16 text-white md:py-24">
      <div className={wrap}>
        {/* plain bold heading (the glitch style was removed at the owner's request) */}
        <h2 className="text-[clamp(32px,4.6vw,56px)] font-bold leading-[1.05] tracking-[-0.03em]">
          <Stable k="landing.next.title" />
        </h2>
        <p className="mt-3 max-w-[80ch] text-[16px] text-white"><Stable k="landing.next.lead" /></p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <NextRound />
          <div className="rounded-xl bg-paper/25 p-6 md:p-8">
            <h3 className="text-[19px]"><Stable k="landing.next.juryTitle" /></h3>
            <p className="mt-1 text-[14px] text-white"><Stable k="landing.next.juryLead" /></p>
            <ol className="mt-5 grid gap-4">
              {lumora.judging.map((j, i) => (
                <li key={j.key} className="grid grid-cols-[28px_1fr] items-baseline gap-3">
                  <span className="text-[14px] font-semibold text-white">{i + 1}</span>
                  <span className="text-[17px] font-medium leading-snug"><Stable texts={j.q} /></span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <PastRounds initialAll={allRounds} />
    </section>
  );
}

/* The real next round from src/content/lumora.ts (nextRound): date, venue and partner as the team
   announced them. Registration goes to the Lumora Telegram channel until a form link exists. */
function NextRound() {
  const r = lumora.nextRound;
  const date = new Date(`${r.date}T12:00`).toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" });
  return (
    // the one card on the page that is about something still to come: larger, with an orange outline
    <div className="rounded-xl bg-surface p-6 text-ink shadow-[0_24px_60px_-20px_rgba(3,10,30,0.75)] ring-2 ring-accent md:p-10">
      <span className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-1 text-[14px] font-semibold text-accent">
        <Stable k="landing.next.partner" vars={{ partner: r.partner }} />
      </span>
      <h3 className="mt-4 text-[clamp(32px,4.4vw,54px)] font-bold leading-[1.05] tracking-[-0.03em]">Lumora × {r.partner}</h3>
      <div className="mt-5 flex flex-wrap gap-2.5 text-[16px] font-medium md:text-[17px]">
        <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/5 px-3.5">
          <CalendarDays size={18} aria-hidden className="text-sky" /> {date}
        </span>
        <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/5 px-3.5">
          <MapPin size={18} aria-hidden className="text-sky" /> {r.venue}, <Stable k={`home.city.${r.city}`} />
        </span>
        <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/5 px-3.5">
          <Users size={18} aria-hidden className="text-sky" /> <Stable k="landing.next.team" vars={{ min: r.teamMin, max: r.teamMax }} />
        </span>
      </div>
      <div className="mt-8">
        <div className="mb-3 text-[14px] font-medium text-mist"><Stable k="landing.next.startsIn" /></div>
        <Countdown to={r.start} big />
      </div>
      {/* dark green, across the whole card */}
      <a
        href={lumora.links.telegram}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 flex min-h-14 w-full items-center justify-center rounded-lg bg-go px-8 text-[18px] font-semibold text-white transition-colors hover:bg-go-deep"
      >
        <Stable k="home.hero.register" />
      </a>
    </div>
  );
}

function PastRounds({ initialAll }: { initialAll: boolean }) {
  const { t, tp } = useLang();
  const [all, setAll] = useState(initialAll);
  const rounds = all ? lumora.rounds : lumora.rounds.slice(0, 6);
  const n = (v: number) => v.toLocaleString(locale());
  const date = (iso: string) => new Date(`${iso}T12:00`).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className={`${wrap} mt-14 md:mt-20`}>
      <Fade>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-[clamp(22px,2.6vw,30px)] tracking-[-0.02em]"><Stable k="landing.rounds.title" /></h3>
            <p className="mt-1 text-[15px] text-white/90"><Stable k="landing.rounds.lead" vars={{ n: lumora.rounds.length }} /></p>
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
          {GALLERY.map((p) => (
            <li key={p}>
              <img
                src={photo(p, 800)}
                alt={lumora.photos[p]}
                width={800}
                height={533}
                loading="lazy"
                decoding="async"
                className="aspect-[3/2] w-full rounded-lg bg-paper/30 object-cover"
              />
            </li>
          ))}
        </ul>

        <ul className="mt-6 divide-y divide-white/15 border-y border-white/15">
          {rounds.map((r) => {
            const facts = [
              r.participants ? tp("landing.rounds.people", r.participants, { n: n(r.participants) }) : "",
              r.teams ? tp("landing.rounds.teams", r.teams, { n: n(r.teams) }) : "",
            ].filter(Boolean);
            return (
              <li key={r.id} className="grid gap-x-6 gap-y-1.5 py-3.5 md:grid-cols-[150px_1.4fr_1fr_1fr] md:items-center">
                <span className="inline-flex items-center gap-2 text-[14px] text-white">
                  <CalendarDays size={15} aria-hidden className="shrink-0 text-white/70" />
                  {date(r.date)}
                </span>
                <span className="inline-flex items-start gap-2 text-[16px] font-semibold">
                  <MapPin size={15} aria-hidden className="mt-1 shrink-0 text-white/70" />
                  <span>
                    {r.city}
                    {r.venue && <span className="font-normal text-white">, {r.venue}</span>}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 text-[14px] text-white">
                  {facts.length > 0 && <Users size={15} aria-hidden className="shrink-0 text-white/70" />}
                  {facts.join(", ")}
                </span>
                <span className="inline-flex items-center gap-2 text-[14px] text-white">
                  {r.podium[0] && <Trophy size={15} aria-hidden className="shrink-0 text-accent" />}
                  {r.podium[0] ? t("landing.rounds.winner", { team: r.podium[0] }) : ""}
                </span>
              </li>
            );
          })}
        </ul>
        {lumora.rounds.length > 6 && (
          <button type="button" onClick={() => setAll((a) => !a)} aria-expanded={all} className="mt-4 inline-flex min-h-11 items-center text-[15px] font-semibold text-white underline underline-offset-4">
            {all ? t("landing.rounds.less") : t("landing.rounds.all", { n: lumora.rounds.length })}
          </button>
        )}
      </Fade>
    </div>
  );
}
