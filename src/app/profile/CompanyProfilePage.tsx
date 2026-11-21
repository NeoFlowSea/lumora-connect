import { api, completeness } from "../../api";
import { useAction } from "../../api/hooks";
import type { CompanyProfile, OrgKind } from "../../api/types";
import { useLang } from "../../i18n";
import { Field, Input, Select, Textarea } from "../../components/form";
import { useToast } from "../../components/ui";
import { CitySelect, PhotoPicker, Segmented, TagInput } from "../../onboarding/fields";
import { IndustryInput, sizeOptions } from "../../onboarding/Onboarding";
import { BENEFITS, benefitLabel } from "../../onboarding/options";
import { EmailBanner } from "../../onboarding/shared";
import { SaveBar, Section, useDraft } from "./kit";
import { Summary, VerificationCard } from "./Verification";
import { AccountCard } from "./Account";

/* A company's or organization's own profile. */

type Draft = {
  logo: string;
  name: string;
  orgKind: OrgKind;
  tagline: string;
  about: string;
  industry: string;
  size: string;
  foundedYear: string;
  city: string;
  tags: string[];
  website: string;
  contact: string;
  telegram: string;
  linkedin: string;
  benefits: string[];
};

function pick(c: CompanyProfile): Draft {
  return {
    logo: c.logo,
    name: c.name,
    orgKind: c.orgKind,
    tagline: c.tagline,
    about: c.about,
    industry: c.industry,
    size: c.size,
    foundedYear: c.foundedYear,
    city: c.city,
    tags: c.tags,
    website: c.website,
    contact: c.contact,
    telegram: c.telegram,
    linkedin: c.linkedin,
    benefits: c.benefits,
  };
}

function toPatch(d: Draft) {
  const trim = (s: string) => s.trim();
  return {
    ...d,
    name: trim(d.name),
    tagline: trim(d.tagline),
    about: trim(d.about),
    industry: trim(d.industry),
    foundedYear: trim(d.foundedYear),
    city: trim(d.city),
    website: trim(d.website),
    contact: trim(d.contact),
    telegram: trim(d.telegram),
    linkedin: trim(d.linkedin),
  };
}

export const COMPANY_SECTION: Record<string, string> = {
  logo: "about",
  tagline: "about",
  about: "about",
  industry: "details",
  founded: "details",
  website: "contact",
  contact: "contact",
  benefits: "benefits",
};

export function CompanyProfilePage({ c }: { c: CompanyProfile }) {
  const { t } = useLang();
  const toast = useToast();
  const { draft, set, dirty, reset } = useDraft(pick(c));
  const save = useAction(api.users.updateMe);
  const merged = { ...c, ...toPatch(draft) } as CompanyProfile;
  const check = completeness(merged);
  const org = draft.orgKind === "organization";

  async function onSave() {
    const next = await save.run(toPatch(draft));
    if (next && next.kind === "company") {
      reset(pick(next));
      toast(t("profile.save.saved"));
    }
  }

  return (
    <>
      <div className="mb-6 grid gap-4">
        <div>
          <h1 className="text-[26px] md:text-[30px]">{t(org ? "profile.page.orgTitle" : "profile.page.companyTitle")}</h1>
          <p className="mt-1 text-[15px] text-mist">{t("profile.page.companyText")}</p>
        </div>
        <EmailBanner user={c} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <aside className="min-w-0 lg:order-2">
          <div className="scrollbar-none grid gap-6 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7.5rem)] lg:overflow-y-auto">
            <Summary user={merged} check={check} sectionOf={COMPANY_SECTION} />
            <VerificationCard user={c} check={completeness(c)} dirty={dirty} />
          </div>
        </aside>
        <div className="grid min-w-0 content-start gap-6 lg:order-1">
          <Section id="about" title={t("profile.sec.companyAbout")} text={t("profile.sec.companyAboutText")}>
            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <span className="text-[13px] font-medium text-mist">{t("profile.field.logo")}</span>
                <PhotoPicker value={draft.logo} onChange={set("logo")} name={draft.name} square />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t(org ? "profile.field.orgName" : "profile.field.companyName")}>
                  <Input required value={draft.name} onChange={(e) => set("name")(e.target.value)} maxLength={80} autoComplete="organization" />
                </Field>
                <div className="grid gap-1.5">
                  <span className="text-[13px] font-medium text-mist">{t("profile.field.orgKind")}</span>
                  <Segmented
                    label={t("profile.field.orgKind")}
                    value={draft.orgKind}
                    onChange={set("orgKind")}
                    options={[
                      { value: "company", label: t("profile.account.company") },
                      { value: "organization", label: t("profile.account.organization") },
                    ]}
                  />
                </div>
              </div>
              <Field label={t("profile.field.tagline")} hint={t("profile.field.taglineHint")}>
                <Input value={draft.tagline} onChange={(e) => set("tagline")(e.target.value)} placeholder={t("profile.field.taglinePh")} maxLength={100} />
              </Field>
              <Field label={t("profile.field.about")} hint={t("profile.field.aboutHint")}>
                <Textarea rows={6} value={draft.about} onChange={(e) => set("about")(e.target.value)} placeholder={t("profile.field.aboutPh")} maxLength={1500} />
              </Field>
            </div>
          </Section>

          <Section id="details" title={t("profile.sec.details")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("profile.field.industry")}>
                <IndustryInput value={draft.industry} onChange={set("industry")} />
              </Field>
              <Field label={t("profile.field.size")}>
                <Select value={draft.size} onChange={(e) => set("size")(e.target.value)} options={sizeOptions(draft.size, t("profile.field.choose"))} />
              </Field>
              <Field label={t("profile.field.founded")}>
                <Input inputMode="numeric" value={draft.foundedYear} onChange={(e) => set("foundedYear")(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2019" />
              </Field>
              <div className="grid gap-1.5">
                <span className="text-[13px] font-medium text-mist">{t("profile.field.city")}</span>
                <CitySelect value={draft.city} onChange={set("city")} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <span className="text-[13px] font-medium text-mist">{t("profile.field.tags")}</span>
                <TagInput value={draft.tags} onChange={set("tags")} placeholder={t("profile.field.tagsPh")} max={12} />
              </div>
            </div>
          </Section>

          <Section id="contact" title={t("profile.sec.contact")} text={t("profile.sec.contactText")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("profile.field.website")} hint={t("profile.field.websiteHint")}>
                <Input inputMode="url" value={draft.website} onChange={(e) => set("website")(e.target.value)} placeholder="company.uz" maxLength={200} />
              </Field>
              <Field label={t("profile.field.contact")} hint={t("profile.field.contactHint")}>
                <Input value={draft.contact} onChange={(e) => set("contact")(e.target.value)} placeholder="hr@company.uz" maxLength={120} />
              </Field>
              <Field label={t("profile.field.companyTelegram")}>
                <Input value={draft.telegram} onChange={(e) => set("telegram")(e.target.value)} placeholder="@company" maxLength={80} />
              </Field>
              <Field label={t("profile.field.linkedin")}>
                <Input value={draft.linkedin} onChange={(e) => set("linkedin")(e.target.value)} placeholder="linkedin.com/company/..." maxLength={200} />
              </Field>
            </div>
          </Section>

          <Section id="benefits" title={t("profile.sec.benefits")} text={t("profile.sec.benefitsText")}>
            <TagInput value={draft.benefits} onChange={set("benefits")} suggestions={BENEFITS} labelFor={benefitLabel} placeholder={t("profile.field.benefitsPh")} max={12} />
          </Section>

          <AccountCard user={c} />
        </div>
      </div>
      <SaveBar show={dirty} pending={save.pending} error={save.error} onSave={onSave} onDiscard={() => reset()} />
      {dirty && <div className="h-24" aria-hidden />}
    </>
  );
}
