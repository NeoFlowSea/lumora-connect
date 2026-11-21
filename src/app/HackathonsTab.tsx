import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, CalendarDays, Check, Clock, ExternalLink, Globe, MapPin, Plus, Trophy, Users, X } from "lucide-react";
import { api, localNow, statusLabel } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { Badge, Hackathon, TalentProfile, TeamRegistration } from "../api/types";
import { Empty, ErrorNote, Field, Input, Select, Skeleton, Spinner, Textarea, when } from "../components/form";
import { Modal, Pill, btn, useToast } from "../components/ui";
import { lumora, photo } from "../content/lumora";
import { getLang, locale, t, tp, trackLabel, useLang } from "../i18n";
import { go } from "../lib/router";

/* #/app/hackathons and #/app/hackathons/:id
   Upcoming events first, then the archive of real Lumora rounds. Upcoming events and
   the Demo Cup are samples (demo: true) and say so. */

/* ---------- small helpers ---------- */

const num = (n: number) => n.toLocaleString(locale());

/** stored titles like "1st place" and "Finalist" are English; show them in the interface language */
export function placeTitle(title: string): string {
  const m = /^(\d+)(st|nd|rd|th) place$/i.exec(title.trim());
  if (m && getLang() !== "en") return t("app.hack.placeN", { n: m[1] });
  if (/^finalist$/i.test(title.trim())) return t("app.hack.finalist");
  return title;
}

const typeName = (h: Pick<Hackathon, "eventType">) => t(`app.hack.type.${h.eventType}`);
const modeName = (h: Pick<Hackathon, "mode">) => t(`app.hack.mode.${h.mode}`);
const whereShort = (h: Hackathon) => (h.mode === "online" ? t("app.hack.mode.online") : h.city);
const langName = (l: string) => {
  const k = `app.hack.lang.${l}`;
  const s = t(k);
  return s === k ? l : s;
};

/** seeded archive texts are generated in English; only show descriptions somebody wrote */
const writtenText = (h: Hackathon) =>
  h.description.trim() && !/^Lumora IT case competition in /.test(h.description) && h.description !== `Case: ${h.caseBrief}` ? h.description : "";

type Reg = "open" | "soon" | "closed" | "full" | "live" | "over" | "cancelled" | "draft";

function regState(h: Hackathon, teams: number): Reg {
  if (h.status === "cancelled") return "cancelled";
  if (h.status === "finished") return "over";
  if (h.status === "in_progress") return "live";
  if (h.status === "draft") return "draft";
  const now = localNow();
  if (h.status === "published" || (h.regOpen && now < h.regOpen)) return "soon";
  if (h.status === "registration_closed" || (h.regClose && now > h.regClose)) return "closed";
  if (h.maxTeams && teams >= h.maxTeams) return "full";
  return "open";
}

function regLine(h: Hackathon, state: Reg): string {
  if (state === "open") return h.regClose ? t("app.hack.regUntil", { date: when(h.regClose) }) : t("app.hack.reg.open");
  if (state === "soon") return h.regOpen ? t("app.hack.regOpens", { date: when(h.regOpen) }) : t("app.hack.reg.soon");
  return t(`app.hack.reg.${state}`);
}

function spotsLeft(h: Hackathon, teams: number): string {
  if (!h.maxTeams) return t("app.hack.noLimit");
  const left = Math.max(0, h.maxTeams - teams);
  return tp("app.hack.spots", left, { max: num(h.maxTeams) });
}

const teamSize = (h: Hackathon) =>
  h.teamMin === h.teamMax ? tp("app.hack.teamOf", h.teamMin) : t("app.hack.teamRange", { min: h.teamMin, max: h.teamMax });

/* ---------- countdown: Press Start 2P digits, no animation ---------- */

function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function Countdown({ to }: { to: string }) {
  const now = useNow(1000);
  const diff = Math.max(0, new Date(to).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const parts = [
    { v: d, l: t("app.hack.cd.days") },
    { v: h, l: t("app.hack.cd.hours") },
    { v: m, l: t("app.hack.cd.min") },
    { v: s, l: t("app.hack.cd.sec") },
  ];
  return (
    <div role="timer" aria-label={t("app.hack.cd.aria", { d, h, m })} className="flex gap-2">
      {parts.map((p) => (
        <div key={p.l} aria-hidden className="min-w-[56px] rounded-lg bg-paper/70 px-2 py-2 text-center">
          <div className="font-pixel text-[15px] leading-none text-accent">{String(p.v).padStart(2, "0")}</div>
          <div className="mt-1.5 text-[12px] text-mist">{p.l}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- photo ---------- */

function EventPhoto({ name, className = "", sizes = 800 }: { name: string; className?: string; sizes?: 800 | 1600 }) {
  if (!name) return null;
  return <img src={photo(name, sizes)} alt={lumora.photos[name] ?? ""} loading="lazy" decoding="async" className={`block w-full object-cover ${className}`} />;
}

/* ---------- page ---------- */

export function HackathonsTab({ focusId }: { focusId?: string } = {}) {
  useLang();
  const user = useSession();
  const list = useApi(() => api.hackathons.list(), []);
  const mine = useApi(() => api.hackathons.myTeams(), [user?.id]);
  const counts = useApi(() => api.hackathons.teamCounts(), []);
  const [registerFor, setRegisterFor] = useState<Hackathon | null>(null);

  const { upcoming, past, samples } = useMemo(() => {
    const all = list.data ?? [];
    const now = localNow();
    return {
      upcoming: all.filter((h) => h.status !== "finished" && h.status !== "draft" && !(h.status === "cancelled" && h.end < now)),
      past: all.filter((h) => h.status === "finished" && !h.demo).sort((a, b) => b.start.localeCompare(a.start)),
      samples: all.filter((h) => h.status === "finished" && h.demo).sort((a, b) => b.start.localeCompare(a.start)),
    };
  }, [list.data]);

  const teamBy = useMemo(() => {
    const m: Record<string, TeamRegistration> = {};
    for (const x of mine.data ?? []) m[x.hackathonId] = x;
    return m;
  }, [mine.data]);

  if (!user || user.kind === "admin") return null;
  const isTalent = user.kind === "talent";
  const teamsOf = (h: Hackathon) => counts.data?.[h.id] ?? 0;

  if (focusId) {
    if (list.loading) return <Skeleton rows={2} className="h-64" />;
    const focus = (list.data ?? []).find((h) => h.id === focusId);
    if (!focus)
      return (
        <Empty
          icon={<Trophy size={22} />}
          title={t("app.hack.missingTitle")}
          text={t("app.hack.missingText")}
          action={
            <button onClick={() => go("#/app/hackathons")} className={btn.ghost}>
              {t("app.hack.allEvents")}
            </button>
          }
        />
      );
    return (
      <>
        <EventDetail h={focus} team={teamBy[focus.id]} teams={teamsOf(focus)} isTalent={isTalent} onRegister={() => setRegisterFor(focus)} />
        <RegisterModal h={registerFor} onClose={() => setRegisterFor(null)} />
      </>
    );
  }

  const featured = upcoming.find((h) => h.status !== "cancelled");
  const rest = upcoming.filter((h) => h !== featured);

  return (
    <div className="min-w-0">
      <h1 className="text-[clamp(26px,3vw,34px)]">{t("app.hack.title")}</h1>
      <p className="mt-1 max-w-[62ch] text-[14px] text-mist">{t(isTalent ? "app.hack.leadTalent" : "app.hack.leadCompany")}</p>

      {list.loading ? (
        <div className="mt-6">
          <Skeleton rows={2} className="h-56" />
        </div>
      ) : list.error ? (
        <div className="mt-6">
          <ErrorNote>{list.error}</ErrorNote>
        </div>
      ) : (
        <>
          <section className="mt-7" aria-labelledby="h-upcoming">
            <h2 id="h-upcoming" className="text-[19px]">
              {t("app.hack.upcoming")}
            </h2>
            {!featured ? (
              <div className="mt-4">
                <Empty icon={<CalendarDays size={22} />} title={t("app.hack.noUpcoming")} text={t("app.hack.noUpcomingText")} />
              </div>
            ) : (
              <>
                <Featured h={featured} team={teamBy[featured.id]} teams={teamsOf(featured)} isTalent={isTalent} onRegister={() => setRegisterFor(featured)} />
                {rest.length > 0 && (
                  <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {rest.map((h) => (
                      <li key={h.id} className="min-w-0">
                        <UpcomingCard h={h} team={teamBy[h.id]} teams={teamsOf(h)} />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          <section className="mt-12" aria-labelledby="h-past">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 id="h-past" className="text-[19px]">
                {t("app.hack.past")}
              </h2>
              <span className="text-[13px] text-mist">{tp("app.hack.roundsCount", past.length)}</span>
            </div>
            <p className="mt-1 max-w-[62ch] text-[13px] text-mist">{t("app.hack.pastLead")}</p>
            {past.length === 0 ? (
              <div className="mt-4">
                <Empty icon={<Trophy size={22} />} title={t("app.hack.noPast")} />
              </div>
            ) : (
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {past.map((h) => (
                  <li key={h.id} className="min-w-0">
                    <RoundCard h={h} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {samples.length > 0 && (
            <section className="mt-12" aria-labelledby="h-samples">
              <h2 id="h-samples" className="text-[19px]">
                {t("app.hack.samples")}
              </h2>
              <p className="mt-1 max-w-[62ch] text-[13px] text-mist">{t("app.hack.samplesLead")}</p>
              <ul className="mt-4 grid gap-4">
                {samples.map((h) => (
                  <li key={h.id}>
                    <SampleResults h={h} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <RegisterModal h={registerFor} onClose={() => setRegisterFor(null)} />
    </div>
  );
}

/* ---------- cards ---------- */

function Tags({ h }: { h: Hackathon }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Pill tone="line">{typeName(h)}</Pill>
      <Pill tone={h.status === "registration_open" ? "good" : h.status === "cancelled" ? "line" : "tint"}>{statusLabel(h.status)}</Pill>
      {h.organizerId !== "lumora" && <Pill tone="line">{t("app.hack.partnerEvent")}</Pill>}
      {h.demo && <Pill tone="line">{t("app.hack.demo")}</Pill>}
    </div>
  );
}

function MetaLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-start gap-1.5">
      <span className="mt-[3px] shrink-0">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

function Featured({ h, team, teams, isTalent, onRegister }: { h: Hackathon; team?: TeamRegistration; teams: number; isTalent: boolean; onRegister: () => void }) {
  const state = regState(h, teams);
  const first = h.places[0];
  return (
    <article className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
      <div className={`grid ${h.photo ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" : ""}`}>
        {h.photo && <EventPhoto name={h.photo} sizes={1600} className="aspect-[16/10] h-full md:aspect-auto md:min-h-[320px]" />}
        <div className="min-w-0 p-5 md:p-7">
          <div className="text-[13px] font-semibold text-sky">{t("app.hack.nextUp")}</div>
          <div className="mt-2">
            <Tags h={h} />
          </div>
          <h3 className="mt-3 break-words text-[clamp(22px,2.6vw,30px)] leading-tight">{h.title}</h3>
          <div className="mt-3 grid gap-1.5 text-[14px] text-mist">
            <MetaLine icon={<CalendarDays size={15} />}>{when(h.start)}</MetaLine>
            <MetaLine icon={h.mode === "online" ? <Globe size={15} /> : <MapPin size={15} />}>
              {[whereShort(h), h.mode !== "online" ? h.venue : ""].filter(Boolean).join(", ")}
              {h.mode === "hybrid" ? `, ${modeName(h).toLowerCase()}` : ""}
            </MetaLine>
            <MetaLine icon={<Users size={15} />}>
              {teamSize(h)}. {spotsLeft(h, teams)}
            </MetaLine>
          </div>
          {h.short && <p className="mt-4 max-w-[58ch] text-[14px] leading-relaxed">{h.short}</p>}
          <div className="mt-5">
            <div className="mb-2 text-[13px] text-mist">{t("app.hack.startsIn")}</div>
            <Countdown to={h.start} />
          </div>
          <p className="mt-4 text-[13px] text-mist">
            <Clock size={13} className="mr-1.5 inline align-[-2px]" />
            {regLine(h, state)}
            {first?.prize ? `. ${t("app.hack.firstPrize", { prize: first.prize })}` : ""}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {isTalent && <RegisterAction state={state} team={team} onRegister={onRegister} />}
            <button onClick={() => go(`#/app/hackathons/${h.id}`)} className={btn.ghost}>
              {t("app.hack.details")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function RegisterAction({ state, team, onRegister, small }: { state: Reg; team?: TeamRegistration; onRegister: () => void; small?: boolean }) {
  if (team)
    return (
      <span className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-good/15 px-4 font-semibold text-good ${small ? "text-[13px]" : "text-[15px]"}`}>
        <Check size={16} /> {t("app.hack.registered")}
      </span>
    );
  if (state !== "open") return null;
  return (
    <button onClick={onRegister} className={btn.primary}>
      {t("app.hack.register")}
    </button>
  );
}

function UpcomingCard({ h, team, teams }: { h: Hackathon; team?: TeamRegistration; teams: number }) {
  const state = regState(h, teams);
  return (
    <button
      onClick={() => go(`#/app/hackathons/${h.id}`)}
      className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-surface text-left transition-colors hover:border-sky"
    >
      {h.photo && <EventPhoto name={h.photo} className="aspect-[16/9]" />}
      <div className="flex min-w-0 flex-1 flex-col p-4 md:p-5">
        <Tags h={h} />
        <h3 className="mt-3 break-words text-[17px] leading-snug">{h.title}</h3>
        <div className="mt-2 grid gap-1 text-[13px] text-mist">
          <MetaLine icon={<CalendarDays size={14} />}>{when(h.start)}</MetaLine>
          <MetaLine icon={h.mode === "online" ? <Globe size={14} /> : <MapPin size={14} />}>
            {whereShort(h)}, {modeName(h).toLowerCase()}
          </MetaLine>
          <MetaLine icon={<Clock size={14} />}>{regLine(h, state)}</MetaLine>
          <MetaLine icon={<Users size={14} />}>{spotsLeft(h, teams)}</MetaLine>
        </div>
        {h.tracks.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {h.tracks.slice(0, 3).map((x) => (
              <span key={x} className="rounded-md bg-tint px-2 py-0.5 text-[12px] text-sky">
                {trackLabel(x)}
              </span>
            ))}
            {h.tracks.length > 3 && <span className="px-1 py-0.5 text-[12px] text-mist">+{h.tracks.length - 3}</span>}
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-[13px]">
          {h.places[0]?.prize ? (
            <span className="min-w-0 break-words">
              <Trophy size={13} className="mr-1 inline align-[-2px] text-accent" />
              {h.places[0].prize}
            </span>
          ) : (
            <span />
          )}
          {team && (
            <span className="inline-flex items-center gap-1 font-semibold text-good">
              <Check size={14} /> {t("app.hack.registered")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Podium({ names }: { names: string[] }) {
  return (
    <ol className="grid gap-1.5">
      {names.map((n, i) => (
        <li key={n + i} className="flex min-w-0 items-center gap-2.5 text-[14px]">
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[12px] font-semibold ${i === 0 ? "bg-accent text-paper" : "bg-tint text-sky"}`}>{i + 1}</span>
          <span className="min-w-0 break-words">{n}</span>
        </li>
      ))}
    </ol>
  );
}

function RoundCard({ h }: { h: Hackathon }) {
  return (
    <button
      onClick={() => go(`#/app/hackathons/${h.id}`)}
      className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-surface text-left transition-colors hover:border-sky"
    >
      {h.photo && <EventPhoto name={h.photo} className="aspect-[16/8]" />}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="min-w-0">
          <div className="text-[13px] text-mist">{when(h.start, false)}</div>
          <h3 className="mt-0.5 break-words text-[18px] leading-snug">{h.city}</h3>
          {h.venue && <div className="mt-0.5 break-words text-[13px] text-mist">{h.venue}</div>}
        </div>
        <RoundNumbers h={h} />
        {h.caseBrief && (
          <div className="min-w-0">
            <div className="text-[12px] text-mist">{t("app.hack.case")}</div>
            <p className="mt-0.5 break-words text-[14px] leading-relaxed">{h.caseBrief}</p>
          </div>
        )}
        {h.podium.length > 0 && (
          <div>
            <div className="mb-1.5 text-[12px] text-mist">{t("app.hack.podium")}</div>
            <Podium names={h.podium} />
          </div>
        )}
        {h.sponsors.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {h.sponsors.map((s) => (
              <span key={s} className="rounded-md border border-line px-2 py-0.5 text-[12px] text-mist">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

/** turnout of a real round; the team count comes from the round record in src/content/lumora.ts */
function RoundNumbers({ h }: { h: Hackathon }) {
  const round = lumora.rounds.find((r) => r.id === h.id);
  const teams = round ? round.teams : 0;
  if (!h.participants && !teams) return null;
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1">
      {h.participants > 0 && (
        <span className="text-[14px]">
          <b className="text-accent">{num(h.participants)}</b> <span className="text-mist">{tp("app.hack.participantsN", h.participants)}</span>
        </span>
      )}
      {teams > 0 && (
        <span className="text-[14px]">
          <b className="text-accent">{num(teams)}</b> <span className="text-mist">{tp("app.hack.teamsN", teams)}</span>
        </span>
      )}
    </div>
  );
}

/* ---------- results from badges (the sample Demo Cup) ---------- */

type Award = { b: Badge; who: TalentProfile };

function useAwards(h: Hackathon) {
  const winners = useApi(() => (h.results.length ? api.users.winners(200) : Promise.resolve([] as TalentProfile[])), [h.id, h.results.length]);
  const awards: Award[] = (winners.data ?? [])
    .flatMap((who) => who.badges.filter((b) => b.hackathonId === h.id).map((b) => ({ b, who })))
    .sort((a, b) => (a.b.place ?? 99) - (b.b.place ?? 99) || a.b.title.localeCompare(b.b.title));
  return { awards, loading: winners.loading };
}

function AwardList({ awards }: { awards: Award[] }) {
  const user = useSession();
  return (
    <ul className="grid gap-2">
      {awards.map(({ b, who }) => (
        <li key={b.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-paper/50 px-3 py-2.5">
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-semibold ${b.place === 1 ? "bg-accent text-paper" : "bg-tint text-sky"}`}>
            <Trophy size={12} /> {placeTitle(b.title)}
          </span>
          <span className="min-w-0 flex-1 break-words text-[14px] font-semibold">{b.teamName}</span>
          {user?.kind === "company" ? (
            <a href={`#/app/talent/${who.id}`} className="min-h-11 content-center text-[13px] text-sky hover:underline md:min-h-0">
              {who.name}
            </a>
          ) : (
            <span className="text-[13px] text-mist">{who.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function SampleResults({ h }: { h: Hackathon }) {
  const { awards, loading } = useAwards(h);
  return (
    <article className="rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="line">{t("app.hack.demo")}</Pill>
            <span className="text-[13px] text-mist">
              {when(h.start, false)}, {h.city}
            </span>
          </div>
          <h3 className="mt-2 break-words text-[17px]">{h.title}</h3>
        </div>
        <button onClick={() => go(`#/app/hackathons/${h.id}`)} className={`${btn.sm} min-h-11 border border-line hover:border-sky md:min-h-9`}>
          {t("app.hack.details")}
        </button>
      </div>
      <div className="mt-4">{loading ? <Skeleton rows={2} className="h-10" /> : awards.length ? <AwardList awards={awards} /> : <p className="text-[13px] text-mist">{t("app.hack.noResults")}</p>}</div>
    </article>
  );
}

/* ---------- detail ---------- */

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-4 md:p-5">
      <h2 className="mb-3 text-[16px]">{title}</h2>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  if (!v) return null;
  return (
    <div className="grid grid-cols-[minmax(0,110px)_minmax(0,1fr)] gap-3 py-1.5">
      <dt className="text-mist">{k}</dt>
      <dd className="min-w-0 break-words">{v}</dd>
    </div>
  );
}

function EventDetail({ h, team, teams, isTalent, onRegister }: { h: Hackathon; team?: TeamRegistration; teams: number; isTalent: boolean; onRegister: () => void }) {
  const { lang } = useLang();
  const state = regState(h, teams);
  const finished = h.status === "finished";
  const about = writtenText(h);
  const { awards } = useAwards(h);
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <div className="min-w-0">
      <button onClick={() => go("#/app/hackathons")} className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-[14px] font-semibold text-mist hover:text-ink">
        <ArrowLeft size={16} /> {t("app.hack.allEvents")}
      </button>

      <header className="overflow-hidden rounded-xl border border-line bg-surface">
        {h.photo && <EventPhoto name={h.photo} sizes={1600} className="aspect-[4/3] sm:aspect-[21/9]" />}
        <div className="p-5 md:p-7">
          <Tags h={h} />
          <h1 className="mt-3 break-words text-[clamp(24px,3.2vw,38px)] leading-tight">{h.title}</h1>
          <div className="mt-3 grid gap-1.5 text-[14px] text-mist sm:flex sm:flex-wrap sm:gap-x-6">
            <MetaLine icon={<CalendarDays size={15} />}>
              {when(h.start)}
              {h.end.slice(0, 10) !== h.start.slice(0, 10) ? ` – ${when(h.end)}` : `–${h.end.slice(11, 16)}`}
            </MetaLine>
            <MetaLine icon={h.mode === "online" ? <Globe size={15} /> : <MapPin size={15} />}>
              {[whereShort(h), h.mode !== "online" ? h.venue : ""].filter(Boolean).join(", ")} · {modeName(h)}
            </MetaLine>
            <MetaLine icon={<Users size={15} />}>{t("app.hack.by", { name: h.organizerName })}</MetaLine>
          </div>
          {h.short && !finished && <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed">{h.short}</p>}
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          {finished && !h.demo && (
            <Block title={t("app.hack.roundSummary")}>
              <div className="grid gap-4">
                <RoundNumbers h={h} />
                {h.podium.length > 0 ? (
                  <div>
                    <div className="mb-2 text-[13px] text-mist">{t("app.hack.podium")}</div>
                    <Podium names={h.podium} />
                  </div>
                ) : (
                  <p className="text-[14px] text-mist">{t("app.hack.podiumUnknown")}</p>
                )}
              </div>
            </Block>
          )}
          {finished && h.results.length > 0 && (
            <Block title={t("app.hack.results")}>
              {h.demo && <p className="mb-3 text-[13px] text-mist">{t("app.hack.sampleNote")}</p>}
              {awards.length ? <AwardList awards={awards} /> : <p className="text-[13px] text-mist">{t("app.hack.noResults")}</p>}
            </Block>
          )}
          {about && (
            <Block title={t("app.hack.about")}>
              <p className="whitespace-pre-line break-words text-[15px] leading-relaxed">{about}</p>
            </Block>
          )}
          {h.caseBrief && (
            <Block title={t("app.hack.case")}>
              <p className="break-words text-[15px] leading-relaxed">{h.caseBrief}</p>
            </Block>
          )}
          {h.agenda.length > 0 && (
            <Block title={t("app.hack.agenda")}>
              <ol className="grid gap-0.5">
                {h.agenda.map((a, i) => (
                  <li key={i} className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 border-b border-line py-2 text-[14px] last:border-0">
                    <span className="font-semibold tabular-nums text-sky">{a.time}</span>
                    <span className="break-words">{a.title}</span>
                  </li>
                ))}
              </ol>
            </Block>
          )}
          {h.tracks.length > 0 && (
            <Block title={t("app.hack.tracks")}>
              <div className="flex flex-wrap gap-1.5">
                {h.tracks.map((x) => (
                  <span key={x} className="rounded-md bg-tint px-2.5 py-1 text-[13px] text-sky">
                    {trackLabel(x)}
                  </span>
                ))}
              </div>
            </Block>
          )}
          {(h.judges.length > 0 || h.mentors.length > 0) && (
            <Block title={t("app.hack.people")}>
              <ul className="grid gap-2 sm:grid-cols-2">
                {[...h.judges.map((p) => ({ ...p, as: t("app.hack.judge") })), ...h.mentors.map((p) => ({ ...p, as: t("app.hack.mentor") }))].map((p, i) => (
                  <li key={i} className="min-w-0 rounded-lg bg-paper/50 p-3 text-[14px]">
                    <div className="break-words font-semibold">{p.name}</div>
                    <div className="break-words text-[13px] text-mist">{[p.role, p.company].filter(Boolean).join(", ")}</div>
                    <div className="mt-1 text-[12px] text-sky">{p.as}</div>
                  </li>
                ))}
              </ul>
            </Block>
          )}
          <Block title={t("app.hack.judging")}>
            <p className="mb-3 text-[13px] text-mist">{t("app.hack.judgingLead")}</p>
            <ol className="grid gap-2">
              {lumora.judging.map((j, i) => (
                <li key={j.key} className="flex gap-3 text-[14px]">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-tint text-[12px] font-semibold text-sky">{i + 1}</span>
                  <span className="break-words">{j.q[lang]}</span>
                </li>
              ))}
            </ol>
          </Block>
        </div>

        <div className="grid min-w-0 content-start gap-5">
          {!finished && (
            <section className="rounded-xl border border-line bg-surface p-4 md:p-5">
              <h2 className="mb-3 text-[16px]">{t("app.hack.registration")}</h2>
              {h.status !== "cancelled" && (
                <div className="mb-4">
                  <div className="mb-2 text-[13px] text-mist">{t("app.hack.startsIn")}</div>
                  <Countdown to={h.start} />
                </div>
              )}
              <dl className="text-[14px]">
                <Row k={t("app.hack.status")} v={regLine(h, state)} />
                <Row k={t("app.hack.deadline")} v={h.regClose ? when(h.regClose) : ""} />
                <Row k={t("app.hack.spotsLabel")} v={spotsLeft(h, teams)} />
              </dl>
              <div className="mt-4">
                {!isTalent ? (
                  <p className="text-[13px] leading-relaxed text-mist">
                    {t("app.hack.companyNote")}{" "}
                    <a href={lumora.links.telegram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-sky hover:underline">
                      {t("app.hack.writeLumora")} <ExternalLink size={12} />
                    </a>
                  </p>
                ) : team ? (
                  <div className="rounded-lg border border-good/40 bg-good/10 p-4">
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-good">
                      <Check size={16} /> {t("app.hack.youreIn")}
                    </div>
                    <dl className="mt-2 text-[14px]">
                      <Row k={t("app.hack.teamName")} v={team.teamName} />
                      <Row k={t("app.hack.track")} v={team.track ? trackLabel(team.track) : ""} />
                      <Row k={t("app.hack.members")} v={team.members.join(", ")} />
                      <Row k={t("app.hack.contact")} v={team.contact} />
                    </dl>
                    {(state === "open" || state === "full") && (
                      <button onClick={() => setConfirmCancel(true)} className={`${btn.ghost} mt-3 w-full sm:w-auto`}>
                        {t("app.hack.cancelReg")}
                      </button>
                    )}
                  </div>
                ) : state === "open" ? (
                  <button onClick={onRegister} className={`${btn.primary} w-full`}>
                    {t("app.hack.register")}
                  </button>
                ) : null}
              </div>
            </section>
          )}

          <Block title={t("app.hack.prizes")}>
            <ul className="grid gap-2">
              {h.places.map((p) => (
                <li key={p.place} className="flex min-w-0 items-start justify-between gap-3 rounded-lg bg-paper/50 px-3 py-2.5 text-[14px]">
                  <span className="flex shrink-0 items-center gap-2 font-semibold">
                    <Trophy size={14} className={p.place === 1 ? "text-accent" : "text-sky"} /> {placeTitle(p.title)}
                  </span>
                  <span className="min-w-0 break-words text-right text-mist">{p.prize || t("app.hack.prizeTbd")}</span>
                </li>
              ))}
            </ul>
            {h.nominations.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[13px] text-mist">{t("app.hack.nominations")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {h.nominations.map((n) => (
                    <span key={n} className="rounded-md bg-tint px-2 py-0.5 text-[13px] text-sky">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {h.finalists > 0 && <p className="mt-3 text-[13px] text-mist">{tp("app.hack.finalistsN", h.finalists)}</p>}
          </Block>

          <Block title={t("app.hack.whoCanJoin")}>
            <dl className="text-[14px]">
              <Row k={t("app.hack.teamSize")} v={`${teamSize(h)}${h.soloAllowed ? `, ${t("app.hack.soloOk")}` : ""}`} />
              <Row k={t("app.hack.ages")} v={h.ageMin || h.ageMax ? t("app.hack.ageRange", { min: h.ageMin, max: h.ageMax }) : t("app.hack.anyAge")} />
              <Row k={t("app.hack.languages")} v={h.languages.map(langName).join(", ")} />
              <Row k={t("app.hack.eligibility")} v={h.eligibility} />
            </dl>
          </Block>

          <Block title={t("app.hack.where")}>
            <dl className="text-[14px]">
              <Row k={t("app.hack.format")} v={modeName(h)} />
              <Row k={t("app.hack.city")} v={h.mode === "online" ? "" : h.city} />
              <Row k={t("app.hack.venue")} v={h.mode === "online" ? "" : [h.venue, h.address !== h.city ? h.address : ""].filter(Boolean).join(", ")} />
              <Row k={t("app.hack.online")} v={h.mode !== "offline" && team ? h.onlineLink : ""} />
            </dl>
          </Block>

          {h.sponsors.length > 0 && (
            <Block title={t("app.hack.partners")}>
              <div className="flex flex-wrap gap-1.5">
                {h.sponsors.map((s) => (
                  <span key={s} className="rounded-md border border-line px-2 py-0.5 text-[13px] text-mist">
                    {s}
                  </span>
                ))}
              </div>
            </Block>
          )}
        </div>
      </div>

      <CancelModal open={confirmCancel} h={h} onClose={() => setConfirmCancel(false)} />
    </div>
  );
}

function CancelModal({ open, h, onClose }: { open: boolean; h: Hackathon; onClose: () => void }) {
  const toast = useToast();
  const cancel = useAction(async () => {
    await api.hackathons.cancelMyTeam(h.id);
    return true as const;
  });
  return (
    <Modal open={open} onClose={() => !cancel.pending && onClose()}>
      <h2 className="text-[22px]">{t("app.hack.cancelTitle")}</h2>
      <p className="mt-2 text-[14px] text-mist">{t("app.hack.cancelText", { title: h.title })}</p>
      <div className="mt-4">
        <ErrorNote>{cancel.error}</ErrorNote>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          disabled={cancel.pending}
          onClick={async () => {
            if (await cancel.run()) {
              toast(t("app.hack.cancelled"));
              onClose();
            }
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-bad px-5 text-[15px] font-semibold text-white hover:bg-bad/90 disabled:opacity-60"
        >
          {cancel.pending && <Spinner />} {t("app.hack.cancelConfirm")}
        </button>
        <button onClick={onClose} className={btn.ghost}>
          {t("app.hack.keep")}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- registration ---------- */

function RegisterModal({ h, onClose }: { h: Hackathon | null; onClose: () => void }) {
  return <Modal open={!!h} onClose={onClose}>{h && <RegisterForm key={h.id} h={h} onClose={onClose} />}</Modal>;
}

function RegisterForm({ h, onClose }: { h: Hackathon; onClose: () => void }) {
  const user = useSession();
  const toast = useToast();
  const reg = useAction(api.hackathons.registerTeam);
  const [done, setDone] = useState(false);
  const me = user?.kind === "talent" ? user : null;
  const [f, setF] = useState({
    teamName: "",
    track: h.tracks[0] ?? "",
    members: [me?.name ?? "", ...Array(Math.max(0, Math.min(h.teamMin, h.teamMax) - 1)).fill("")] as string[],
    contact: me?.contact ?? "",
    github: me?.github ?? "",
    portfolio: me?.portfolio ?? "",
    motivation: "",
    phone: "",
  });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const filled = f.members.filter((m) => m.trim()).length;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await reg.run(h.id, { ...f, members: f.members.map((m) => m.trim()).filter(Boolean) });
    if (r) {
      setDone(true);
      toast(t("app.hack.toastRegistered"));
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-good/15 text-good">
          <Check size={30} />
        </div>
        <h2 className="mt-5 text-[24px]">{t("app.hack.doneTitle")}</h2>
        <p className="mt-2 text-[14px] text-mist">{t("app.hack.doneText", { title: h.title, date: when(h.start) })}</p>
        <button onClick={onClose} className={`${btn.primary} mt-6`}>
          {t("app.hack.done")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="min-w-0">
        <h2 className="break-words text-[22px] leading-tight">{t("app.hack.formTitle", { title: h.title })}</h2>
        <p className="mt-1 text-[13px] text-mist">
          {when(h.start)}. {teamSize(h)}
          {h.soloAllowed ? `, ${t("app.hack.soloOk")}` : ""}.
        </p>
      </div>
      <Field label={t("app.hack.teamName")}>
        <Input required value={f.teamName} onChange={(e) => set("teamName")(e.target.value)} placeholder={t("app.hack.teamNamePh")} />
      </Field>
      {h.tracks.length > 0 && (
        <Field label={t("app.hack.track")}>
          <Select value={f.track} onChange={(e) => set("track")(e.target.value)} options={h.tracks.map((x) => ({ value: x, label: trackLabel(x) }))} />
        </Field>
      )}
      <div className="grid gap-2">
        <span className="text-[13px] font-medium text-mist">{t("app.hack.membersCount", { n: filled, max: h.teamMax })}</span>
        {f.members.map((m, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={m}
              disabled={i === 0}
              aria-label={i === 0 ? t("app.hack.you") : t("app.hack.memberN", { n: i + 1 })}
              onChange={(e) => setF((s) => ({ ...s, members: s.members.map((x, j) => (j === i ? e.target.value : x)) }))}
              placeholder={i === 0 ? t("app.hack.you") : t("app.hack.memberN", { n: i + 1 })}
            />
            {i > 0 && (
              <button
                type="button"
                onClick={() => setF((s) => ({ ...s, members: s.members.filter((_, j) => j !== i) }))}
                aria-label={t("app.hack.removeMember")}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line text-mist hover:border-sky hover:text-ink"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        {f.members.length < h.teamMax && (
          <button type="button" onClick={() => setF((s) => ({ ...s, members: [...s.members, ""] }))} className="inline-flex min-h-11 w-fit items-center gap-1.5 text-[14px] font-semibold text-sky hover:underline">
            <Plus size={15} /> {t("app.hack.addMember")}
          </button>
        )}
      </div>
      <Field label={t("app.hack.leadContact")} hint={t("app.hack.leadContactHint")}>
        <Input required value={f.contact} onChange={(e) => set("contact")(e.target.value)} placeholder="@username" />
      </Field>
      {h.registrationFields.github && (
        <Field label="GitHub">
          <Input value={f.github} onChange={(e) => set("github")(e.target.value)} placeholder="github.com/your-team" />
        </Field>
      )}
      {h.registrationFields.portfolio && (
        <Field label={t("app.hack.portfolio")}>
          <Input value={f.portfolio} onChange={(e) => set("portfolio")(e.target.value)} placeholder="behance.net/..." />
        </Field>
      )}
      {h.registrationFields.phone && (
        <Field label={t("app.hack.phone")}>
          <Input type="tel" value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+998 90 123 45 67" />
        </Field>
      )}
      {h.registrationFields.motivation && (
        <Field label={t("app.hack.motivation")}>
          <Textarea value={f.motivation} onChange={(e) => set("motivation")(e.target.value)} />
        </Field>
      )}
      <ErrorNote>{reg.error}</ErrorNote>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={reg.pending} className={`${btn.primary} disabled:opacity-60`}>
          {reg.pending && <Spinner />} {t("app.hack.confirm")}
        </button>
        <button type="button" onClick={onClose} className={btn.ghost}>
          {t("common.action.cancel")}
        </button>
      </div>
    </form>
  );
}
