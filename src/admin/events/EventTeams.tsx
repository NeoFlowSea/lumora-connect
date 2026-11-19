import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Pencil, Search, Trophy, Users } from "lucide-react";
import { api, statusLabel } from "../../api";
import { useAction, useApi } from "../../api/hooks";
import type { Result } from "../../api/types";
import { Card, Empty, ErrorNote, Select, Skeleton, Spinner, inputCls, when } from "../../components/form";
import { Pill, btn, useToast } from "../../components/ui";
import { go } from "../../lib/router";
import { statusTone } from "./shared";

export function EventTeams({ id }: { id: string }) {
  const toast = useToast();
  const event = useApi(() => api.hackathons.get(id), [id]);
  const teams = useApi(() => api.hackathons.teams(id), [id]);
  const [q, setQ] = useState("");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [savedNote, setSavedNote] = useState(false);
  const initFor = useRef<string | null>(null);

  const saveResults = useAction(async (results: Result[]) => {
    await api.hackathons.setResults(id, results);
    return true;
  });
  const finish = useAction(async () => {
    await api.hackathons.update(id, { status: "finished" });
    return true;
  });

  // prefill picks from saved results once per event
  useEffect(() => {
    if (!event.data || event.data.id !== id || initFor.current === id) return;
    initFor.current = id;
    setPicks(Object.fromEntries(event.data.results.map((r) => [r.key, r.teamId])));
  }, [event.data, id]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (teams.data ?? []).filter(
      (t) => !s || `${t.teamName} ${t.lead?.name ?? ""} ${t.members.join(" ")} ${t.track}`.toLowerCase().includes(s),
    );
  }, [teams.data, q]);

  if (event.loading && !event.data) return <Skeleton rows={3} className="h-40" />;
  const ev = event.data;
  if (!ev) {
    return <Empty title="Event not found" text="It may have been deleted." action={<button onClick={() => go("#/admin/events")} className={btn.ghost}>Back to events</button>} />;
  }

  const allTeams = teams.data ?? [];
  const teamOptions = [{ value: "", label: "Not assigned" }, ...allTeams.map((t) => ({ value: t.id, label: `${t.teamName}${t.lead ? `, ${t.lead.name}` : ""}` }))];

  const placeKeys = ev.places.map((p) => `place:${p.place}`);
  const ranked = placeKeys.map((k) => picks[k]).filter(Boolean);
  const dupes = new Set(ranked.filter((v, i) => ranked.indexOf(v) !== i));
  const finalistKeys = Array.from({ length: ev.finalists }, (_, i) => `finalist:${i + 1}`);

  const setPick = (key: string, teamId: string) => {
    setSavedNote(false);
    setPicks((p) => ({ ...p, [key]: teamId }));
  };

  async function onSave() {
    if (dupes.size) return;
    const keys = [...placeKeys, ...ev!.nominations.filter((n) => n.trim()).map((n) => `nom:${n}`), ...finalistKeys];
    const results: Result[] = keys.filter((k) => picks[k]).map((k) => ({ key: k, teamId: picks[k] }));
    if (await saveResults.run(results)) {
      toast("Results saved, badges awarded");
      setSavedNote(true);
    }
  }

  async function onFinish() {
    if (await finish.run()) toast("Event marked as finished");
  }

  const extra = (label: string, v: string) =>
    v ? (
      <div className="min-w-0">
        <span className="text-mist">{label}: </span>
        <span className="break-words">{v}</span>
      </div>
    ) : null;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <button onClick={() => go("#/admin/events")} className="text-[12px] font-semibold text-mist hover:text-ink">
            Events
          </button>
          <h1 className="mt-1 break-words text-[clamp(22px,3vw,30px)]">{ev.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-mist">
            <Pill tone={statusTone(ev.status)}>{statusLabel(ev.status)}</Pill>
            <span>
              {when(ev.start)}
              {ev.end.slice(0, 10) !== ev.start.slice(0, 10) ? ` to ${when(ev.end, false)}` : ""}
            </span>
            <span>{ev.mode === "online" ? "Online" : ev.city}</span>
          </div>
        </div>
        <button onClick={() => go(`#/admin/events/${id}`)} className={`${btn.sm} border border-line hover:border-sky hover:bg-tint`}>
          <Pencil size={14} /> Edit event
        </button>
      </div>

      {ev.status !== "finished" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-[13px]">
          <span className="min-w-0 flex-1 text-accent">
            Results are usually assigned after the event. Mark it as finished so participants see it in past events.
          </span>
          <button onClick={onFinish} disabled={finish.pending} className={`${btn.sm} bg-accent text-paper hover:bg-accent-deep disabled:opacity-60`}>
            {finish.pending && <Spinner />} Mark as finished
          </button>
          {finish.error && <div className="w-full"><ErrorNote>{finish.error}</ErrorNote></div>}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[17px]">
              <Users size={17} /> Registered teams
            </h2>
            <span className="text-[13px] text-mist">
              {allTeams.length}
              {ev.maxTeams ? ` of ${ev.maxTeams}` : ""} teams
            </span>
          </div>
          <label className="relative mt-4 block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team, lead, member or track" className={`${inputCls} pl-9`} />
          </label>
          <div className="mt-4">
            {teams.error && <ErrorNote>{teams.error}</ErrorNote>}
            {teams.loading && !teams.data ? (
              <Skeleton rows={3} className="h-28" />
            ) : allTeams.length === 0 ? (
              <Empty icon={<Users size={20} />} title="No teams yet" text={ev.status === "registration_open" ? "Teams appear here as soon as participants register." : "Open registration in the event settings so teams can join."} />
            ) : list.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-mist">No team matches your search.</p>
            ) : (
              <ul className="grid gap-3">
                {list.map((t) => (
                  <li key={t.id} className="rounded-2xl border border-line bg-paper/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="break-words text-[15px] font-semibold">{t.teamName}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-mist">
                          <span className="flex items-center gap-1">
                            Lead: <span className="text-ink">{t.lead?.name ?? "Deleted account"}</span>
                            {t.lead?.verified && <BadgeCheck size={13} className="text-sky" aria-label="verified" />}
                          </span>
                          {t.lead && t.lead.badges.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Trophy size={12} /> {t.lead.badges.length} badge{t.lead.badges.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </div>
                      {t.track && <Pill tone="tint">{t.track}</Pill>}
                    </div>
                    <div className="mt-3 grid gap-1 text-[12px]">
                      {extra("Members", t.members.filter(Boolean).join(", ") || "Lead only")}
                      {extra("Contact", t.contact)}
                      {extra("GitHub", t.github)}
                      {extra("Portfolio", t.portfolio)}
                      {extra("Phone", t.phone)}
                      {extra("Why", t.motivation)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <h2 className="flex items-center gap-2 text-[17px]">
            <Trophy size={17} /> Results
          </h2>
          <p className="mt-1 text-[12px] text-mist">Pick a team for each award. Saving gives the team lead a badge and a notification.</p>
          {allTeams.length === 0 ? (
            <p className="mt-4 text-[13px] text-mist">Results can be assigned once teams are registered.</p>
          ) : (
            <div className="mt-5 grid gap-3">
              {ev.places.map((p) => {
                const key = `place:${p.place}`;
                const bad = picks[key] && dupes.has(picks[key]);
                return (
                  <label key={key} className="grid gap-1.5">
                    <span className="text-[12px] font-semibold text-mist">
                      {p.title}
                      {p.prize ? <span className="font-normal">, {p.prize}</span> : null}
                    </span>
                    <Select value={picks[key] ?? ""} options={teamOptions} onChange={(e) => setPick(key, e.target.value)} className={bad ? "border-bad" : ""} />
                  </label>
                );
              })}
              {dupes.size > 0 && <ErrorNote>One team can take only one ranked place. Pick a different team for the repeated place.</ErrorNote>}
              {ev.nominations.filter((n) => n.trim()).map((n) => (
                <label key={n} className="grid gap-1.5">
                  <span className="text-[12px] font-semibold text-mist">Nomination: {n}</span>
                  <Select value={picks[`nom:${n}`] ?? ""} options={teamOptions} onChange={(e) => setPick(`nom:${n}`, e.target.value)} />
                </label>
              ))}
              {finalistKeys.map((k, i) => (
                <label key={k} className="grid gap-1.5">
                  <span className="text-[12px] font-semibold text-mist">Finalist {i + 1}</span>
                  <Select value={picks[k] ?? ""} options={teamOptions} onChange={(e) => setPick(k, e.target.value)} />
                </label>
              ))}
              <ErrorNote>{saveResults.error}</ErrorNote>
              <button onClick={onSave} disabled={saveResults.pending || dupes.size > 0} className={`${btn.primary} mt-1 disabled:opacity-60`}>
                {saveResults.pending && <Spinner />} Save results
              </button>
              {savedNote && (
                <p className="rounded-xl bg-good/10 px-3 py-2 text-[12px] text-good">
                  Saved. Each team lead got a badge on their profile and a notification. Saving again replaces the badges for this event.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
