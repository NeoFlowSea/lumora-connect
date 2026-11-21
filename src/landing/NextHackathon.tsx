import { useState } from "react";
import { CalendarDays, Globe, MapPin, Users } from "lucide-react";
import { locale, useLang } from "../i18n";
import { api } from "../api";
import { useApi } from "../api/hooks";
import type { Hackathon } from "../api/types";
import { lumora, photo } from "../content/lumora";
import { Countdown } from "../components/Countdown";
import { GlitchText } from "../components/GlitchText";
import { Skeleton, when } from "../components/form";
import { btn } from "../components/ui";
import { openApp } from "../pages/PublicFrame";
import { Fade, SampleTag, wrap } from "./parts";
import { Stable, trackTexts } from "../i18n/Stable";

const GALLERY = ["school21-group", "school21-pitch", "tashkent-stage", "andijan-room"];

/* The next round people can register for, the four questions the jury asks,
   and the real history of past rounds underneath. */
export function NextHackathon() {
  const { t } = useLang();
  const list = useApi(() => api.hackathons.list(), []);
  const upcoming = (list.data ?? []).filter((h) => !["finished", "cancelled", "draft"].includes(h.status));
  const next = upcoming.filter((h) => h.status === "registration_open").sort((a, b) => a.start.localeCompare(b.start))[0] ?? upcoming[0];

  return (
    <section id="hackathons" className="scroll-mt-16 bg-blue-deep py-16 text-white md:py-24">
      <div className={wrap}>
        <h2 className="font-glitch text-[clamp(32px,4.6vw,56px)] font-normal leading-[1.05] tracking-normal">
          <GlitchText text={t("landing.next.title")} />
        </h2>
        <p className="mt-3 max-w-[80ch] text-[16px] text-white/90"><Stable k="landing.next.lead" /></p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          {next ? <EventCard h={next} /> : list.loading ? <Skeleton rows={1} className="h-[360px]" /> : <NoEvent />}
          <div className="rounded-xl bg-paper/25 p-6 md:p-8">
            <h3 className="text-[19px]"><Stable k="landing.next.juryTitle" /></h3>
            <p className="mt-1 text-[14px] text-white/90"><Stable k="landing.next.juryLead" /></p>
            <ol className="mt-5 grid gap-4">
              {lumora.judging.map((j, i) => (
                <li key={j.key} className="grid grid-cols-[28px_1fr] items-baseline gap-3">
                  <span className="text-[14px] font-semibold text-white/90">{i + 1}</span>
                  <span className="text-[17px] font-medium leading-snug"><Stable texts={j.q} /></span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <PastRounds />
    </section>
  );
}

function EventCard({ h }: { h: Hackathon }) {
  const { t } = useLang();
  const open = h.status === "registration_open";
  return (
    <div className="rounded-xl bg-surface p-6 text-ink md:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14px] text-mist">{h.organizerName}</span>
        {h.demo && <SampleTag />}
      </div>
      <h3 className="mt-2 text-[clamp(22px,2.6vw,30px)] tracking-[-0.02em]">{h.title}</h3>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-mist">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={15} /> {when(h.start)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          {h.mode === "online" ? <Globe size={15} /> : <MapPin size={15} />}
          {h.mode === "online" ? t("landing.next.online") : [h.city, h.venue].filter(Boolean).join(", ")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users size={15} /> <Stable k="landing.next.team" vars={{ min: h.teamMin, max: h.teamMax }} />
        </span>
      </div>
      {h.short && <p className="mt-4 max-w-[80ch] text-[15px] text-ink/90">{h.short}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {h.tracks.map((x) => (
          <span key={x} className="rounded-md bg-tint px-2 py-0.5 text-[13px] font-medium text-sky">
            <Stable texts={trackTexts(x)} />
          </span>
        ))}
      </div>
      <div className="mt-6">
        <div className="mb-2 text-[13px] text-mist"><Stable k="landing.next.startsIn" /></div>
        <Countdown to={h.start} />
      </div>
      <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
        <button onClick={() => openApp(`#/app/hackathons/${h.id}`)} className={btn.primary}>
          {open ? t("landing.next.register") : t("landing.next.see")}
        </button>
        {h.places[0]?.prize && <span className="text-[14px] text-mist">{t("landing.next.prize", { prize: h.places[0].prize })}</span>}
      </div>
    </div>
  );
}

function NoEvent() {
  useLang();
  return (
    <div className="rounded-xl bg-surface p-6 text-ink md:p-8">
      <h3 className="text-[20px]"><Stable k="landing.next.noneTitle" /></h3>
      <p className="mt-2 text-[15px] text-mist"><Stable k="landing.next.noneText" /></p>
      <a href={lumora.links.telegram} target="_blank" rel="noopener noreferrer" className={`${btn.primary} mt-6`}>
        <Stable k="landing.next.follow" />
      </a>
    </div>
  );
}

function PastRounds() {
  const { t, tp } = useLang();
  const [all, setAll] = useState(false);
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
              <li key={r.id} className="grid gap-x-6 gap-y-1 py-3.5 md:grid-cols-[130px_1.4fr_1fr_1fr] md:items-baseline">
                <span className="text-[14px] text-white/90">{date(r.date)}</span>
                <span className="text-[16px] font-semibold">
                  {r.city}
                  {r.venue && <span className="font-normal text-white/90">, {r.venue}</span>}
                </span>
                <span className="text-[14px] text-white/90">{facts.join(", ")}</span>
                <span className="text-[14px] text-white/90">{r.podium[0] ? t("landing.rounds.winner", { team: r.podium[0] }) : ""}</span>
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
