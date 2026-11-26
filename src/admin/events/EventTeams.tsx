import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Check, Copy, Pencil, Search, Send, Trophy, Users } from "lucide-react";
import { api, statusLabel } from "../../api";
import { useAction, useApi } from "../../api/hooks";
import type { Result } from "../../api/types";
import { Card, Empty, ErrorNote, Select, Skeleton, Spinner, inputCls, when } from "../../components/form";
import { Pill, btn, useToast } from "../../components/ui";
import { t, tp, trackLabel } from "../../i18n";
import { go } from "../../lib/router";
import { placeTitle } from "../../app/HackathonsTab";
import { lumora } from "../../content/lumora";
import { statusTone } from "./shared";

const smallBtn = `${btn.sm} min-h-11 border border-line hover:border-sky hover:bg-tint md:min-h-9`;

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
  const ask = useAction(async () => api.hackathons.requestConfirm(id));
  const [asked, setAsked] = useState<{ sent: number; failed: string[] } | null>(null);
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
    return (teams.data ?? []).filter((x) => !s || `${x.teamName} ${x.lead?.name ?? ""} ${x.members.join(" ")} ${x.track}`.toLowerCase().includes(s));
  }, [teams.data, q]);

  if (event.loading && !event.data) return <Skeleton rows={3} className="h-40" />;
  const ev = event.data;
  if (!ev) {
    return (
      <Empty
        title={t("admin.events.notFound")}
        text={t("admin.events.notFoundText")}
        action={
          <button onClick={() => go("#/admin/events")} className={btn.ghost}>
            {t("admin.events.back")}
          </button>
        }
      />
    );
  }

  const allTeams = teams.data ?? [];
  const teamOptions = [{ value: "", label: t("admin.teams.notAssigned") }, ...allTeams.map((x) => ({ value: x.id, label: `${x.teamName}${x.lead ? `, ${x.lead.name}` : ""}` }))];

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
      toast(t("admin.teams.savedToast"));
      setSavedNote(true);
    }
  }

  async function onFinish() {
    if (await finish.run()) toast(t("admin.teams.finishedToast"));
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
          <button onClick={() => go("#/admin/events")} className="-ml-1 min-h-11 px-1 text-[13px] font-semibold text-mist hover:text-ink">
            {t("admin.nav.events")}
          </button>
          <h1 className="break-words text-[clamp(22px,3vw,30px)]">{ev.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-mist">
            <Pill tone={statusTone(ev.status)}>{statusLabel(ev.status)}</Pill>
            {ev.demo && <Pill tone="line">{t("app.hack.demo")}</Pill>}
            <span>
              {when(ev.start)}
              {ev.end.slice(0, 10) !== ev.start.slice(0, 10) ? ` – ${when(ev.end, false)}` : ""}
            </span>
            <span>{ev.mode === "online" ? t("app.hack.mode.online") : ev.city}</span>
          </div>
        </div>
        <button onClick={() => go(`#/admin/events/${id}`)} className={smallBtn}>
          <Pencil size={14} /> {t("admin.teams.edit")}
        </button>
      </div>

      {ev.status !== "finished" && ev.status !== "cancelled" && (
        <div className="grid gap-3 rounded-lg border border-line bg-paper/40 p-4 text-[14px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="min-w-0 flex-1">{t("admin.teams.askNote", { min: ev.teamMin })}</span>
            <button
              onClick={async () => {
                if (!window.confirm(t("admin.teams.askConfirm", { n: allTeams.length }))) return;
                const r = await ask.run();
                if (r) setAsked(r);
              }}
              disabled={ask.pending || allTeams.length === 0}
              className={`${smallBtn} disabled:opacity-60`}
            >
              {ask.pending ? <Spinner /> : <Send size={14} />} {t("admin.teams.ask")}
            </button>
          </div>
          {asked && (
            <p className="text-[13px] text-mist">
              {t("admin.teams.askSent", { n: asked.sent })}
              {asked.failed.length > 0 && ` ${t("admin.teams.askFailed", { list: asked.failed.join(", ") })}`}
            </p>
          )}
          <ErrorNote>{ask.error}</ErrorNote>
        </div>
      )}

      {ev.status !== "finished" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-tint p-4 text-[14px]">
          <span className="min-w-0 flex-1">{t("admin.teams.finishNote")}</span>
          <button onClick={onFinish} disabled={finish.pending} className={`${btn.sm} min-h-11 bg-blue text-white hover:bg-blue-deep disabled:opacity-60 md:min-h-9`}>
            {finish.pending && <Spinner />} {t("admin.teams.finish")}
          </button>
          {finish.error && (
            <div className="w-full">
              <ErrorNote>{finish.error}</ErrorNote>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[17px]">
              <Users size={17} /> {t("admin.teams.registered")}
            </h2>
            <span className="text-[13px] text-mist">{ev.maxTeams ? t("admin.events.teamsOf", { n: allTeams.length, max: ev.maxTeams }) : `${allTeams.length} ${tp("app.hack.teamsN", allTeams.length)}`}</span>
          </div>
          <label className="relative mt-4 block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.teams.search")} aria-label={t("admin.teams.search")} className={`${inputCls} pl-9`} />
          </label>
          <div className="mt-4">
            {teams.error && <ErrorNote>{teams.error}</ErrorNote>}
            {teams.loading && !teams.data ? (
              <Skeleton rows={3} className="h-28" />
            ) : allTeams.length === 0 ? (
              <Empty icon={<Users size={20} />} title={t("admin.teams.noneTitle")} text={t(ev.status === "registration_open" ? "admin.teams.noneOpen" : "admin.teams.noneClosed")} />
            ) : list.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-mist">{t("admin.teams.noMatch")}</p>
            ) : (
              <ul className="grid gap-3">
                {list.map((x) => (
                  <li key={x.id} className="min-w-0 rounded-lg border border-line bg-paper/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="break-words text-[15px] font-semibold">{x.teamName}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-mist">
                          <span className="flex items-center gap-1">
                            {t("admin.teams.lead")}: <span className="text-ink">{x.lead?.name ?? t("admin.teams.deleted")}</span>
                            {x.lead?.verified && <BadgeCheck size={13} className="text-sky" aria-label={t("common.status.verified")} />}
                          </span>
                          {x.lead && x.lead.badges.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Trophy size={12} /> {tp("admin.teams.badgesN", x.lead.badges.length)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {x.confirmedAt ? (
                          <Pill tone="good">{t("admin.teams.stConfirmed")}</Pill>
                        ) : x.confirmRequestedAt ? (
                          <Pill tone="line">{t("admin.teams.stWaiting", { n: x.people.filter((m) => m.confirmedAt).length, min: ev.teamMin })}</Pill>
                        ) : null}
                        {x.mergeOk && <Pill tone="blue">{t("admin.teams.stMerge")}</Pill>}
                        {x.track && <Pill tone="tint">{trackLabel(x.track)}</Pill>}
                      </div>
                    </div>
                    <ul className="mt-3 grid gap-1 text-[13px]">
                      {x.people.map((m) => (
                        <li key={m.id} className="flex min-w-0 flex-wrap items-center gap-x-2">
                          {m.confirmedAt ? <Check size={13} className="text-good" aria-label={t("admin.teams.stConfirmed")} /> : <span className="w-[13px]" aria-hidden />}
                          <span className="break-words">{m.name || `@${m.username}`}</span>
                          {m.name && m.username && <span className="text-mist">@{m.username}</span>}
                          {m.isLead && <span className="text-[12px] text-sky">{t("admin.teams.lead")}</span>}
                        </li>
                      ))}
                    </ul>
                    {x.confirmCode && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${lumora.links.bot}?start=t_${x.confirmCode}`);
                            toast(t("app.team.copied"));
                          } catch {
                            /* clipboard blocked */
                          }
                        }}
                        className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-sky hover:underline md:min-h-8"
                      >
                        <Copy size={13} /> {t("admin.teams.copyLink")}
                      </button>
                    )}
                    <div className="mt-3 grid gap-1 text-[13px]">
                      {extra(t("app.hack.contact"), x.contact)}
                      {extra("GitHub", x.github)}
                      {extra(t("app.hack.portfolio"), x.portfolio)}
                      {extra(t("app.hack.phone"), x.phone)}
                      {extra(t("admin.teams.why"), x.motivation)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <h2 className="flex items-center gap-2 text-[17px]">
            <Trophy size={17} /> {t("app.hack.results")}
          </h2>
          <p className="mt-1 text-[13px] text-mist">{t("admin.teams.resultsLead")}</p>
          {!ev.demo && ev.podium.length > 0 && <p className="mt-3 rounded-lg bg-tint px-3 py-2 text-[13px] text-sky">{t("admin.teams.realPodium", { list: ev.podium.join(", ") })}</p>}
          {allTeams.length === 0 ? (
            <p className="mt-4 text-[13px] text-mist">{t("admin.teams.resultsLater")}</p>
          ) : (
            <div className="mt-5 grid gap-3">
              {ev.places.map((p) => {
                const key = `place:${p.place}`;
                const bad = picks[key] && dupes.has(picks[key]);
                return (
                  <label key={key} className="grid gap-1.5">
                    <span className="text-[13px] font-medium text-mist">
                      {placeTitle(p.title)}
                      {p.prize ? <span className="font-normal">, {p.prize}</span> : null}
                    </span>
                    <Select value={picks[key] ?? ""} options={teamOptions} onChange={(e) => setPick(key, e.target.value)} className={bad ? "border-bad" : ""} />
                  </label>
                );
              })}
              {dupes.size > 0 && <ErrorNote>{t("admin.teams.dupes")}</ErrorNote>}
              {ev.nominations
                .filter((n) => n.trim())
                .map((n) => (
                  <label key={n} className="grid gap-1.5">
                    <span className="text-[13px] font-medium text-mist">{t("admin.teams.nomination", { name: n })}</span>
                    <Select value={picks[`nom:${n}`] ?? ""} options={teamOptions} onChange={(e) => setPick(`nom:${n}`, e.target.value)} />
                  </label>
                ))}
              {finalistKeys.map((k, i) => (
                <label key={k} className="grid gap-1.5">
                  <span className="text-[13px] font-medium text-mist">{t("admin.teams.finalistN", { n: i + 1 })}</span>
                  <Select value={picks[k] ?? ""} options={teamOptions} onChange={(e) => setPick(k, e.target.value)} />
                </label>
              ))}
              <ErrorNote>{saveResults.error}</ErrorNote>
              <button onClick={onSave} disabled={saveResults.pending || dupes.size > 0} className={`${btn.primary} mt-1 disabled:opacity-60`}>
                {saveResults.pending && <Spinner />} {t("admin.teams.save")}
              </button>
              {savedNote && <p className="rounded-lg bg-good/10 px-3 py-2 text-[13px] text-good">{t("admin.teams.savedNote")}</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
