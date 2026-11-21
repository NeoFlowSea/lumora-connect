import { useState, type FormEvent, type ReactNode } from "react";
import { api, completeness } from "../api";
import { useAction, useSession } from "../api/hooks";
import type { CompanyProfile, EducationEntry, TalentProfile, WorkFormat } from "../api/types";
import { useLang } from "../i18n";
import { ErrorNote, Field, Input, Select, Spinner, Textarea } from "../components/form";
import { btn } from "../components/ui";
import { Wordmark } from "../components/Logo";
import { LangSwitch } from "../components/LangSwitch";
import { go, useRoute } from "../lib/router";
import { OptionChips, PhotoPicker, TagInput } from "./fields";
import {
  BENEFITS,
  benefitLabel,
  COMMON_ROLES,
  COMMON_SKILLS,
  EDU_LEVELS,
  FORMATS,
  formatLabel,
  INDUSTRIES,
  LANGUAGES,
  languageLabel,
  ROLES_BY_TRACK,
  roleLabel,
  SIZES,
  sizeLabel,
  SKILLS_BY_TRACK,
  uid,
} from "./options";
import { CompletenessList, EmailBanner, Levels } from "./shared";

/* #/onboarding: the first sign-in. A short wizard that fills the profile step by step.
   Each step saves through users.updateMe; "Skip for now" moves on without saving.
   Finishing marks the account onboarded and opens the app. */

const TALENT_STEPS = ["about", "education", "skills", "project", "done"] as const;
const COMPANY_STEPS = ["brand", "about", "contact", "benefits", "done"] as const;

export function Onboarding() {
  const { t } = useLang();
  const user = useSession();
  const { query } = useRoute();
  const finish = useAction(async (to: string) => {
    await api.users.finishOnboarding();
    go(to);
    return true;
  });
  if (!user || user.kind === "admin") return null;

  const steps: readonly string[] = user.kind === "talent" ? TALENT_STEPS : COMPANY_STEPS;
  const last = steps.length - 1;
  const step = Math.max(0, Math.min(last, Number.parseInt(query.step ?? "0", 10) || 0));
  const key = steps[step];
  const toStep = (n: number) => go(n === 0 ? "#/onboarding" : `#/onboarding?step=${n}`);
  const nav = { next: () => toStep(step + 1), back: step > 0 ? () => toStep(step - 1) : undefined };

  return (
    <div className="min-h-[100svh] bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-[760px] items-center justify-between gap-3 px-4 sm:px-6">
          <Wordmark size={28} />
          <div className="flex shrink-0 items-center gap-2">
            <LangSwitch />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[760px] gap-6 px-4 pb-20 pt-6 sm:px-6 md:pt-10">
        <EmailBanner user={user} />

        <div className="grid gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[14px] font-medium text-sky">{t("profile.onb.stepOf", { n: step + 1, total: steps.length })}</p>
            {step < last && (
              <button type="button" onClick={() => finish.run("#/app")} disabled={finish.pending} className="min-h-11 text-[14px] font-medium text-mist hover:text-ink">
                {t("profile.onb.later")}
              </button>
            )}
          </div>
          <ol className="grid grid-cols-5 gap-1.5" aria-label={t("profile.onb.progress")}>
            {steps.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined} className={`h-1.5 rounded-full ${i <= step ? "bg-blue" : "bg-line"}`}>
                <span className="sr-only">{t(`profile.onb.${user.kind}.${s}.title`, { name: user.name.split(" ")[0] })}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h1 className="text-[26px] sm:text-[32px]">{t(`profile.onb.${user.kind}.${key}.title`, { name: user.name.split(" ")[0] })}</h1>
          <p className="mt-2 max-w-[60ch] text-[15px] text-mist">{t(`profile.onb.${user.kind}.${key}.text`)}</p>
        </div>

        {user.kind === "talent" ? (
          <>
            {key === "about" && <TalentAbout key={key} u={user} {...nav} />}
            {key === "education" && <TalentEducation key={key} u={user} {...nav} />}
            {key === "skills" && <TalentSkills key={key} u={user} {...nav} />}
            {key === "project" && <TalentProject key={key} u={user} {...nav} />}
          </>
        ) : (
          <>
            {key === "brand" && <CompanyBrand key={key} c={user} {...nav} />}
            {key === "about" && <CompanyAbout key={key} c={user} {...nav} />}
            {key === "contact" && <CompanyContact key={key} c={user} {...nav} />}
            {key === "benefits" && <CompanyBenefits key={key} c={user} {...nav} />}
          </>
        )}
        {key === "done" && <Done user={user} finish={finish.run} pending={finish.pending} error={finish.error} back={nav.back} />}
      </main>
    </div>
  );
}

type Nav = { next: () => void; back?: () => void };

/** a step's form: saves the patch, then moves on */
function StepForm({ patch, next, back, children }: Nav & { patch: () => Parameters<typeof api.users.updateMe>[0]; children: ReactNode }) {
  const { t } = useLang();
  const save = useAction(api.users.updateMe);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (await save.run(patch())) next();
  }
  return (
    <form onSubmit={submit} className="grid gap-5">
      {children}
      <ErrorNote>{save.error}</ErrorNote>
      <div className="mt-1 flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:gap-3">
        {back && (
          <button type="button" onClick={back} className={btn.ghost}>
            {t("common.action.back")}
          </button>
        )}
        <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row sm:items-center sm:gap-3">
          <button type="button" onClick={next} className="min-h-11 px-3 text-[15px] font-semibold text-mist hover:text-ink">
            {t("common.action.skip")}
          </button>
          <button type="submit" disabled={save.pending} className={`${btn.primary} disabled:opacity-70`}>
            {save.pending && <Spinner />} {t("profile.onb.saveNext")}
          </button>
        </div>
      </div>
    </form>
  );
}

function Counter({ value, min }: { value: string; min: number }) {
  const { t } = useLang();
  const n = value.trim().length;
  return <span className={n >= min ? "text-good" : ""}>{n >= min ? t("profile.field.enough") : t("profile.field.charsLeft", { n: min - n })}</span>;
}

/* ---------- talent ---------- */

function TalentAbout({ u, ...nav }: Nav & { u: TalentProfile }) {
  const { t } = useLang();
  const [photo, setPhoto] = useState(u.photo);
  const [headline, setHeadline] = useState(u.headline);
  const [bio, setBio] = useState(u.bio);
  return (
    <StepForm {...nav} patch={() => ({ photo, headline: headline.trim(), bio: bio.trim() })}>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-medium text-mist">{t("profile.field.photo")}</span>
        <PhotoPicker value={photo} onChange={setPhoto} name={u.name} />
      </div>
      <Field label={t("profile.field.headline")} hint={t("profile.field.headlineHint")}>
        <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={t("profile.field.headlinePh")} maxLength={90} />
      </Field>
      <Field label={t("profile.field.bio")}>
        <Textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("profile.field.bioPh")} maxLength={1200} />
        <span className="text-[12px] text-mist">
          <Counter value={bio} min={40} />
        </span>
      </Field>
    </StepForm>
  );
}

export function EducationFields({ value, onChange }: { value: EducationEntry; onChange: (v: EducationEntry) => void }) {
  const { t } = useLang();
  const set = (k: keyof EducationEntry) => (v: string) => onChange({ ...value, [k]: v } as EducationEntry);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t("profile.field.institution")} className="sm:col-span-2">
        <Input value={value.institution} onChange={(e) => set("institution")(e.target.value)} placeholder={t("profile.field.institutionPh")} maxLength={120} />
      </Field>
      <Field label={t("profile.field.eduLevel")}>
        <Select
          value={value.level}
          onChange={(e) => set("level")(e.target.value)}
          options={[{ value: "", label: t("profile.field.choose") }, ...EDU_LEVELS.map((l) => ({ value: l, label: t(`profile.edu.${l}`) }))]}
        />
      </Field>
      <Field label={t("profile.field.year")}>
        <Input value={value.year} onChange={(e) => set("year")(e.target.value)} placeholder={t("profile.field.yearPh")} maxLength={40} />
      </Field>
      <Field label={t("profile.field.program")} className="sm:col-span-2">
        <Input value={value.program} onChange={(e) => set("program")(e.target.value)} placeholder={t("profile.field.programPh")} maxLength={120} />
      </Field>
    </div>
  );
}

function TalentEducation({ u, ...nav }: Nav & { u: TalentProfile }) {
  const { t } = useLang();
  const [edu, setEdu] = useState<EducationEntry>(u.education);
  const [langs, setLangs] = useState<string[]>(u.languages);
  const langOptions = [...LANGUAGES, ...langs.filter((l) => !LANGUAGES.includes(l))].map((l) => ({ value: l, label: languageLabel(l) }));
  return (
    <StepForm {...nav} patch={() => ({ education: { ...edu, institution: edu.institution.trim(), program: edu.program.trim(), year: edu.year.trim() }, languages: langs })}>
      <EducationFields value={edu} onChange={setEdu} />
      <div className="grid gap-2">
        <span className="text-[13px] font-medium text-mist">{t("profile.field.languages")}</span>
        <OptionChips label={t("profile.field.languages")} options={langOptions} value={langs} onChange={setLangs} />
      </div>
    </StepForm>
  );
}

export function skillSuggestions(cat: string) {
  return [...(SKILLS_BY_TRACK[cat] ?? []), ...COMMON_SKILLS];
}
export function roleSuggestions(cat: string) {
  return [...(ROLES_BY_TRACK[cat] ?? []), ...COMMON_ROLES];
}

function TalentSkills({ u, ...nav }: Nav & { u: TalentProfile }) {
  const { t } = useLang();
  const [skills, setSkills] = useState<string[]>(u.skills);
  const [roles, setRoles] = useState<string[]>(u.roles);
  const [formats, setFormats] = useState<string[]>(u.workFormats);
  const [stipend, setStipend] = useState(u.expectedStipend);
  return (
    <StepForm {...nav} patch={() => ({ skills, roles, workFormats: formats as WorkFormat[], expectedStipend: stipend.trim() })}>
      <div className="grid gap-2">
        <span className="text-[13px] font-medium text-mist">{t("profile.field.skills")}</span>
        <TagInput value={skills} onChange={setSkills} suggestions={skillSuggestions(u.cat)} placeholder={t("profile.field.skillsPh")} />
        <span className="text-[12px] text-mist">{t("profile.field.skillsHint")}</span>
      </div>
      <div className="grid gap-2">
        <span className="text-[13px] font-medium text-mist">{t("profile.field.roles")}</span>
        <TagInput value={roles} onChange={setRoles} suggestions={roleSuggestions(u.cat)} labelFor={roleLabel} placeholder={t("profile.field.rolesPh")} max={8} />
      </div>
      <div className="grid gap-2">
        <span className="text-[13px] font-medium text-mist">{t("profile.field.formats")}</span>
        <OptionChips label={t("profile.field.formats")} options={FORMATS.map((f) => ({ value: f, label: formatLabel(f) }))} value={formats} onChange={setFormats} />
      </div>
      <Field label={t("profile.field.stipend")} hint={t("profile.field.stipendHint")}>
        <Input value={stipend} onChange={(e) => setStipend(e.target.value)} placeholder={t("profile.field.stipendPh")} maxLength={80} />
      </Field>
    </StepForm>
  );
}

function TalentProject({ u, ...nav }: Nav & { u: TalentProfile }) {
  const { t } = useLang();
  const first = u.projects[0];
  const [p, setP] = useState({ name: first?.name ?? "", url: first?.url ?? "", role: first?.role ?? "", desc: first?.desc ?? "" });
  const [links, setLinks] = useState({ github: u.github, portfolio: u.portfolio, contact: u.contact });
  const setPf = (k: keyof typeof p) => (v: string) => setP((s) => ({ ...s, [k]: v }));
  const setL = (k: keyof typeof links) => (v: string) => setLinks((s) => ({ ...s, [k]: v }));

  function patch() {
    const name = p.name.trim();
    const projects = name
      ? [{ id: first?.id ?? uid("p"), event: first?.event ?? "", name, url: p.url.trim(), role: p.role.trim(), desc: p.desc.trim() }, ...u.projects.slice(1)]
      : u.projects;
    return { projects, project: name || u.project, github: links.github.trim(), portfolio: links.portfolio.trim(), contact: links.contact.trim() };
  }

  return (
    <StepForm {...nav} patch={patch}>
      <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2 sm:p-5">
        <legend className="px-1 text-[14px] font-semibold text-ink">{t("profile.field.project")}</legend>
        <Field label={t("profile.field.projectName")}>
          <Input value={p.name} onChange={(e) => setPf("name")(e.target.value)} placeholder={t("profile.field.projectNamePh")} maxLength={80} />
        </Field>
        <Field label={t("profile.field.projectRole")}>
          <Input value={p.role} onChange={(e) => setPf("role")(e.target.value)} placeholder={t("profile.field.projectRolePh")} maxLength={80} />
        </Field>
        <Field label={t("profile.field.projectUrl")} className="sm:col-span-2">
          <Input type="url" inputMode="url" value={p.url} onChange={(e) => setPf("url")(e.target.value)} placeholder="https://" maxLength={200} />
        </Field>
        <Field label={t("profile.field.projectDesc")} className="sm:col-span-2">
          <Textarea rows={3} value={p.desc} onChange={(e) => setPf("desc")(e.target.value)} placeholder={t("profile.field.projectDescPh")} maxLength={600} />
        </Field>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("profile.field.github")}>
          <Input value={links.github} onChange={(e) => setL("github")(e.target.value)} placeholder="github.com/username" maxLength={200} />
        </Field>
        <Field label={t("profile.field.portfolio")}>
          <Input value={links.portfolio} onChange={(e) => setL("portfolio")(e.target.value)} placeholder="behance.net/username" maxLength={200} />
        </Field>
        <Field label={t("profile.field.telegram")} hint={t("profile.field.telegramHint")} className="sm:col-span-2">
          <Input value={links.contact} onChange={(e) => setL("contact")(e.target.value)} placeholder="@username" maxLength={80} />
        </Field>
      </div>
    </StepForm>
  );
}

/* ---------- company ---------- */

function CompanyBrand({ c, ...nav }: Nav & { c: CompanyProfile }) {
  const { t } = useLang();
  const [logo, setLogo] = useState(c.logo);
  const [tagline, setTagline] = useState(c.tagline);
  return (
    <StepForm {...nav} patch={() => ({ logo, tagline: tagline.trim() })}>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-medium text-mist">{t("profile.field.logo")}</span>
        <PhotoPicker value={logo} onChange={setLogo} name={c.name} square />
      </div>
      <Field label={t("profile.field.tagline")} hint={t("profile.field.taglineHint")}>
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder={t("profile.field.taglinePh")} maxLength={100} />
      </Field>
    </StepForm>
  );
}

export function IndustryInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <Input value={value} onChange={(e) => onChange(e.target.value)} list="lumora-industries" placeholder="EdTech" maxLength={60} />
      <datalist id="lumora-industries">
        {INDUSTRIES.map((i) => (
          <option key={i} value={i} />
        ))}
      </datalist>
    </>
  );
}

export function sizeOptions(current: string, chooseLabel: string) {
  const list = SIZES.includes(current) || !current ? SIZES : [current, ...SIZES];
  return [{ value: "", label: chooseLabel }, ...list.map((s) => ({ value: s, label: sizeLabel(s) }))];
}

function CompanyAbout({ c, ...nav }: Nav & { c: CompanyProfile }) {
  const { t } = useLang();
  const [f, setF] = useState({ about: c.about, industry: c.industry, size: c.size, foundedYear: c.foundedYear });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <StepForm {...nav} patch={() => ({ about: f.about.trim(), industry: f.industry.trim(), size: f.size, foundedYear: f.foundedYear.trim() })}>
      <Field label={t("profile.field.about")}>
        <Textarea rows={6} value={f.about} onChange={(e) => set("about")(e.target.value)} placeholder={t("profile.field.aboutPh")} maxLength={1500} />
        <span className="text-[12px] text-mist">
          <Counter value={f.about} min={60} />
        </span>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("profile.field.industry")}>
          <IndustryInput value={f.industry} onChange={set("industry")} />
        </Field>
        <Field label={t("profile.field.size")}>
          <Select value={f.size} onChange={(e) => set("size")(e.target.value)} options={sizeOptions(f.size, t("profile.field.choose"))} />
        </Field>
        <Field label={t("profile.field.founded")}>
          <Input inputMode="numeric" value={f.foundedYear} onChange={(e) => set("foundedYear")(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2019" />
        </Field>
      </div>
    </StepForm>
  );
}

function CompanyContact({ c, ...nav }: Nav & { c: CompanyProfile }) {
  const { t } = useLang();
  const [f, setF] = useState({ website: c.website, contact: c.contact, telegram: c.telegram, linkedin: c.linkedin });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <StepForm {...nav} patch={() => ({ website: f.website.trim(), contact: f.contact.trim(), telegram: f.telegram.trim(), linkedin: f.linkedin.trim() })}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("profile.field.website")} hint={t("profile.field.websiteHint")}>
          <Input inputMode="url" value={f.website} onChange={(e) => set("website")(e.target.value)} placeholder="company.uz" maxLength={200} />
        </Field>
        <Field label={t("profile.field.contact")} hint={t("profile.field.contactHint")}>
          <Input value={f.contact} onChange={(e) => set("contact")(e.target.value)} placeholder="hr@company.uz" maxLength={120} />
        </Field>
        <Field label={t("profile.field.companyTelegram")}>
          <Input value={f.telegram} onChange={(e) => set("telegram")(e.target.value)} placeholder="@company" maxLength={80} />
        </Field>
        <Field label={t("profile.field.linkedin")}>
          <Input value={f.linkedin} onChange={(e) => set("linkedin")(e.target.value)} placeholder="linkedin.com/company/..." maxLength={200} />
        </Field>
      </div>
    </StepForm>
  );
}

function CompanyBenefits({ c, ...nav }: Nav & { c: CompanyProfile }) {
  const { t } = useLang();
  const [benefits, setBenefits] = useState<string[]>(c.benefits);
  return (
    <StepForm {...nav} patch={() => ({ benefits })}>
      <div className="grid gap-2">
        <span className="text-[13px] font-medium text-mist">{t("profile.field.benefits")}</span>
        <TagInput value={benefits} onChange={setBenefits} suggestions={BENEFITS} labelFor={benefitLabel} placeholder={t("profile.field.benefitsPh")} max={12} />
      </div>
    </StepForm>
  );
}

/* ---------- done ---------- */

function Done({
  user,
  finish,
  pending,
  error,
  back,
}: {
  user: TalentProfile | CompanyProfile;
  finish: (to: string) => Promise<unknown>;
  pending: boolean;
  error: string | null;
  back?: () => void;
}) {
  const { t } = useLang();
  const c = completeness(user);
  const missing = c.items.filter((i) => i.required && !i.done).length;
  return (
    <div className="grid gap-6">
      {user.kind === "company" && (
        <div className="rounded-xl border border-line bg-surface p-4 text-[14px] text-mist">
          <p className="font-semibold text-ink">{t(`profile.status.${user.status}`)}</p>
          <p className="mt-1">{t(`profile.onb.company.approval.${user.status}`)}</p>
        </div>
      )}
      <div className="rounded-xl border border-line bg-surface p-5">
        <CompletenessList c={c} />
        <p className="mt-4 text-[14px] text-mist">{c.ready ? t("profile.onb.readyToVerify") : t("profile.onb.missing", { n: missing })}</p>
      </div>
      <div className="grid gap-3">
        <h2 className="text-[18px]">{t("profile.levels.title")}</h2>
        <Levels user={user} />
      </div>
      <ErrorNote>{error}</ErrorNote>
      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:gap-3">
        {back && (
          <button type="button" onClick={back} className={btn.ghost}>
            {t("common.action.back")}
          </button>
        )}
        <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row sm:gap-3">
          <button type="button" disabled={pending} onClick={() => finish("#/app/profile")} className={`${btn.ghost} disabled:opacity-60`}>
            {t("profile.onb.keepFilling")}
          </button>
          <button type="button" disabled={pending} onClick={() => finish("#/app")} className={`${btn.primary} disabled:opacity-70`}>
            {pending && <Spinner />} {t("profile.onb.open")}
          </button>
        </div>
      </div>
    </div>
  );
}
