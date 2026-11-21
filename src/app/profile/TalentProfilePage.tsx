import { useRef, useState } from "react";
import { Download, ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { api, completeness } from "../../api";
import { useAction, useApi } from "../../api/hooks";
import type { EducationEntry, ExperienceEntry, FileRef, ProjectEntry, TalentProfile, WorkFormat } from "../../api/types";
import { locale, useLang } from "../../i18n";
import { ErrorNote, Field, Input, Select, Spinner, Textarea } from "../../components/form";
import { useToast } from "../../components/ui";
import { CitySelect, OptionChips, PhotoPicker, TagInput } from "../../onboarding/fields";
import { EducationFields, roleSuggestions, skillSuggestions } from "../../onboarding/Onboarding";
import { AVAIL, availLabel, FORMATS, formatLabel, LANGUAGES, languageLabel, roleLabel, TRACKS, trackLabel, uid } from "../../onboarding/options";
import { CV_LIMIT, fileSize, pdfToFileRef } from "../../onboarding/media";
import { EmailBanner } from "../../onboarding/shared";
import { ListEditor, SaveBar, Section, useDraft } from "./kit";
import { Summary, VerificationCard } from "./Verification";
import { Applications, HackathonHistory } from "./Activity";
import { AccountCard } from "./Account";

/* The talent's own profile: every field editable in sections, saved together from the save bar. */

type Draft = {
  name: string;
  headline: string;
  bio: string;
  cat: string;
  city: string;
  age: string;
  photo: string;
  education: EducationEntry;
  languages: string[];
  skills: string[];
  roles: string[];
  workFormats: WorkFormat[];
  expectedStipend: string;
  avail: string;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  github: string;
  portfolio: string;
  linkedin: string;
  contact: string;
  cv: FileRef | null;
};

function pick(u: TalentProfile): Draft {
  return {
    name: u.name,
    headline: u.headline,
    bio: u.bio,
    cat: u.cat,
    city: u.city,
    age: u.age ? String(u.age) : "",
    photo: u.photo,
    education: u.education,
    languages: u.languages,
    skills: u.skills,
    roles: u.roles,
    workFormats: u.workFormats,
    expectedStipend: u.expectedStipend,
    avail: u.avail,
    experience: u.experience,
    projects: u.projects,
    github: u.github,
    portfolio: u.portfolio,
    linkedin: u.linkedin,
    contact: u.contact,
    cv: u.cv,
  };
}

function toPatch(d: Draft) {
  const age = Number.parseInt(d.age, 10);
  return {
    ...d,
    name: d.name.trim(),
    headline: d.headline.trim(),
    bio: d.bio.trim(),
    city: d.city.trim(),
    age: Number.isFinite(age) ? Math.max(10, Math.min(99, age)) : null,
    education: { ...d.education, institution: d.education.institution.trim(), program: d.education.program.trim(), year: d.education.year.trim() },
    expectedStipend: d.expectedStipend.trim(),
    github: d.github.trim(),
    portfolio: d.portfolio.trim(),
    linkedin: d.linkedin.trim(),
    contact: d.contact.trim(),
    project: d.projects[0]?.name ?? "",
  };
}

/** which section holds each completeness item */
export const TALENT_SECTION: Record<string, string> = {
  photo: "about",
  headline: "about",
  bio: "about",
  education: "education",
  languages: "languages",
  skills: "skills",
  roles: "skills",
  experience: "experience",
  projects: "projects",
  links: "links",
  contact: "links",
  cv: "cv",
};

export function TalentProfilePage({ u }: { u: TalentProfile }) {
  const { t } = useLang();
  const toast = useToast();
  const { draft, set, dirty, reset } = useDraft(pick(u));
  const save = useAction(api.users.updateMe);
  const merged = { ...u, ...toPatch(draft) } as TalentProfile;
  const check = completeness(merged);

  async function onSave() {
    const next = await save.run(toPatch(draft));
    if (next && next.kind === "talent") {
      reset(pick(next));
      toast(t("profile.save.saved"));
    }
  }

  return (
    <>
      <div className="mb-6 grid gap-4">
        <div>
          <h1 className="text-[26px] md:text-[30px]">{t("profile.page.title")}</h1>
          <p className="mt-1 text-[15px] text-mist">{t("profile.page.talentText")}</p>
        </div>
        <EmailBanner user={u} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <aside className="min-w-0 lg:order-2">
          <div className="scrollbar-none grid gap-6 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7.5rem)] lg:overflow-y-auto">
            <Summary user={merged} check={check} sectionOf={TALENT_SECTION} />
            <VerificationCard user={u} check={completeness(u)} dirty={dirty} />
          </div>
        </aside>
        <div className="grid min-w-0 content-start gap-6 lg:order-1">
          <Section id="about" title={t("profile.sec.about")} text={t("profile.sec.aboutText")}>
            <div className="grid gap-5">
              <PhotoPicker value={draft.photo} onChange={set("photo")} name={draft.name} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("profile.field.name")}>
                  <Input required value={draft.name} onChange={(e) => set("name")(e.target.value)} maxLength={80} autoComplete="name" />
                </Field>
                <Field label={t("profile.field.track")}>
                  <Select value={draft.cat} onChange={(e) => set("cat")(e.target.value)} options={TRACKS.map((c) => ({ value: c, label: trackLabel(c) }))} />
                </Field>
                <Field label={t("profile.field.headline")} hint={t("profile.field.headlineHint")} className="sm:col-span-2">
                  <Input value={draft.headline} onChange={(e) => set("headline")(e.target.value)} placeholder={t("profile.field.headlinePh")} maxLength={90} />
                </Field>
                <div className="grid gap-1.5">
                  <span className="text-[13px] font-medium text-mist">{t("profile.field.city")}</span>
                  <CitySelect value={draft.city} onChange={set("city")} />
                </div>
                <Field label={t("profile.field.age")}>
                  <Input inputMode="numeric" value={draft.age} onChange={(e) => set("age")(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="19" />
                </Field>
              </div>
              <Field label={t("profile.field.bio")} hint={t("profile.field.bioHint")}>
                <Textarea rows={5} value={draft.bio} onChange={(e) => set("bio")(e.target.value)} placeholder={t("profile.field.bioPh")} maxLength={1200} />
              </Field>
            </div>
          </Section>

          <Section id="education" title={t("profile.sec.education")}>
            <EducationFields value={draft.education} onChange={set("education")} />
          </Section>

          <Section id="languages" title={t("profile.sec.languages")}>
            <OptionChips
              label={t("profile.sec.languages")}
              options={[...LANGUAGES, ...draft.languages.filter((l) => !LANGUAGES.includes(l))].map((l) => ({ value: l, label: languageLabel(l) }))}
              value={draft.languages}
              onChange={set("languages")}
            />
          </Section>

          <Section id="skills" title={t("profile.sec.skills")} text={t("profile.sec.skillsText")}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <span className="text-[13px] font-medium text-mist">{t("profile.field.skills")}</span>
                <TagInput value={draft.skills} onChange={set("skills")} suggestions={skillSuggestions(draft.cat)} placeholder={t("profile.field.skillsPh")} />
              </div>
              <div className="grid gap-2">
                <span className="text-[13px] font-medium text-mist">{t("profile.field.roles")}</span>
                <TagInput value={draft.roles} onChange={set("roles")} suggestions={roleSuggestions(draft.cat)} labelFor={roleLabel} placeholder={t("profile.field.rolesPh")} max={8} />
              </div>
              <div className="grid gap-2">
                <span className="text-[13px] font-medium text-mist">{t("profile.field.formats")}</span>
                <OptionChips
                  label={t("profile.field.formats")}
                  options={FORMATS.map((f) => ({ value: f, label: formatLabel(f) }))}
                  value={draft.workFormats}
                  onChange={(v) => set("workFormats")(v as WorkFormat[])}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("profile.field.avail")}>
                  <Select
                    value={draft.avail}
                    onChange={(e) => set("avail")(e.target.value)}
                    options={(AVAIL.includes(draft.avail) || !draft.avail ? AVAIL : [draft.avail, ...AVAIL]).map((a) => ({ value: a, label: availLabel(a) }))}
                  />
                </Field>
                <Field label={t("profile.field.stipend")}>
                  <Input value={draft.expectedStipend} onChange={(e) => set("expectedStipend")(e.target.value)} placeholder={t("profile.field.stipendPh")} maxLength={80} />
                </Field>
              </div>
            </div>
          </Section>

          <Section id="experience" title={t("profile.sec.experience")} text={t("profile.sec.experienceText")}>
            <ListEditor<ExperienceEntry>
              items={draft.experience}
              onChange={set("experience")}
              blank={() => ({ id: uid("x"), title: "", org: "", period: "", desc: "" })}
              valid={(x) => !!x.title.trim() && !!x.org.trim()}
              addLabel={t("profile.exp.add")}
              emptyText={t("profile.exp.empty")}
              render={(x) => (
                <>
                  <p className="font-semibold">{x.title}</p>
                  <p className="text-[13px] text-mist">{[x.org, x.period].filter(Boolean).join(", ")}</p>
                  {x.desc && <p className="mt-1 text-[14px] text-mist">{x.desc}</p>}
                </>
              )}
              form={(x, setX) => (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("profile.exp.title")}>
                    <Input value={x.title} onChange={(e) => setX({ ...x, title: e.target.value })} placeholder={t("profile.exp.titlePh")} maxLength={80} />
                  </Field>
                  <Field label={t("profile.exp.org")}>
                    <Input value={x.org} onChange={(e) => setX({ ...x, org: e.target.value })} placeholder={t("profile.exp.orgPh")} maxLength={80} />
                  </Field>
                  <Field label={t("profile.exp.period")} className="sm:col-span-2">
                    <Input value={x.period} onChange={(e) => setX({ ...x, period: e.target.value })} placeholder={t("profile.exp.periodPh")} maxLength={60} />
                  </Field>
                  <Field label={t("profile.exp.desc")} className="sm:col-span-2">
                    <Textarea rows={3} value={x.desc} onChange={(e) => setX({ ...x, desc: e.target.value })} maxLength={600} />
                  </Field>
                </div>
              )}
            />
          </Section>

          <Section id="projects" title={t("profile.sec.projects")} text={t("profile.sec.projectsText")}>
            <ProjectsEditor value={draft.projects} onChange={set("projects")} />
          </Section>

          <Section id="links" title={t("profile.sec.links")} text={t("profile.sec.linksText")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("profile.field.github")}>
                <Input value={draft.github} onChange={(e) => set("github")(e.target.value)} placeholder="github.com/username" maxLength={200} />
              </Field>
              <Field label={t("profile.field.portfolio")}>
                <Input value={draft.portfolio} onChange={(e) => set("portfolio")(e.target.value)} placeholder="behance.net/username" maxLength={200} />
              </Field>
              <Field label={t("profile.field.linkedin")}>
                <Input value={draft.linkedin} onChange={(e) => set("linkedin")(e.target.value)} placeholder="linkedin.com/in/username" maxLength={200} />
              </Field>
              <Field label={t("profile.field.telegram")} hint={t("profile.field.telegramHint")}>
                <Input value={draft.contact} onChange={(e) => set("contact")(e.target.value)} placeholder="@username" maxLength={80} />
              </Field>
            </div>
          </Section>

          <Section id="cv" title={t("profile.sec.cv")} text={t("profile.cv.text", { size: fileSize(CV_LIMIT, locale()) })}>
            <CvField value={draft.cv} onChange={set("cv")} />
          </Section>

          <HackathonHistory u={u} />
          <Applications />
          <AccountCard user={u} />
        </div>
      </div>
      <SaveBar show={dirty} pending={save.pending} error={save.error} onSave={onSave} onDiscard={() => reset()} />
      {dirty && <div className="h-24" aria-hidden />}
    </>
  );
}

function ProjectsEditor({ value, onChange }: { value: ProjectEntry[]; onChange: (v: ProjectEntry[]) => void }) {
  const { t } = useLang();
  const events = useApi(() => api.hackathons.list(), []);
  const titles = Array.from(new Set((events.data ?? []).filter((h) => h.status !== "draft").map((h) => h.title)));
  return (
    <ListEditor<ProjectEntry>
      items={value}
      onChange={onChange}
      blank={() => ({ id: uid("p"), name: "", url: "", role: "", desc: "", event: "" })}
      valid={(p) => !!p.name.trim()}
      addLabel={t("profile.proj.add")}
      emptyText={t("profile.proj.empty")}
      render={(p) => (
        <>
          <p className="font-semibold">{p.name}</p>
          <p className="text-[13px] text-mist">{[p.role, p.event].filter(Boolean).join(", ")}</p>
          {p.desc && <p className="mt-1 text-[14px] text-mist">{p.desc}</p>}
          {p.url && (
            <a href={/^https?:\/\//.test(p.url) ? p.url : `https://${p.url}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-[13px] text-sky hover:text-ink">
              <ExternalLink size={13} className="shrink-0" /> {p.url}
            </a>
          )}
        </>
      )}
      form={(p, setP) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("profile.field.projectName")}>
            <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder={t("profile.field.projectNamePh")} maxLength={80} />
          </Field>
          <Field label={t("profile.field.projectRole")}>
            <Input value={p.role} onChange={(e) => setP({ ...p, role: e.target.value })} placeholder={t("profile.field.projectRolePh")} maxLength={80} />
          </Field>
          <Field label={t("profile.field.projectUrl")}>
            <Input inputMode="url" value={p.url} onChange={(e) => setP({ ...p, url: e.target.value })} placeholder="https://" maxLength={200} />
          </Field>
          <Field label={t("profile.proj.event")}>
            <Select
              value={p.event}
              onChange={(e) => setP({ ...p, event: e.target.value })}
              options={[{ value: "", label: t("profile.proj.noEvent") }, ...(p.event && !titles.includes(p.event) ? [p.event] : []), ...titles]}
            />
          </Field>
          <Field label={t("profile.field.projectDesc")} className="sm:col-span-2">
            <Textarea rows={3} value={p.desc} onChange={(e) => setP({ ...p, desc: e.target.value })} placeholder={t("profile.field.projectDescPh")} maxLength={600} />
          </Field>
        </div>
      )}
    />
  );
}

function CvField({ value, onChange }: { value: FileRef | null; onChange: (v: FileRef | null) => void }) {
  const { t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await pdfToFileRef(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid gap-3">
      <input ref={input} type="file" accept="application/pdf,.pdf" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-paper/30 p-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-tint text-sky">
            <FileText size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{value.name}</p>
            <p className="text-[13px] text-mist">{fileSize(value.size, locale())}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <a href={value.dataUrl} download={value.name} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold text-sky hover:bg-tint hover:text-ink">
              <Download size={15} /> {t("common.action.download")}
            </a>
            <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold text-mist hover:bg-tint hover:text-ink">
              {busy ? <Spinner /> : <Upload size={15} />} {t("common.action.replace")}
            </button>
            <button type="button" onClick={() => onChange(null)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold text-mist hover:bg-tint hover:text-ink">
              <Trash2 size={15} /> {t("common.action.remove")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex min-h-20 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line px-4 text-[14px] font-semibold text-mist transition-colors hover:border-sky hover:text-ink"
        >
          {busy ? <Spinner /> : <Upload size={17} />} {t("profile.cv.upload")}
        </button>
      )}
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}
