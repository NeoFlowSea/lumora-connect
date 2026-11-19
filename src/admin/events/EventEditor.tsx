import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Users } from "lucide-react";
import { api } from "../../api";
import { useAction, useApi } from "../../api/hooks";
import type { AgendaItem, EventMode, EventStatus, HackathonInput, Person } from "../../api/types";
import { categories } from "../../data";
import { Card, Chips, Empty, ErrorNote, Field, Input, Select, Skeleton, Spinner, Textarea, Toggle, inputCls } from "../../components/form";
import { btn, useToast } from "../../components/ui";
import { go, useRoute } from "../../lib/router";
import { EventPreview } from "./EventPreview";
import { ACCENTS, EVENT_TYPES, LANGUAGES, STATUSES, Stepper, TagInput, defaultEvent, ordinal, toInput } from "./shared";

function Section({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="text-[17px]">{title}</h2>
      {text && <p className="mt-1 text-[12px] text-mist">{text}</p>}
      <div className="mt-5 grid gap-4">{children}</div>
    </Card>
  );
}

const MODES: { value: EventMode; label: string }[] = [
  { value: "offline", label: "Offline" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

const iconBtn = "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-mist transition-colors hover:border-sky hover:text-ink disabled:opacity-30";

function PeopleRows({ value, onChange, noun }: { value: Person[]; onChange: (v: Person[]) => void; noun: string }) {
  const patch = (i: number, p: Partial<Person>) => onChange(value.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="grid gap-3">
      {value.length === 0 && <p className="text-[12px] text-mist">No {noun}s yet.</p>}
      {value.map((p, i) => (
        <div key={i} className="grid gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:border-0 sm:p-0">
          <Input aria-label={`${noun} name`} placeholder="Name" value={p.name} onChange={(e) => patch(i, { name: e.target.value })} />
          <Input aria-label={`${noun} role`} placeholder="Role, e.g. CTO" value={p.role} onChange={(e) => patch(i, { role: e.target.value })} />
          <Input aria-label={`${noun} company`} placeholder="Company" value={p.company} onChange={(e) => patch(i, { company: e.target.value })} />
          <button type="button" aria-label={`Remove ${noun}`} onClick={() => onChange(value.filter((_, j) => j !== i))} className={iconBtn}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { name: "", role: "", company: "" }])} className={`${btn.sm} w-fit border border-line hover:border-sky hover:bg-tint`}>
        <Plus size={14} /> Add {noun}
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
      next = { ...toInput(src.data), title: `${src.data.title} (copy)`, status: "draft" };
    } else {
      next = defaultEvent();
    }
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
    return <Empty title="Event not found" text="It may have been deleted by another admin." action={<button onClick={() => go("#/admin/events")} className={btn.ghost}>Back to events</button>} />;
  }
  if (!form) return <Skeleton rows={4} className="h-48" />;

  const f = form;
  const dirty = JSON.stringify(f) !== base;
  const set = <K extends keyof HackathonInput>(k: K, v: HackathonInput[K]) => setForm((s) => (s ? { ...s, [k]: v } : s));

  const orgOptions = [
    { value: "lumora", label: "Lumora" },
    ...(orgs.data ?? []).map((c) => ({ value: c.id, label: `${c.name}${c.orgKind === "organization" ? " (organization)" : ""}` })),
  ];
  if (!orgOptions.some((o) => o.value === f.organizerId)) orgOptions.push({ value: f.organizerId, label: f.organizerName });

  const catNames = categories.map((c) => c.name);
  const trackOptions = [...catNames, ...f.tracks.filter((t) => !catNames.includes(t))];
  const langOptions = [...LANGUAGES, ...f.languages.filter((l) => !LANGUAGES.includes(l))];

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

  const moveAgenda = (i: number, d: -1 | 1) => {
    const list = [...f.agenda];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    set("agenda", list);
  };
  const patchAgenda = (i: number, p: Partial<AgendaItem>) => set("agenda", f.agenda.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function onSave(status?: EventStatus) {
    const payload: HackathonInput = status ? { ...f, status } : f;
    const savedId = await save.run(payload);
    if (!savedId) return;
    setForm(payload);
    setBase(JSON.stringify(payload));
    toast(status === "published" ? "Event published" : "Event saved");
    go(`#/admin/events/${savedId}`);
  }

  const isDraft = f.status === "draft";

  return (
    <div className="pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <button onClick={() => go("#/admin/events")} className="text-[12px] font-semibold text-mist hover:text-ink">
            Events
          </button>
          <h1 className="mt-1 break-words text-[clamp(22px,3vw,30px)]">{id ? `Edit ${f.title || "event"}` : from ? "Duplicate event" : "Create event"}</h1>
          <p className="mt-1 text-[13px] text-mist">Every field shows up for participants exactly as you see it in the preview.</p>
        </div>
        {id && (
          <button onClick={() => go(`#/admin/events/${id}/teams`)} className={`${btn.sm} border border-line hover:border-sky hover:bg-tint`}>
            <Users size={14} /> Teams & results
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
          <Section title="Basics" text="What the event is and who runs it.">
            <Field label="Title">
              <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Tashkent IT Case Competition" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organizer" hint="Lumora or an approved partner organization.">
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
              <Field label="Event type">
                <Select value={f.eventType} options={EVENT_TYPES} onChange={(e) => set("eventType", e.target.value as HackathonInput["eventType"])} />
              </Field>
            </div>
            <Field label="Short description" hint="One or two sentences for cards and the landing page.">
              <Textarea rows={2} value={f.short} onChange={(e) => set("short", e.target.value)} />
            </Field>
            <Field label="Full description">
              <Textarea rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Case brief" hint="Optional. Leave empty if the case is revealed on the day.">
              <Textarea rows={2} value={f.caseBrief} onChange={(e) => set("caseBrief", e.target.value)} />
            </Field>
            <div className="grid gap-1.5">
              <span className="text-[12px] font-semibold text-mist">Card color</span>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => set("accent", a.value)}
                    aria-pressed={f.accent === a.value}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                      f.accent === a.value ? "border-accent text-ink" : "border-line text-mist hover:border-sky"
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full ${a.swatch}`} /> {a.label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Where">
            <div className="grid gap-1.5">
              <span className="text-[12px] font-semibold text-mist">Format</span>
              <div className="inline-flex w-fit rounded-full border border-line p-1">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => set("mode", m.value)}
                    className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${f.mode === m.value ? "bg-accent text-paper" : "text-mist hover:text-ink"}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City">
                <Input value={f.city} onChange={(e) => set("city", e.target.value)} placeholder={f.mode === "online" ? "Online" : "Tashkent"} />
              </Field>
              {f.mode !== "online" && (
                <Field label="Venue">
                  <Input value={f.venue} onChange={(e) => set("venue", e.target.value)} placeholder="IT Park, hall B" />
                </Field>
              )}
            </div>
            {f.mode !== "online" && (
              <Field label="Address">
                <Input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, district" />
              </Field>
            )}
            {f.mode !== "offline" && (
              <Field label="Online link" hint="Shared with registered teams.">
                <Input value={f.onlineLink} onChange={(e) => set("onlineLink", e.target.value)} placeholder="meet.example.com/event" />
              </Field>
            )}
          </Section>

          <Section title="When">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts">
                <Input type="datetime-local" value={f.start} onChange={(e) => set("start", e.target.value)} />
              </Field>
              <Field label="Ends">
                <Input type="datetime-local" value={f.end} onChange={(e) => set("end", e.target.value)} />
              </Field>
              <Field label="Registration opens">
                <Input type="datetime-local" value={f.regOpen} onChange={(e) => set("regOpen", e.target.value)} />
              </Field>
              <Field label="Registration closes">
                <Input type="datetime-local" value={f.regClose} onChange={(e) => set("regClose", e.target.value)} />
              </Field>
            </div>
            <Field label="Timezone">
              <Input value={f.timezone} onChange={(e) => set("timezone", e.target.value)} />
            </Field>
          </Section>

          <Section title="Participation" text="Who can join and in what kind of team.">
            <div className="grid gap-2">
              <span className="text-[12px] font-semibold text-mist">Tracks</span>
              <Chips options={trackOptions} value={f.tracks} onChange={(v) => set("tracks", v)} />
              <div className="flex gap-2">
                <input
                  value={customTrack}
                  onChange={(e) => setCustomTrack(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom("tracks", customTrack, () => setCustomTrack("")))}
                  placeholder="Add a custom track, e.g. FinTech"
                  className={inputCls}
                />
                <button type="button" onClick={() => addCustom("tracks", customTrack, () => setCustomTrack(""))} disabled={!customTrack.trim()} className="shrink-0 rounded-xl border border-line px-3 text-[13px] font-semibold text-mist hover:border-sky hover:text-ink disabled:opacity-40">
                  Add
                </button>
              </div>
              <span className="text-[11px] text-mist/80">Click a selected track to remove it. Custom tracks disappear when removed.</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Team size, min">
                <Stepper label="minimum team size" value={f.teamMin} min={1} max={20} onChange={(v) => set("teamMin", v)} />
              </Field>
              <Field label="Team size, max">
                <Stepper label="maximum team size" value={f.teamMax} min={1} max={20} onChange={(v) => set("teamMax", v)} />
              </Field>
              <Field label="Max teams" hint="0 means no limit.">
                <Stepper label="maximum number of teams" value={f.maxTeams} min={0} max={1000} onChange={(v) => set("maxTeams", v)} />
              </Field>
            </div>
            <Toggle checked={f.soloAllowed} onChange={(v) => set("soloAllowed", v)} label="Solo participants allowed" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Age, from">
                <Stepper label="minimum age" value={f.ageMin} min={0} max={99} onChange={(v) => set("ageMin", v)} />
              </Field>
              <Field label="Age, to">
                <Stepper label="maximum age" value={f.ageMax} min={0} max={99} onChange={(v) => set("ageMax", v)} />
              </Field>
            </div>
            <Field label="Eligibility notes">
              <Textarea rows={2} value={f.eligibility} onChange={(e) => set("eligibility", e.target.value)} />
            </Field>
            <div className="grid gap-2">
              <span className="text-[12px] font-semibold text-mist">Languages</span>
              <Chips options={langOptions} value={f.languages} onChange={(v) => set("languages", v)} />
              <div className="flex gap-2">
                <input
                  value={customLang}
                  onChange={(e) => setCustomLang(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom("languages", customLang, () => setCustomLang("")))}
                  placeholder="Add a language"
                  className={inputCls}
                />
                <button type="button" onClick={() => addCustom("languages", customLang, () => setCustomLang(""))} disabled={!customLang.trim()} className="shrink-0 rounded-xl border border-line px-3 text-[13px] font-semibold text-mist hover:border-sky hover:text-ink disabled:opacity-40">
                  Add
                </button>
              </div>
            </div>
          </Section>

          <Section title="Prizes and winners" text="How many places win, what each gets, and extra awards.">
            <Field label="Number of winning places" hint="From 1 to 20. Rows are added or removed below.">
              <div className="max-w-[200px]">
                <Stepper label="number of winning places" value={f.places.length} min={1} max={20} onChange={setPlaceCount} />
              </div>
            </Field>
            <div className="grid gap-2">
              {f.places.map((p, i) => (
                <div key={p.place} className="grid grid-cols-[44px_1fr] items-center gap-2 sm:grid-cols-[44px_minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <span className="grid h-10 place-items-center rounded-xl bg-tint text-[13px] font-semibold text-sky">{p.place}</span>
                  <Input aria-label={`Title for place ${p.place}`} value={p.title} onChange={(e) => set("places", f.places.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <Input
                    aria-label={`Prize for place ${p.place}`}
                    className="col-span-2 sm:col-span-1"
                    placeholder="Prize, e.g. 1,000,000 UZS"
                    value={p.prize}
                    onChange={(e) => set("places", f.places.map((x, j) => (j === i ? { ...x, prize: e.target.value } : x)))}
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              <span className="text-[12px] font-semibold text-mist">Special nominations</span>
              {f.nominations.length === 0 && <p className="text-[12px] text-mist">None. Add awards like Best design or Best pitch.</p>}
              {f.nominations.map((n, i) => (
                <div key={i} className="flex gap-2">
                  <Input aria-label="Nomination name" value={n} placeholder="Best design" onChange={(e) => set("nominations", f.nominations.map((x, j) => (j === i ? e.target.value : x)))} />
                  <button type="button" aria-label="Remove nomination" onClick={() => set("nominations", f.nominations.filter((_, j) => j !== i))} className={iconBtn}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set("nominations", [...f.nominations, ""])} className={`${btn.sm} w-fit border border-line hover:border-sky hover:bg-tint`}>
                <Plus size={14} /> Add nomination
              </button>
            </div>
            <Field label="Finalists" hint="Teams marked as finalists also get a badge.">
              <div className="max-w-[200px]">
                <Stepper label="number of finalists" value={f.finalists} min={0} max={50} onChange={(v) => set("finalists", v)} />
              </div>
            </Field>
          </Section>

          <Section title="People" text="Judges, mentors and partners shown on the event page.">
            <div className="grid gap-2">
              <span className="text-[12px] font-semibold text-mist">Judges</span>
              <PeopleRows noun="judge" value={f.judges} onChange={(v) => set("judges", v)} />
            </div>
            <div className="grid gap-2">
              <span className="text-[12px] font-semibold text-mist">Mentors</span>
              <PeopleRows noun="mentor" value={f.mentors} onChange={(v) => set("mentors", v)} />
            </div>
            <div className="grid gap-2">
              <span className="text-[12px] font-semibold text-mist">Sponsors and partners</span>
              <TagInput value={f.sponsors} onChange={(v) => set("sponsors", v)} placeholder="Type a name and press Enter" />
            </div>
          </Section>

          <Section title="Agenda">
            {f.agenda.length === 0 && <p className="text-[12px] text-mist">No agenda yet. Add time slots like 10:00 Case reveal.</p>}
            <div className="grid gap-2">
              {f.agenda.map((a, i) => (
                <div key={i} className="grid grid-cols-[96px_minmax(0,1fr)] gap-2 sm:grid-cols-[110px_minmax(0,1fr)_auto]">
                  <Input type="time" aria-label="Time" value={a.time} onChange={(e) => patchAgenda(i, { time: e.target.value })} />
                  <Input aria-label="What happens" placeholder="Case reveal" value={a.title} onChange={(e) => patchAgenda(i, { title: e.target.value })} />
                  <div className="col-span-2 flex gap-2 sm:col-span-1">
                    <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => moveAgenda(i, -1)} className={iconBtn}>
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" aria-label="Move down" disabled={i === f.agenda.length - 1} onClick={() => moveAgenda(i, 1)} className={iconBtn}>
                      <ArrowDown size={15} />
                    </button>
                    <button type="button" aria-label="Remove slot" onClick={() => set("agenda", f.agenda.filter((_, j) => j !== i))} className={iconBtn}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => set("agenda", [...f.agenda, { time: "", title: "" }])} className={`${btn.sm} w-fit border border-line hover:border-sky hover:bg-tint`}>
              <Plus size={14} /> Add time slot
            </button>
          </Section>

          <Section title="Registration form" text="Team name, members, track and contact are always asked. Pick what else participants must fill in.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={f.registrationFields.github} onChange={(v) => set("registrationFields", { ...f.registrationFields, github: v })} label="GitHub link" />
              <Toggle checked={f.registrationFields.portfolio} onChange={(v) => set("registrationFields", { ...f.registrationFields, portfolio: v })} label="Portfolio link" />
              <Toggle checked={f.registrationFields.motivation} onChange={(v) => set("registrationFields", { ...f.registrationFields, motivation: v })} label="Why do you want to join" />
              <Toggle checked={f.registrationFields.phone} onChange={(v) => set("registrationFields", { ...f.registrationFields, phone: v })} label="Phone number" />
            </div>
          </Section>

          <Section title="Status" text="Controls who can see the event and whether teams can register.">
            <div className="grid gap-2" role="radiogroup" aria-label="Event status">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={f.status === s.value}
                  onClick={() => set("status", s.value)}
                  className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${f.status === s.value ? "border-accent bg-accent/10" : "border-line hover:border-sky"}`}
                >
                  <span className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${f.status === s.value ? "border-accent" : "border-mist"}`}>
                    {f.status === s.value && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold">{s.label}</span>
                    <span className="block text-[12px] text-mist">{s.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </Section>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <div className="mb-2 text-[12px] font-semibold text-mist">Live preview</div>
          <EventPreview ev={f} />
        </aside>
      </div>

      <div className="sticky bottom-3 z-20 mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-paper/95 p-2.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] backdrop-blur md:bottom-4 md:p-3">
        <span className={`flex items-center gap-2 text-[12px] ${dirty ? "text-accent" : "text-mist"}`} title={dirty ? "Unsaved changes" : "All changes saved"}>
          <span className={`h-2 w-2 rounded-full ${dirty ? "bg-accent" : "bg-good"}`} />
          <span className="hidden sm:inline">{dirty ? "Unsaved changes" : "All changes saved"}</span>
        </span>
        {save.error && <span className="w-full text-[12px] text-[#ffb3b3] sm:order-none sm:w-auto">{save.error}</span>}
        <div className="ml-auto flex flex-nowrap gap-1.5 sm:gap-2">
          <button type="button" onClick={() => go("#/admin/events")} className={`${btn.sm} px-3 text-mist hover:text-ink`}>
            Cancel
          </button>
          {isDraft && (
            <button type="button" disabled={save.pending} onClick={() => onSave("draft")} className={`${btn.sm} whitespace-nowrap border border-line px-3 hover:border-sky hover:bg-tint disabled:opacity-60`}>
              Save draft
            </button>
          )}
          <button type="button" disabled={save.pending} onClick={() => onSave(isDraft ? "published" : undefined)} className={`${btn.primary} px-4 py-2 text-[13px] disabled:opacity-60 sm:px-5`}>
            {save.pending && <Spinner />}
            {isDraft ? "Publish" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
