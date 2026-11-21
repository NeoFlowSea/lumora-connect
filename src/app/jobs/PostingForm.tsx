import { useState, type FormEvent, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, type OpportunityWithCompany } from "../../api";
import { useAction } from "../../api/hooks";
import type { OpportunityInput, OpportunityLevel, OpportunityType, Schedule, WorkFormat } from "../../api/types";
import { categories } from "../../data";
import { ErrorNote, Field, Input, Select, Spinner, Textarea, Toggle } from "../../components/form";
import { btn, useToast } from "../../components/ui";
import { trackLabel, useLang } from "../../i18n";
import { FORMATS, LEVELS, SCHEDULES, TYPES, formatLabel, levelLabel, lines, money, scheduleLabel, typeLabel } from "./format";

const CITIES = ["Tashkent", "Samarkand", "Bukhara", "Andijan", "Fergana", "Namangan", "Nukus", "Karshi", "Jizzakh", "Guliston", "Termez", "Urgench", "Navoi", "Angren"];
const MAX_Q = 3;

/** stored text version of the salary, kept for older screens that still read "pay" */
function payText(min: number | null, max: number | null, type: OpportunityType) {
  const f = (n: number) => n.toLocaleString("en-US");
  if (min == null && max == null) return type === "Event" ? "Free" : "Unpaid";
  if (min != null && max != null) return `${min === max ? f(min) : `${f(min)}–${f(max)}`} UZS per month`;
  return min != null ? `From ${f(min)} UZS per month` : `Up to ${f(max!)} UZS per month`;
}

const num = (s: string) => {
  const n = Number(s.replace(/[\s,.]/g, ""));
  return s.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line pt-5">
      <h3 className="text-[16px]">{title}</h3>
      {children}
    </section>
  );
}

export function PostingForm({ initial, onDone }: { initial: OpportunityWithCompany | null; onDone: () => void }) {
  const { t } = useLang();
  const toast = useToast();
  const [type, setType] = useState<OpportunityType>(initial?.type ?? "Internship");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [cats, setCats] = useState<string[]>(initial?.cats ?? []);
  const [level, setLevel] = useState<OpportunityLevel>(initial?.level ?? "intern");
  const [format, setFormat] = useState<WorkFormat>(initial?.format ?? "onsite");
  const [schedule, setSchedule] = useState<Schedule>(initial?.schedule ?? "part-time");
  const [city, setCity] = useState(initial ? (initial.city === "Remote" ? "" : initial.city) : "");
  const [unpaid, setUnpaid] = useState(initial ? initial.salaryMin == null && initial.salaryMax == null : false);
  const [min, setMin] = useState(initial?.salaryMin != null ? String(initial.salaryMin) : "");
  const [max, setMax] = useState(initial?.salaryMax != null ? String(initial.salaryMax) : "");
  const [openings, setOpenings] = useState(String(initial?.openings ?? 1));
  const [deadline, setDeadline] = useState(initial?.deadline?.slice(0, 10) ?? "");
  const [dur, setDur] = useState(initial?.dur ?? "");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [resp, setResp] = useState((initial?.responsibilities ?? []).join("\n"));
  const [req, setReq] = useState((initial?.req ?? []).join("\n"));
  const [nice, setNice] = useState((initial?.niceToHave ?? []).join("\n"));
  const [perks, setPerks] = useState((initial?.perks ?? []).join("\n"));
  const [questions, setQuestions] = useState<string[]>(initial?.questions.length ? initial.questions : []);
  const [localError, setLocalError] = useState<string | null>(null);

  const create = useAction(api.opportunities.create);
  const update = useAction(async (id: string, patch: OpportunityInput) => {
    await api.opportunities.update(id, patch);
    return true;
  });
  const pending = create.pending || update.pending;
  const error = localError || create.error || update.error;
  const isEvent = type === "Event";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const sMin = unpaid ? null : num(min);
    const sMax = unpaid ? null : num(max) ?? sMin;
    const open = Math.max(0, Math.floor(Number(openings) || 0));
    if (!title.trim()) return setLocalError(t("jobs.form.errTitle"));
    if (!cats.length) return setLocalError(t("jobs.form.errTrack"));
    if (!unpaid && sMin == null && sMax == null) return setLocalError(t("jobs.form.errSalary"));
    if (sMin != null && sMax != null && sMax < sMin) return setLocalError(t("jobs.form.errSalaryOrder"));
    if (open < 1) return setLocalError(t("jobs.form.errOpenings"));

    const input: OpportunityInput = {
      title: title.trim(),
      type,
      cats,
      city: format === "remote" ? "Remote" : city.trim() || "Tashkent",
      dur: dur.trim(),
      pay: payText(sMin, sMax, type),
      desc: desc.trim(),
      req: lines(req),
      responsibilities: lines(resp),
      niceToHave: lines(nice),
      salaryMin: sMin,
      salaryMax: sMax,
      level,
      format,
      schedule,
      deadline,
      openings: open,
      perks: lines(perks),
      questions: questions.map((q) => q.trim()).filter(Boolean).slice(0, MAX_Q),
      closed: initial?.closed ?? false,
    };
    if (initial) {
      const ok = await update.run(initial.id, input);
      if (ok) {
        toast(t("jobs.form.updated"));
        onDone();
      }
    } else {
      const created = await create.run(input);
      if (created) {
        toast(t("jobs.form.published"));
        onDone();
      }
    }
  }

  const salaryHint = !unpaid && num(min) != null ? `${money(num(min)!)}${num(max) != null && num(max) !== num(min) ? `–${money(num(max)!)}` : ""} UZS` : undefined;

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      <div>
        <h2 className="text-[22px]">{initial ? t("jobs.form.editTitle") : t("jobs.form.newTitle")}</h2>
        <p className="mt-1 text-[13px] text-mist">{t("jobs.form.lead")}</p>
      </div>

      <Section title={t("jobs.form.basics")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("jobs.form.type")}>
            <Select value={type} onChange={(e) => setType(e.target.value as OpportunityType)} options={TYPES.map((x) => ({ value: x, label: typeLabel(x) }))} />
          </Field>
          <Field label={t("jobs.form.level")}>
            <Select value={level} onChange={(e) => setLevel(e.target.value as OpportunityLevel)} options={LEVELS.map((x) => ({ value: x, label: levelLabel(x) }))} />
          </Field>
          <Field label={t("jobs.form.title")} className="sm:col-span-2">
            <Input required maxLength={90} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("jobs.form.titlePlaceholder")} />
          </Field>
        </div>
        <Field label={t("jobs.form.tracks")} hint={t("jobs.form.tracksHint")}>
          <div className="flex flex-wrap gap-2">
            {categories.map(({ name }) => {
              const on = cats.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCats(on ? cats.filter((x) => x !== name) : [...cats, name])}
                  className={`min-h-11 rounded-lg border px-3 text-[13px] font-medium transition-colors ${
                    on ? "border-sky bg-tint text-ink" : "border-line text-mist hover:border-sky hover:text-ink"
                  }`}
                >
                  {trackLabel(name)}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("jobs.form.format")}>
            <Select value={format} onChange={(e) => setFormat(e.target.value as WorkFormat)} options={FORMATS.map((x) => ({ value: x, label: formatLabel(x) }))} />
          </Field>
          <Field label={t("jobs.form.schedule")}>
            <Select value={schedule} onChange={(e) => setSchedule(e.target.value as Schedule)} options={SCHEDULES.map((x) => ({ value: x, label: scheduleLabel(x) }))} />
          </Field>
          <Field label={t("jobs.form.city")} hint={format === "remote" ? t("jobs.form.cityRemote") : undefined}>
            <Input list="lumora-cities" value={city} disabled={format === "remote"} onChange={(e) => setCity(e.target.value)} placeholder="Tashkent" />
            <datalist id="lumora-cities">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>
      </Section>

      <Section title={t("jobs.form.payDates")}>
        <Toggle checked={unpaid} onChange={setUnpaid} label={isEvent ? t("jobs.form.free") : t("jobs.form.unpaid")} />
        {!unpaid && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("jobs.form.salaryMin")} hint={salaryHint}>
              <Input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="2000000" />
            </Field>
            <Field label={t("jobs.form.salaryMax")} hint={t("jobs.form.salaryMaxHint")}>
              <Input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="2500000" />
            </Field>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={isEvent ? t("jobs.fact.seats") : t("jobs.fact.openings")}>
            <Input type="number" min={1} max={500} value={openings} onChange={(e) => setOpenings(e.target.value)} />
          </Field>
          <Field label={t("jobs.form.deadline")}>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <Field label={t("jobs.fact.duration")}>
            <Input value={dur} maxLength={60} onChange={(e) => setDur(e.target.value)} placeholder={t("jobs.form.durationPlaceholder")} />
          </Field>
        </div>
      </Section>

      <Section title={t("jobs.form.details")}>
        <Field label={isEvent ? t("jobs.section.aboutEvent") : t("jobs.section.about")}>
          <Textarea rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("jobs.form.descPlaceholder")} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("jobs.section.responsibilities")} hint={t("jobs.form.onePerLine")}>
            <Textarea rows={4} value={resp} onChange={(e) => setResp(e.target.value)} placeholder={t("jobs.form.respPlaceholder")} />
          </Field>
          <Field label={t("jobs.section.requirements")} hint={t("jobs.form.onePerLine")}>
            <Textarea rows={4} value={req} onChange={(e) => setReq(e.target.value)} placeholder={t("jobs.form.reqPlaceholder")} />
          </Field>
          <Field label={t("jobs.section.nice")} hint={t("jobs.form.onePerLine")}>
            <Textarea rows={3} value={nice} onChange={(e) => setNice(e.target.value)} placeholder={t("jobs.form.nicePlaceholder")} />
          </Field>
          <Field label={t("jobs.section.perks")} hint={t("jobs.form.onePerLine")}>
            <Textarea rows={3} value={perks} onChange={(e) => setPerks(e.target.value)} placeholder={t("jobs.form.perksPlaceholder")} />
          </Field>
        </div>
      </Section>

      <Section title={t("jobs.form.questions")}>
        <p className="-mt-2 text-[13px] text-mist">{t("jobs.form.questionsHint", { n: MAX_Q })}</p>
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-2">
            <Field label={t("jobs.form.question", { n: i + 1 })} className="min-w-0 flex-1">
              <Input value={q} maxLength={200} onChange={(e) => setQuestions((s) => s.map((x, j) => (j === i ? e.target.value : x)))} />
            </Field>
            <button
              type="button"
              onClick={() => setQuestions((s) => s.filter((_, j) => j !== i))}
              aria-label={t("common.action.remove")}
              className="mt-[26px] grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line text-mist hover:text-ink"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {questions.length < MAX_Q && (
          <button type="button" onClick={() => setQuestions((s) => [...s, ""])} className={`${btn.ghost} justify-self-start`}>
            <Plus size={16} /> {t("jobs.form.addQuestion")}
          </button>
        )}
      </Section>

      <ErrorNote>{error}</ErrorNote>
      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <button type="submit" disabled={pending} className={`${btn.primary} disabled:opacity-60`}>
          {pending && <Spinner />} {initial ? t("common.action.saveChanges") : t("jobs.form.publish")}
        </button>
        <button type="button" onClick={onDone} className={btn.ghost}>
          {t("common.action.cancel")}
        </button>
      </div>
    </form>
  );
}
