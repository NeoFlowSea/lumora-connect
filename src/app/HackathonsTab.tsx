import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Calendar, Check, Clock, Globe, MapPin, Plus, Trophy, Users, X } from "lucide-react";
import { api, statusLabel } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { Hackathon, TeamRegistration } from "../api/types";
import { Countdown } from "../components/Countdown";
import { Empty, ErrorNote, Field, Input, Select, Skeleton, Spinner, Textarea, when } from "../components/form";
import { Modal, Pill, btn, ease, useToast } from "../components/ui";
import { go } from "../lib/router";

export const accentCls: Record<Hackathon["accent"], string> = {
  blue: "bg-blue text-white",
  yellow: "bg-accent text-paper",
  sky: "bg-[#8db0ff] text-paper",
  navy: "bg-surface text-ink border border-line",
};

const typeLabel: Record<Hackathon["eventType"], string> = {
  hackathon: "Hackathon",
  case: "IT case competition",
  meetup: "Meetup",
  workshop: "Workshop",
};

const nowLocal = () => new Date().toISOString().slice(0, 16);

export function HackathonsTab({ focusId }: { focusId?: string } = {}) {
  const user = useSession();
  const list = useApi(() => api.hackathons.list(), []);
  const mine = useApi(() => api.hackathons.myTeams(), [user?.id]);
  const counts = useApi(() => api.hackathons.teamCounts(), []);
  const [registerFor, setRegisterFor] = useState<Hackathon | null>(null);

  const { upcoming, past } = useMemo(() => {
    const all = list.data ?? [];
    return {
      upcoming: all.filter((h) => !["finished", "cancelled"].includes(h.status)),
      past: all.filter((h) => h.status === "finished").sort((a, b) => b.start.localeCompare(a.start)),
    };
  }, [list.data]);

  const teamBy = useMemo(() => {
    const m: Record<string, TeamRegistration> = {};
    for (const t of mine.data ?? []) m[t.hackathonId] = t;
    return m;
  }, [mine.data]);

  const focus = focusId ? (list.data ?? []).find((h) => h.id === focusId) : undefined;
  const featured = upcoming[0];

  if (!user || user.kind === "admin") return null;

  if (focusId) {
    if (list.loading) return <Skeleton rows={2} className="h-64" />;
    if (!focus)
      return (
        <Empty
          icon={<Trophy size={22} />}
          title="This event is not available"
          text="It may have been unpublished or removed."
          action={
            <button onClick={() => go("#/app/hackathons")} className={btn.ghost}>
              All hackathons
            </button>
          }
        />
      );
    return (
      <>
        <EventDetail h={focus} team={teamBy[focus.id]} teams={counts.data?.[focus.id] ?? 0} onRegister={() => setRegisterFor(focus)} />
        <RegisterModal h={registerFor} onClose={() => setRegisterFor(null)} />
      </>
    );
  }

  return (
    <div>
      <h1 className="text-[clamp(26px,3vw,36px)]">Lumora hackathons</h1>
      <p className="mt-1 text-[13px] text-mist">IT case competitions by Lumora and partner events. Register a team or go solo where allowed.</p>

      {list.loading ? (
        <div className="mt-6">
          <Skeleton rows={2} className="h-56" />
        </div>
      ) : list.error ? (
        <div className="mt-6">
          <ErrorNote>{list.error}</ErrorNote>
        </div>
      ) : !featured ? (
        <div className="mt-6">
          <Empty icon={<Trophy size={22} />} title="No upcoming events yet" text="The next Lumora round is being planned. Check back soon." />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className={`mt-6 overflow-hidden rounded-3xl p-7 md:p-9 ${accentCls[featured.accent]}`}
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          >
            <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-paper px-2.5 py-1 text-[12px] font-semibold text-accent">Next up</span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold">{typeLabel[featured.eventType]}</span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold">{statusLabel(featured.status)}</span>
                </div>
                <h2 className="mt-4 text-[clamp(24px,3vw,36px)]">{featured.title}</h2>
                <Meta h={featured} light />
                <p className="mt-4 max-w-[56ch] text-[14px] opacity-90">{featured.short}</p>
              </div>
              <div>
                <Countdown to={featured.start} dark />
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <RegisterButton h={featured} team={teamBy[featured.id]} onRegister={() => setRegisterFor(featured)} onLight />
                  <button onClick={() => go(`#/app/hackathons/${featured.id}`)} className="rounded-full border border-white/40 px-5 py-3 text-[14px] font-semibold hover:bg-white/10">
                    Event details
                  </button>
                </div>
                <p className="mt-3 text-[12px] opacity-80">
                  {featured.places.length} winning places. 1st: {featured.places[0]?.prize}
                </p>
              </div>
            </div>
          </motion.div>

          {upcoming.length > 1 && (
            <>
              <h2 className="mt-12 text-[19px]">Upcoming</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {upcoming.slice(1).map((h, i) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease, delay: 0.08 + i * 0.05 }}
                    className="flex flex-col rounded-3xl border border-line bg-surface p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={h.organizerId === "lumora" ? "blue" : "line"}>{h.organizerName}</Pill>
                      {h.organizerId !== "lumora" && <Pill tone="tint">Partner event</Pill>}
                      <Pill tone="line">{statusLabel(h.status)}</Pill>
                    </div>
                    <h3 className="mt-4 text-[17px]">{h.title}</h3>
                    <div className="mt-2 text-[12px] text-mist">
                      {when(h.start, false)}. {h.mode === "online" ? "Online" : h.city}
                      {h.mode === "hybrid" ? ", hybrid" : ""}.
                    </div>
                    <p className="mt-3 line-clamp-3 text-[13px] text-mist">{h.short}</p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
                      <span className="text-[12px] text-mist">
                        Teams of {h.teamMin === h.teamMax ? h.teamMin : `${h.teamMin} to ${h.teamMax}`}
                        {h.soloAllowed ? ", solo ok" : ""}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => go(`#/app/hackathons/${h.id}`)} className={`${btn.sm} border border-line hover:bg-cloud`}>
                          Details
                        </button>
                        <RegisterButton h={h} team={teamBy[h.id]} onRegister={() => setRegisterFor(h)} small />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mt-12 text-[19px]">Results so far</h2>
          <PastResults events={past} />
        </>
      )}

      <RegisterModal h={registerFor} onClose={() => setRegisterFor(null)} />
    </div>
  );
}

function Meta({ h, light }: { h: Hackathon; light?: boolean }) {
  const cls = light ? "opacity-90" : "text-mist";
  return (
    <div className={`mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] ${cls}`}>
      <span className="flex items-center gap-1.5">
        <Calendar size={14} /> {when(h.start)}
      </span>
      <span className="flex items-center gap-1.5">
        {h.mode === "online" ? <Globe size={14} /> : <MapPin size={14} />} {h.mode === "online" ? "Online" : h.city}
        {h.mode === "hybrid" ? ", hybrid" : ""}
      </span>
      <span className="flex items-center gap-1.5">
        <Users size={14} /> Teams of {h.teamMin === h.teamMax ? h.teamMin : `${h.teamMin} to ${h.teamMax}`}
      </span>
    </div>
  );
}

function RegisterButton({ h, team, onRegister, onLight, small }: { h: Hackathon; team?: TeamRegistration; onRegister: () => void; onLight?: boolean; small?: boolean }) {
  const user = useSession();
  const toast = useToast();
  const base = small ? btn.sm : "inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold";
  if (user?.kind === "company") {
    return (
      <button
        onClick={() => toast("Thanks. The Lumora team will contact you about sponsoring a case.")}
        className={`${base} ${onLight ? "bg-paper text-accent hover:bg-cloud" : "bg-blue text-white hover:bg-blue-deep"}`}
      >
        Sponsor a case
      </button>
    );
  }
  if (team) {
    return (
      <span className={`${base} ${onLight ? "bg-paper text-good" : "bg-good/15 text-good"}`}>
        <Check size={15} /> Registered
      </span>
    );
  }
  const open = h.status === "registration_open" && (!h.regOpen || nowLocal() >= h.regOpen) && (!h.regClose || nowLocal() <= h.regClose);
  if (!open) {
    return (
      <span className={`${base} ${onLight ? "bg-white/15" : "border border-line text-mist"}`}>
        <Clock size={14} /> {h.status === "published" || (h.regOpen && nowLocal() < h.regOpen) ? `Opens ${when(h.regOpen, false)}` : "Registration closed"}
      </span>
    );
  }
  return (
    <button onClick={onRegister} className={`${base} ${onLight ? "bg-paper text-accent hover:bg-cloud" : "bg-accent text-paper hover:bg-accent-deep"}`}>
      Register {h.soloAllowed && h.teamMin <= 1 ? "" : "a team"}
    </button>
  );
}

function EventDetail({ h, team, teams, onRegister }: { h: Hackathon; team?: TeamRegistration; teams: number; onRegister: () => void }) {
  const cancel = useAction(api.hackathons.cancelMyTeam);
  const toast = useToast();
  return (
    <div>
      <button onClick={() => go("#/app/hackathons")} className="mb-4 text-[13px] font-semibold text-mist hover:text-ink">
        All hackathons
      </button>
      <div className={`overflow-hidden rounded-3xl p-7 md:p-9 ${accentCls[h.accent]}`}>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold">{h.organizerName}</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold">{typeLabel[h.eventType]}</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold">{statusLabel(h.status)}</span>
        </div>
        <h1 className="mt-4 text-[clamp(26px,3.4vw,42px)]">{h.title}</h1>
        <Meta h={h} light />
        <p className="mt-4 max-w-[60ch] text-[14px] opacity-90">{h.short}</p>
        {!["finished", "cancelled"].includes(h.status) && (
          <div className="mt-6 flex flex-wrap items-end gap-5">
            <Countdown to={h.start} dark />
            <RegisterButton h={h} team={team} onRegister={onRegister} onLight />
          </div>
        )}
      </div>

      {team && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-good/40 bg-good/10 p-5">
          <div className="text-[14px]">
            <b className="text-good">You're registered</b> as team <b>{team.teamName}</b>, track {team.track}. {team.members.length} people.
          </div>
          {h.status === "registration_open" && (
            <button
              onClick={async () => {
                await cancel.run(h.id);
                toast("Registration cancelled");
              }}
              className={`${btn.sm} border border-line hover:bg-cloud`}
            >
              {cancel.pending && <Spinner />} Cancel registration
            </button>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-4">
          <Section title="About">
            <p className="whitespace-pre-line text-[14px] leading-relaxed">{h.description}</p>
          </Section>
          {h.caseBrief && (
            <Section title="Case brief">
              <p className="text-[14px] leading-relaxed">{h.caseBrief}</p>
            </Section>
          )}
          {h.agenda.length > 0 && (
            <Section title="Agenda">
              <ol className="grid gap-2">
                {h.agenda.map((a, i) => (
                  <li key={i} className="grid grid-cols-[64px_1fr] gap-3 text-[13px]">
                    <span className="font-semibold text-sky">{a.time}</span>
                    <span>{a.title}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}
          {(h.judges.length > 0 || h.mentors.length > 0) && (
            <Section title="Jury and mentors">
              <ul className="grid gap-2 sm:grid-cols-2">
                {[...h.judges.map((p) => ({ ...p, as: "Jury" })), ...h.mentors.map((p) => ({ ...p, as: "Mentor" }))].map((p, i) => (
                  <li key={i} className="rounded-2xl bg-cloud p-3 text-[13px]">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-mist">
                      {p.role}
                      {p.company ? `, ${p.company}` : ""}
                    </div>
                    <div className="mt-1 text-[11px] text-sky">{p.as}</div>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
        <div className="grid content-start gap-4">
          <Section title="Prizes">
            <ul className="grid gap-2">
              {h.places.map((p) => (
                <li key={p.place} className="flex items-start justify-between gap-3 rounded-2xl bg-cloud p-3 text-[13px]">
                  <span className="flex items-center gap-2 font-semibold">
                    <Trophy size={14} className={p.place === 1 ? "text-accent" : "text-sky"} /> {p.title}
                  </span>
                  <span className="text-right text-mist">{p.prize}</span>
                </li>
              ))}
            </ul>
            {(h.nominations.length > 0 || h.finalists > 0) && (
              <p className="mt-3 text-[12px] text-mist">
                {h.nominations.length > 0 && `Special nominations: ${h.nominations.join(", ")}. `}
                {h.finalists > 0 && `${h.finalists} finalists get a finalist badge.`}
              </p>
            )}
          </Section>
          <Section title="Who can join">
            <dl className="grid gap-2 text-[13px]">
              <Row k="Registration" v={`${when(h.regOpen)} to ${when(h.regClose)}`} />
              <Row k="Tracks" v={h.tracks.join(", ")} />
              <Row k="Team size" v={`${h.teamMin} to ${h.teamMax}${h.soloAllowed ? ", solo allowed" : ""}`} />
              <Row k="Teams" v={`${teams} registered${h.maxTeams ? ` of ${h.maxTeams}` : ""}`} />
              <Row k="Ages" v={h.ageMin || h.ageMax ? `${h.ageMin} to ${h.ageMax}` : "Any"} />
              <Row k="Languages" v={h.languages.join(", ")} />
              <Row k="Eligibility" v={h.eligibility} />
            </dl>
          </Section>
          <Section title="Where">
            <dl className="grid gap-2 text-[13px]">
              <Row k="Format" v={h.mode === "offline" ? "Offline" : h.mode === "online" ? "Online" : "Hybrid"} />
              <Row k="Venue" v={h.mode === "online" ? "" : [h.venue, h.address].filter(Boolean).join(", ")} />
              <Row k="Online" v={h.mode === "offline" ? "" : h.onlineLink} />
              <Row k="Ends" v={when(h.end)} />
            </dl>
          </Section>
          {h.sponsors.length > 0 && (
            <Section title="Sponsors and partners">
              <div className="flex flex-wrap gap-2">
                {h.sponsors.map((s) => (
                  <Pill key={s} tone="line">
                    {s}
                  </Pill>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="mb-3 text-[15px]">{title}</h2>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3">
      <dt className="text-mist">{k}</dt>
      <dd className="min-w-0 break-words">{v}</dd>
    </div>
  );
}

function RegisterModal({ h, onClose }: { h: Hackathon | null; onClose: () => void }) {
  return <Modal open={!!h} onClose={onClose}>{h && <RegisterForm key={h.id} h={h} onClose={onClose} />}</Modal>;
}

function RegisterForm({ h, onClose }: { h: Hackathon; onClose: () => void }) {
  const user = useSession();
  const toast = useToast();
  const reg = useAction(api.hackathons.registerTeam);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({
    teamName: "",
    track: h.tracks[0] ?? "",
    members: [user?.name ?? "", ...Array(Math.max(0, Math.min(h.teamMin, h.teamMax) - 1)).fill("")] as string[],
    contact: user?.kind === "talent" ? user.contact : "",
    github: user?.kind === "talent" ? user.portfolio : "",
    portfolio: "",
    motivation: "",
    phone: "",
  });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await reg.run(h.id, { ...f, members: f.members.map((m) => m.trim()).filter(Boolean) });
    if (r) {
      setDone(true);
      toast("Team registered");
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-good/15 text-good">
          <Check size={36} />
        </motion.div>
        <h2 className="mt-6 text-[24px]">You're in</h2>
        <p className="mt-2 text-[14px] text-mist">
          {h.title}, {when(h.start)}. The organizers will message the team lead before the event.
        </p>
        <button onClick={onClose} className={`${btn.primary} mt-6`}>
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <h2 className="text-[22px]">Register for {h.title}</h2>
        <p className="mt-1 text-[13px] text-mist">
          {when(h.start)}. Teams of {h.teamMin} to {h.teamMax}
          {h.soloAllowed ? ", solo allowed" : ""}.
        </p>
      </div>
      <Field label="Team name">
        <Input required value={f.teamName} onChange={(e) => set("teamName")(e.target.value)} placeholder="Night Owls" />
      </Field>
      <Field label="Track">
        <Select value={f.track} onChange={(e) => set("track")(e.target.value)} options={h.tracks} />
      </Field>
      <div className="grid gap-2">
        <span className="text-[12px] font-semibold text-mist">
          Team members ({f.members.filter((m) => m.trim()).length} of {h.teamMax})
        </span>
        {f.members.map((m, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={m}
              disabled={i === 0}
              onChange={(e) => setF((s) => ({ ...s, members: s.members.map((x, j) => (j === i ? e.target.value : x)) }))}
              placeholder={i === 0 ? "You" : `Member ${i + 1} full name`}
            />
            {i > 0 && (
              <button
                type="button"
                onClick={() => setF((s) => ({ ...s, members: s.members.filter((_, j) => j !== i) }))}
                aria-label="Remove member"
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-line text-mist hover:text-ink"
              >
                <X size={15} />
              </button>
            )}
          </div>
        ))}
        {f.members.length < h.teamMax && (
          <button
            type="button"
            onClick={() => setF((s) => ({ ...s, members: [...s.members, ""] }))}
            className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-sky hover:underline"
          >
            <Plus size={14} /> Add member
          </button>
        )}
      </div>
      <Field label="Team lead contact" hint="Telegram or phone. Organizers use it to reach your team.">
        <Input required value={f.contact} onChange={(e) => set("contact")(e.target.value)} placeholder="@username" />
      </Field>
      {h.registrationFields.github && (
        <Field label="GitHub">
          <Input value={f.github} onChange={(e) => set("github")(e.target.value)} placeholder="github.com/your-team" />
        </Field>
      )}
      {h.registrationFields.portfolio && (
        <Field label="Portfolio">
          <Input value={f.portfolio} onChange={(e) => set("portfolio")(e.target.value)} placeholder="behance.net/..." />
        </Field>
      )}
      {h.registrationFields.phone && (
        <Field label="Phone">
          <Input value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+998 90 123 45 67" />
        </Field>
      )}
      {h.registrationFields.motivation && (
        <Field label="Why do you want to join?">
          <Textarea value={f.motivation} onChange={(e) => set("motivation")(e.target.value)} />
        </Field>
      )}
      <ErrorNote>{reg.error}</ErrorNote>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={reg.pending} className={btn.primary}>
          {reg.pending && <Spinner />} Confirm registration
        </button>
        <button type="button" onClick={onClose} className={btn.ghost}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function PastResults({ events }: { events: Hackathon[] }) {
  const winners = useApi(() => api.users.winners(50), []);
  return (
    <ul className="mt-4 divide-y divide-line rounded-3xl border border-line bg-surface">
      {events.map((h) => {
        const ranked = (winners.data ?? [])
          .flatMap((t) => t.badges.filter((b) => b.hackathonId === h.id && b.place).map((b) => ({ b, t })))
          .sort((a, b) => (a.b.place ?? 99) - (b.b.place ?? 99));
        const first = ranked[0];
        return (
          <li key={h.id} className="grid grid-cols-[40px_1fr] items-center gap-4 px-5 py-4 md:grid-cols-[40px_1.1fr_1.4fr]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-tint text-sky">
              <Trophy size={18} />
            </span>
            <span>
              <span className="block text-[14px] font-semibold">{h.title}</span>
              <span className="block text-[12px] text-mist">
                {h.city}, {when(h.start, false)}
              </span>
            </span>
            <span className="col-span-2 text-[13px] text-mist md:col-span-1">
              {first ? (
                <>
                  Winner: <b className="text-ink">{first.b.teamName}</b> led by {first.t.name}
                  {ranked.length > 1 ? `, then ${ranked.slice(1, 3).map((r) => r.b.teamName).join(" and ")}` : ""}
                </>
              ) : (
                "Results are being published"
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
