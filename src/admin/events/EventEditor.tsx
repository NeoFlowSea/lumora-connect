import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Users } from "lucide-react";
import { api, statusLabel } from "../../api";
import { useAction, useApi } from "../../api/hooks";
import type { AgendaItem, EventMode, EventStatus, HackathonInput, Person } from "../../api/types";
import { categories } from "../../data";
import { Card, Empty, ErrorNote, Field, Input, Select, Skeleton, Spinner, Textarea, Toggle, inputCls } from "../../components/form";
import { btn, useToast } from "../../components/ui";
import { lumora, photo } from "../../content/lumora";
import { t, trackLabel } from "../../i18n";
import { go, useRoute } from "../../lib/router";
import { EventPreview } from "./EventPreview";
import { LANGUAGES, STATUS_KEYS, Stepper, TagInput, defaultEvent, eventTypeOptions, ordinal, statusHint, toInput } from "./shared";

function Section({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <Card className="min-w-0">
      <h2 className="text-[17px]">{title}</h2>
      {text && <p className="mt-1 text-[13px] text-mist">{text}</p>}
      <div className="mt-5 grid gap-4">{children}</div>
    </Card>
  );
}

const MODES: EventMode[] = ["offline", "online", "hybrid"];

const iconBtn = "grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line text-mist transition-colors hover:border-sky hover:text-ink disabled:opacity-30";
const smallBtn = `${btn.sm} min-h-11 w-fit border border-line hover:border-sky hover:bg-tint md:min-h-9`;

const langName = (l: string) => {
  const k = `app.hack.lang.${l}`;
  const s = t(k);
  return s === k ? l : s;
};

/** multi-select chips with translated labels for stored values */
function LabeledChips({ options, value, onChange, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; label: (v: string) => string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`min-h-11 rounded-lg border px-3 text-[13px] font-medium transition-colors md:min-h-9 ${on ? "border-sky bg-tint text-ink" : "border-line text-mist hover:border-sky hover:text-ink"}`}
          >
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

function PeopleRows({ value, onChange, kind }: { value: Person[]; onChange: (v: Person[]) => void; kind: "judge" | "mentor" }) {
  const patch = (i: number, p: Partial<Person>) => onChange(value.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="grid gap-3">
      {value.length === 0 && <p className="text-[13px] text-mist">{t(`admin.editor.no_${kind}`)}</p>}
      {value.map((p, i) => (
        <div key={i} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:border-0 sm:p-0">
          <Input aria-label={t("admin.editor.personName")} placeholder={t("admin.editor.personName")} value={p.name} onChange={(e) => patch(i, { name: e.target.value })} />
          <Input aria-label={t("admin.editor.personRole")} placeholder={t("admin.editor.personRolePh")} value={p.role} onChange={(e) => patch(i, { role: e.target.value })} />
          <Input aria-label={t("admin.editor.personCompany")} placeholder={t("admin.editor.personCompany")} value={p.company} onChange={(e) => patch(i, { company: e.target.value })} />
          <button type="button" aria-label={t("common.action.remove")} onClick={() => onChange(value.filter((_, j) => j !== i))} className={iconBtn}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { name: "", role: "", company: "" }])} className={smallBtn}>
        <Plus size={14} /> {t(`admin.editor.add_${kind}`)}
      </button>
    </div>
  );
}

export function EventEditor({ id }: { id?: string }) {
  const toast = useToast();
  const { query } = useRoute();
  const from = !id ? query.from : undefined;
  const src = useApi(() => (id ? api.hackathons.get(id) : from ? api.hackathons.get(from) : Promise.resolve(undefined)), [id, from]);
  const orgs = useApi(() => api.users.companies(), []);

  const [form, setForm] = useState<HackathonInput | null>(null);
  const [base, setBase] = useState("");
  const [customTrack, setCustomTrack] = useState("");
  const [customLang, setCustomLang] = useState("");
  const initKey = useRef<string | null>(null);

  // load the form once per event: edit, duplicate or a fresh default
  useEffect(() => {
    const key = `${id ?? "new"}:${from ?? ""}`;
    if (initKey.current === key) return;
    if (src.loading && src.data === undefined) return;
    let next: HackathonInput;
    if (id) {
      if (!src.data || src.data.id !== id) return;
      next = toInput(src.data);
    } else if (from) {
      if (!src.data || src.data.id !== from) return;
      next = { ...toInput(src.data), title: t("admin.editor.copyOf", { title: src.data.title }), status: "draft", podium: [], participants: 0 };
    } else {
      next = defaultEvent();
    }
    next = { podium: [], participants: 0, photo: "", demo: false, ...next };
    initKey.current = key;
    setForm(next);
    setBase(JSON.stringify(next));
  }, [id, from, src.data, src.loading]);

  const save = useAction(async (payload: HackathonInput) => {
    if (id) {
      await api.hackathons.update(id, payload);
      return id;
    }
    const h = await api.hackathons.create(payload);
    return h.id;
  });

  if (id && !src.loading && !src.data) {
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
  if (!form) return <Skeleton rows={4} className="h-48" />;

  const f = form;
  const podium = f.podium ?? [];
  const dirty = JSON.stringify(f) !== base;
  const set = <K extends keyof HackathonInput>(k: K, v: HackathonInput[K]) => setForm((s) => (s ? { ...s, [k]: v } : s));

  const orgOptions = [
    { value: "lumora", label: "Lumora" },
    ...(orgs.data ?? []).map((c) => ({ value: c.id, label: `${c.name}${c.orgKind === "organization" ? ` (${t("admin.kind.organization").toLowerCase()})` : ""}` })),
  ];
  if (!orgOptions.some((o) => o.value === f.organizerId)) orgOptions.push({ value: f.organizerId, label: f.organizerName });

  const catNames = categories.map((c) => c.name);
  const trackOptions = [...catNames, ...f.tracks.filter((x) => !catNames.includes(x))];
  const langOptions = [...LANGUAGES, ...f.languages.filter((l) => !LANGUAGES.includes(l))];
  const photoOptions = [{ value: "", label: t("admin.editor.noPhoto") }, ...Object.entries(lumora.photos).map(([value, label]) => ({ value, label }))];

  function addCustom(kind: "tracks" | "languages", raw: string, clear: () => void) {
    const v = raw.trim();
    if (!v) return;
    if (!f[kind].includes(v)) set(kind, [...f[kind], v]);
    clear();
  }

  function setPlaceCount(n: number) {
    const count = Math.max(1, Math.min(20, n));
    const list = f.places.slice(0, count);
    for (let p = list.length + 1; p <= count; p++) list.push({ place: p, title: `${ordinal(p)} place`, prize: "" });
    set("places", list);
  }

  function move<T>(list: T[], i: number, d: -1 | 1): T[] {
    const next = [...list];
    const j = i + d;
    if (j < 0 || j >= next.length) return list;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  }
  const patchAgenda = (i: number, p: Partial<AgendaItem>) => set("agenda", f.agenda.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function onSave(status?: EventStatus) {
    const clean: HackathonInput = { ...f, podium: podium.map((x) => x.trim()).filter(Boolean) };
    const payload: HackathonInput = status ? { ...clean, status } : clean;
    const savedId = await save.run(payload);
    if (!savedId) return;
    setForm(payload);
    setBase(JSON.stringify(payload));
    toast(t(status === "published" ? "admin.editor.publishedToast" : "admin.editor.savedToast"));
    go(`#/admin/events/${savedId}`);
  }

  const isDraft = f.status === "draft";

  return (
    <div className="pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <button onClick={() => go("#/admin/events")} className="-ml-1 min-h-11 px-1 text-[13px] font-semibold text-mist hover:text-ink">
            {t("admin.nav.events")}
          </button>
          <h1 className="break-words text-[clamp(22px,3vw,30px)]">
            {id ? t("admin.editor.editTitle", { title: f.title || t("admin.editor.event") }) : from ? t("admin.editor.duplicateTitle") : t("admin.events.create")}
          </h1>
          <p className="mt-1 text-[14px] text-mist">{t("admin.editor.lead")}</p>
        </div>
        {id && (
          <button onClick={() => go(`#/admin/events/${id}/teams`)} className={smallBtn}>
            <Users size={14} /> {t("admin.events.teams")}
          </button>
        )}
      </div>

      {save.error && (
        <div className="mt-5">
          <ErrorNote>{save.error}</ErrorNote>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5">
          <Section title={t("admin.editor.basics")} text={t("admin.editor.basicsText")}>
            <Field label={t("admin.editor.title")}>
              <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={t("admin.editor.titlePh")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("admin.editor.organizer")} hint={t("admin.editor.organizerHint")}>
                <Select
                  value={f.organizerId}
                  options={orgOptions}
                  onChange={(e) => {
                    const v = e.target.value;
                    const name = v === "lumora" ? "Lumora" : (orgs.data?.find((c) => c.id === v)?.name ?? f.organizerName);
                    setForm((s) => (s ? { ...s, organizerId: v, organizerName: name } : s));
                  }}
                />
              </Field>
              <Field label={t("admin.editor.type")}>
                <Select value={f.eventType} options={eventTypeOptions()} onChange={(e) => set("eventType", e.target.value as HackathonInput["eventType"])} />
              </Field>
            </div>
            <Field label={t("admin.editor.short")} hint={t("admin.editor.shortHint")}>
              <Textarea rows={2} value={f.short} onChange={(e) => set("short", e.target.value)} />
            </Field>
            <Field label={t("admin.editor.description")}>
              <Textarea rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label={t("admin.editor.case")} hint={t("admin.editor.caseHint")}>
              <Textarea rows={2} value={f.caseBrief} onChange={(e) => set("caseBrief", e.target.value)} />
            </Field>
          </Section>

          <Section title={t("admin.editor.photoArchive")} text={t("admin.editor.photoArchiveText")}>
            <Field label={t("admin.editor.photo")} hint={t("admin.editor.photoHint")}>
              <Select value={f.photo ?? ""} options={photoOptions} onChange={(e) => set("photo", e.target.value)} />
            </Field>
            {f.photo && (
              <img src={photo(f.photo, 800)} alt={lumora.photos[f.photo] ?? ""} className="aspect-[16/9] w-full max-w-[480px] rounded-lg border border-line object-cover" />
            )}
            <Toggle checked={!!f.demo} onChange={(v) => set("demo", v)} label={t("admin.editor.demo")} />
            <p className="-mt-2 text-[12px] text-mist">{t("admin.editor.demoHint")}</p>
            <Field label={t("admin.editor.participants")} hint={t("admin.editor.participantsHint")}>
              <div className="max-w-[220px]">
                <Stepper label={t("admin.editor.participants")} value={f.participants ?? 0} min={0} max={100000} onChange={(v) => set("participants", v)} />
              </div>
            </Field>
            <div className="grid gap-2">
              <span className="text-[13px] font-medium text-mist">{t("admin.editor.podium")}</span>
              <span className="text-[12px] text-mist">{t("admin.editor.podiumHint")}</span>
              {podium.length === 0 && <p className="text-[13px] text-mist">{t("admin.editor.podiumEmpty")}</p>}
              {podium.map((name, i) => (
                <div key={i} className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 sm:grid-cols-[44px_minmax(0,1fr)_auto]">
                  <span className={`grid h-11 place-items-center rounded-lg text-[13px] font-semibold ${i === 0 ? "bg-accent text-paper" : "bg-tint text-sky"}`}>{i + 1}</span>
                  <Input aria-label={t("admin.editor.podiumPlace", { n: i + 1 })} value={name} placeholder={t("admin.editor.teamNamePh")} onChange={(e) => set("podium", podium.map((x, j) => (j === i ? e.target.value : x)))} />
                  <div className="col-span-2 flex gap-2 sm:col-span-1">
                    <button type="button" aria-label={t("admin.editor.moveUp")} disabled={i === 0} onClick={() => set("podium", move(podium, i, -1))} className={iconBtn}>
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" aria-label={t("admin.editor.moveDown")} disabled={i === podium.length - 1} onClick={() => set("podium", move(podium, i, 1))} className={iconBtn}>
                      <ArrowDown size={15} />
                    </button>
                    <button type="button" aria-label={t("common.action.remove")} onClick={() => set("podium", podium.filter((_, j) => j !== i))} className={iconBtn}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {podium.length < 10 && (
                <button type="button" onClick={() => set("podium", [...podium, ""])} className={smallBtn}>
                  <Plus size={14} /> {t("admin.editor.addPodium")}
                </button>
              )}
            </div>
          </Section>

          <Section title={t("admin.editor.where")}>
            <div className="grid gap-1.5">
              <span className="text-[13px] font-medium text-mist">{t("app.hack.format")}</span>
              <div className="inline-flex w-fit rounded-lg border border-line p-1" role="radiogroup" aria-label={t("app.hack.format")}>
                {MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={f.mode === m}
                    onClick={() => set("mode", m)}
                    className={`min-h-9 rounded-md px-4 text-[13px] font-semibold transition-colors ${f.mode === m ? "bg-tint text-ink" : "text-mist hover:text-ink"}`}
                  >
                    {t(`app.hack.mode.${m}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("app.hack.city")}>
                <Input value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Tashkent" />
              </Field>
              {f.mode !== "online" && (
                <Field label={t("app.hack.venue")}>
                  <Input value={f.venue} onChange={(e) => set("venue", e.target.value)} placeholder="School 21" />
                </Field>
              )}
            </div>
            {f.mode !== "online" && (
              <Field label={t("admin.editor.address")}>
                <Input value={f.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            )}
            {f.mode !== "offline" && (
              <Field label={t("admin.editor.onlineLink")} hint={t("admin.editor.onlineLinkHint")}>
                <Input value={f.onlineLink} onChange={(e) => set("onlineLink", e.target.value)} placeholder="meet.example.com/event" />
              </Field>
            )}
          </Section>

          <Section title={t("admin.editor.when")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("admin.editor.starts")}>
                <Input type="datetime-local" value={f.start} onChange={(e) => set("start", e.target.value)} />
              </Field>
              <Field label={t("admin.editor.ends")}>
                <Input type="datetime-local" value={f.end} onChange={(e) => set("end", e.target.value)} />
              </Field>
              <Field label={t("admin.editor.regOpens")}>
                <Input type="datetime-local" value={f.regOpen} onChange={(e) => set("regOpen", e.target.value)} />
              </Field>
              <Field label={t("admin.editor.regCloses")}>
                <Input type="datetime-local" value={f.regClose} onChange={(e) => set("regClose", e.target.value)} />
              </Field>
            </div>
            <Field label={t("admin.editor.timezone")}>
              <Input value={f.timezone} onChange={(e) => set("timezone", e.target.value)} />
            </Field>
          </Section>

          <Section title={t("admin.editor.participation")} text={t("admin.editor.participationText")}>
            <div className="grid gap-2">
              <span className="text-[13px] font-medium text-mist">{t("app.hack.tracks")}</span>
              <LabeledChips options={trackOptions} value={f.tracks} onChange={(v) => set("tracks", v)} label={trackLabel} />
              <div className="flex gap-2">
                <input
                  value={customTrack}
                  onChange={(e) => setCustomTrack(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom("tracks", customTrack, () => setCustomTrack("")))}
                  placeholder={t("admin.editor.customTrack")}
                  aria-label={t("admin.editor.customTrack")}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => addCustom("tracks", customTrack, () => setCustomTrack(""))}
                  disabled={!customTrack.trim()}
                  className="min-h-11 shrink-0 rounded-lg border border-line px-3 text-[13px] font-semibold text-mist hover:border-sky hover:text-ink disabled:opacity-40"
                >
                  {t("common.action.add")}
                </button>
              </div>
              <span className="text-[12px] text-mist">{t("admin.editor.tracksHint")}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("admin.editor.teamMin")}>
                <Stepper label={t("admin.editor.teamMin")} value={f.teamMin} min={1} max={20} onChange={(v) => set("teamMin", v)} />
              </Field>
              <Field label={t("admin.editor.teamMax")}>
                <Stepper label={t("admin.editor.teamMax")} value={f.teamMax} min={1} max={20} onChange={(v) => set("teamMax", v)} />
              </Field>
              <Field label={t("admin.editor.maxTeams")} hint={t("admin.editor.maxTeamsHint")}>
                <Stepper label={t("admin.editor.maxTeams")} value={f.maxTeams} min={0} max={1000} onChange={(v) => set("maxTeams", v)} />
              </Field>
            </div>
            <Toggle checked={f.soloAllowed} onChange={(v) => set("soloAllowed", v)} label={t("admin.editor.solo")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("admin.editor.ageFrom")}>
                <Stepper label={t("admin.editor.ageFrom")} value={f.ageMin} min={0} max={99} onChange={(v) => set("ageMin", v)} />
              </Field>
              <Field label={t("admin.editor.ageTo")}>
                <Stepper label={t("admin.editor.ageTo")} value={f.ageMax} min={0} max={99} onChange={(v) => set("ageMax", v)} />
              </Field>
            </div>
            <Field label={t("admin.editor.eligibility")}>
              <Textarea rows={2} value={f.eligibility} onChange={(e) => set("eligibility", e.target.value)} />
            </Field>
            <div className="grid gap-2">
              <span className="text-[13px] font-medium text-mist">{t("app.hack.languages")}</span>
              <LabeledChips options={langOptions} value={f.languages} onChange={(v) => set("languages", v)} label={langName} />
              <div className="flex gap-2">
                <input
                  value={customLang}
                  onChange={(e) => setCustomLang(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom("languages", customLang, () => setCustomLang("")))}
                  placeholder={t("admin.editor.customLang")}
                  aria-label={t("admin.editor.customLang")}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => addCustom("languages", customLang, () => setCustomLang(""))}
                  disabled={!customLang.trim()}
                  className="min-h-11 shrink-0 rounded-lg border border-line px-3 text-[13px] font-semibold text-mist hover:border-sky hover:text-ink disabled:opacity-40"
                >
                  {t("common.action.add")}
                </button>
              </div>
            </div>
          </Section>

          <Section title={t("admin.editor.prizes")} text={t("admin.editor.prizesText")}>
            <Field label={t("admin.editor.placeCount")} hint={t("admin.editor.placeCountHint")}>
              <div className="max-w-[220px]">
                <Stepper label={t("admin.editor.placeCount")} value={f.places.length} min={1} max={20} onChange={setPlaceCount} />
              </div>
            </Field>
            <div className="grid gap-2">
              {f.places.map((p, i) => (
                <div key={p.place} className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[44px_minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <span className="grid h-11 place-items-center rounded-lg bg-tint text-[13px] font-semibold text-sky">{p.place}</span>
                  <Input aria-label={t("admin.editor.placeTitle", { n: p.place })} value={p.title} onChange={(e) => set("places", f.places.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <Input
                    aria-label={t("admin.editor.placePrize", { n: p.place })}
                    className="col-span-2 sm:col-span-1"
                    placeholder={t("admin.editor.prizePh")}
                    value={p.prize}
                    onChange={(e) => set("places", f.places.map((x, j) => (j === i ? { ...x, prize: e.target.value } : x)))}
                  />
                </div>
              ))}
              <span className="text-[12px] text-mist">{t("admin.editor.placeTitleHint")}</span>
            </div>
            <div className="grid gap-2">
              <span className="text-[13px] font-medium text-mist">{t("app.hack.nominations")}</span>
              {f.nominations.length === 0 && <p className="text-[13px] text-mist">{t("admin.editor.noNominations")}</p>}
              {f.nominations.map((n, i) => (
                <div key={i} className="flex gap-2">
                  <Input aria-label={t("admin.editor.nomination")} value={n} placeholder="Best design" onChange={(e) => set("nominations", f.nominations.map((x, j) => (j === i ? e.target.value : x)))} />
                  <button type="button" aria-label={t("common.action.remove")} onClick={() => set("nominations", f.nominations.filter((_, j) => j !== i))} className={iconBtn}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set("nominations", [...f.nominations, ""])} className={smallBtn}>
                <Plus size={14} /> {t("admin.editor.addNomination")}
              </button>
            </div>
            <Field label={t("admin.editor.finalists")} hint={t("admin.editor.finalistsHint")}>
              <div className="max-w-[220px]">
                <Stepper label={t("admin.editor.finalists")} value={f.finalists} min={0} max={50} onChange={(v) => set("finalists", v)} />
              </div>
            </Field>
          </Section>

          <Section title={t("admin.editor.peopleTitle")} text={t("admin.editor.peopleText")}>
            <div className="grid gap-2">
              <span className="text-[13px] font-medium text-mist">{t("admin.editor.judges")}</span>
              <PeopleRows kind="judge" value={f.judges} onChange={(v) => set("judges", v)} />
            </div>
            <div className="grid gap-2">
              <span className="text-[13px] font-medium text-mist">{t("admin.editor.mentors")}</span>
              <PeopleRows kind="mentor" value={f.mentors} onChange={(v) => set("mentors", v)} />
            </div>
            <div className="grid gap-2">
              <span className="text-[13px] font-medium text-mist">{t("app.hack.partners")}</span>
              <TagInput value={f.sponsors} onChange={(v) => set("sponsors", v)} placeholder={t("admin.editor.sponsorsPh")} />
            </div>
          </Section>

          <Section title={t("app.hack.agenda")}>
            {f.agenda.length === 0 && <p className="text-[13px] text-mist">{t("admin.editor.noAgenda")}</p>}
            <div className="grid gap-2">
              {f.agenda.map((a, i) => (
                <div key={i} className="grid grid-cols-[104px_minmax(0,1fr)] gap-2 sm:grid-cols-[110px_minmax(0,1fr)_auto]">
                  <Input type="time" aria-label={t("admin.editor.time")} value={a.time} onChange={(e) => patchAgenda(i, { time: e.target.value })} />
                  <Input aria-label={t("admin.editor.whatHappens")} placeholder={t("admin.editor.whatHappensPh")} value={a.title} onChange={(e) => patchAgenda(i, { title: e.target.value })} />
                  <div className="col-span-2 flex gap-2 sm:col-span-1">
                    <button type="button" aria-label={t("admin.editor.moveUp")} disabled={i === 0} onClick={() => set("agenda", move(f.agenda, i, -1))} className={iconBtn}>
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" aria-label={t("admin.editor.moveDown")} disabled={i === f.agenda.length - 1} onClick={() => set("agenda", move(f.agenda, i, 1))} className={iconBtn}>
                      <ArrowDown size={15} />
                    </button>
                    <button type="button" aria-label={t("common.action.remove")} onClick={() => set("agenda", f.agenda.filter((_, j) => j !== i))} className={iconBtn}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => set("agenda", [...f.agenda, { time: "", title: "" }])} className={smallBtn}>
              <Plus size={14} /> {t("admin.editor.addSlot")}
            </button>
          </Section>

          <Section title={t("admin.editor.regForm")} text={t("admin.editor.regFormText")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={f.registrationFields.github} onChange={(v) => set("registrationFields", { ...f.registrationFields, github: v })} label={t("admin.editor.fieldGithub")} />
              <Toggle checked={f.registrationFields.portfolio} onChange={(v) => set("registrationFields", { ...f.registrationFields, portfolio: v })} label={t("admin.editor.fieldPortfolio")} />
              <Toggle checked={f.registrationFields.motivation} onChange={(v) => set("registrationFields", { ...f.registrationFields, motivation: v })} label={t("admin.editor.fieldMotivation")} />
              <Toggle checked={f.registrationFields.phone} onChange={(v) => set("registrationFields", { ...f.registrationFields, phone: v })} label={t("admin.editor.fieldPhone")} />
            </div>
          </Section>

          <Section title={t("admin.editor.statusTitle")} text={t("admin.editor.statusText")}>
            <div className="grid gap-2" role="radiogroup" aria-label={t("admin.editor.statusTitle")}>
              {STATUS_KEYS.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={f.status === s}
                  onClick={() => set("status", s)}
                  className={`flex min-h-11 items-start gap-3 rounded-lg border p-3 text-left transition-colors ${f.status === s ? "border-sky bg-tint" : "border-line hover:border-sky"}`}
                >
                  <span className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${f.status === s ? "border-accent" : "border-mist"}`}>
                    {f.status === s && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold">{statusLabel(s)}</span>
                    <span className="block text-[13px] text-mist">{statusHint(s)}</span>
                  </span>
                </button>
              ))}
            </div>
          </Section>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <div className="mb-2 text-[13px] font-medium text-mist">{t("admin.editor.preview")}</div>
          <EventPreview ev={f} />
        </aside>
      </div>

      <div className="sticky bottom-3 z-20 mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-paper p-2 md:bottom-4 md:p-3">
        <span className={`flex items-center gap-2 text-[13px] ${dirty ? "text-accent" : "text-mist"}`} title={t(dirty ? "admin.editor.unsaved" : "admin.editor.allSaved")}>
          <span className={`h-2 w-2 shrink-0 rounded-full ${dirty ? "bg-accent" : "bg-good"}`} />
          <span className="hidden sm:inline">{t(dirty ? "admin.editor.unsaved" : "admin.editor.allSaved")}</span>
        </span>
        <div className="ml-auto flex flex-nowrap gap-1.5 sm:gap-2">
          <button type="button" onClick={() => go("#/admin/events")} className="min-h-11 rounded-lg px-3 text-[13px] font-semibold text-mist hover:text-ink">
            {t("common.action.cancel")}
          </button>
          {isDraft && (
            <button type="button" disabled={save.pending} onClick={() => onSave("draft")} className="min-h-11 whitespace-nowrap rounded-lg border border-line px-3 text-[13px] font-semibold hover:border-sky hover:bg-tint disabled:opacity-60">
              {t("admin.editor.saveDraft")}
            </button>
          )}
          <button type="button" disabled={save.pending} onClick={() => onSave(isDraft ? "published" : undefined)} className={`${btn.primary} px-4 text-[14px] disabled:opacity-60 sm:px-5`}>
            {save.pending && <Spinner />}
            {t(isDraft ? "admin.editor.publish" : "common.action.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
