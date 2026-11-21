import { useState, type FormEvent } from "react";
import { BadgeCheck, Clock, Eye, ShieldCheck } from "lucide-react";
import { api } from "../../api";
import type { Completeness } from "../../api";
import { useAction } from "../../api/hooks";
import type { CompanyProfile, TalentProfile, VerificationLevel, VerificationProof } from "../../api/types";
import { locale, useLang } from "../../i18n";
import { ErrorNote, Input, Spinner, Textarea } from "../../components/form";
import { btn, useToast } from "../../components/ui";
import { go } from "../../lib/router";
import { Face } from "../../onboarding/fields";
import { trackLabel } from "../../onboarding/options";
import { CompletenessList } from "../../onboarding/shared";
import { scrollToSection, Tag } from "./kit";

/* Right column of the profile page: who you are at a glance, completeness, and the verification request. */

const date = (iso: string) => (iso ? new Date(iso).toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" }) : "");

export function LevelTag({ level }: { level: VerificationLevel }) {
  const { t } = useLang();
  if (level === "verified")
    return (
      <Tag tone="good">
        <BadgeCheck size={13} /> {t("common.status.verified")}
      </Tag>
    );
  if (level === "pending")
    return (
      <Tag tone="tint">
        <Clock size={13} /> {t("profile.verify.pendingTag")}
      </Tag>
    );
  return <Tag>{t("common.status.unverified")}</Tag>;
}

export function Summary({ user, check, sectionOf }: { user: TalentProfile | CompanyProfile; check: Completeness; sectionOf: Record<string, string> }) {
  const { t } = useLang();
  const talent = user.kind === "talent";
  const sub = talent ? user.headline || trackLabel(user.cat) : user.tagline || user.industry;
  const missing = check.items.filter((i) => !i.done).length;
  return (
    <section aria-label={t("profile.summary.label")} className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-4">
        <Face src={talent ? user.photo : user.logo} name={user.name} size={64} square={!talent} />
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold">{user.name || t("profile.summary.noName")}</p>
          {sub && <p className="line-clamp-2 text-[14px] text-mist">{sub}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <LevelTag level={user.verification.level} />
        {!talent && (
          <Tag tone={user.status === "approved" ? "good" : user.status === "rejected" ? "bad" : "line"}>{t(`profile.status.${user.status}`)}</Tag>
        )}
        {user.demo && <Tag tone="tint">{t("common.status.demo")}</Tag>}
      </div>
      {!talent && user.status !== "approved" && (
        <p className="mt-3 text-[13px] text-mist">{user.status === "rejected" ? t("profile.status.rejectedNote", { note: user.statusNote || "—" }) : t("profile.status.pendingNote")}</p>
      )}
      {talent ? (
        <button type="button" onClick={() => go(`#/app/talent/${user.id}`)} className={`${btn.ghost} mt-4 w-full`}>
          <Eye size={16} /> {t("profile.summary.preview")}
        </button>
      ) : (
        user.status === "approved" && (
          <button type="button" onClick={() => go(`#/company/${user.id}`)} className={`${btn.ghost} mt-4 w-full`}>
            <Eye size={16} /> {t("profile.summary.previewCompany")}
          </button>
        )
      )}
      <div className="mt-5 border-t border-line pt-5">
        <CompletenessList c={check} compact onItem={(k) => scrollToSection(sectionOf[k] ?? "about")} />
        {missing === 0 && <p className="mt-2 text-[14px] text-good">{t("profile.check.allDone")}</p>}
      </div>
    </section>
  );
}

const TALENT_PROOFS: VerificationProof[] = ["event", "university_email", "github", "admin"];
const COMPANY_PROOFS: VerificationProof[] = ["company_email", "admin"];

export function VerificationCard({ user, check, dirty }: { user: TalentProfile | CompanyProfile; check: Completeness; dirty: boolean }) {
  const { t } = useLang();
  const toast = useToast();
  const v = user.verification;
  const proofs = user.kind === "talent" ? TALENT_PROOFS : COMPANY_PROOFS;
  const [proof, setProof] = useState<VerificationProof>(proofs[0]);
  const [values, setValues] = useState<Record<string, string>>({ github: user.kind === "talent" ? user.github : "" });
  const req = useAction(api.users.requestVerification);
  const missing = check.items.filter((i) => i.required && !i.done).length;
  const domain = user.kind === "company" ? user.website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] : "";

  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await req.run(proof, (values[proof] ?? "").trim());
    if (r) toast(r.level === "verified" ? t("profile.verify.doneAuto") : t("profile.verify.sent"));
  }

  const needsValue = (p: VerificationProof) => p === "university_email" || p === "github" || p === "company_email";

  return (
    <section aria-labelledby="verify-h" className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="verify-h" className="flex items-center gap-2 text-[18px]">
          <ShieldCheck size={18} className="text-sky" /> {t("profile.verify.title")}
        </h2>
        <LevelTag level={v.level} />
      </div>

      {v.level === "verified" ? (
        <div className="mt-3 grid gap-1 text-[14px] text-mist">
          <p>{t("profile.verify.verifiedText")}</p>
          <p>
            {t("profile.verify.proof")}: <span className="text-ink">{t(`profile.proof.${v.proof || "admin"}`)}</span>
            {v.proofValue && <span className="break-all">, {v.proofValue}</span>}
          </p>
          {v.reviewedAt && <p>{t("profile.verify.since", { date: date(v.reviewedAt) })}</p>}
        </div>
      ) : v.level === "pending" ? (
        <div className="mt-3 grid gap-1 text-[14px] text-mist">
          <p>{t("profile.verify.pendingText", { date: date(v.requestedAt) })}</p>
          <p>
            {t("profile.verify.proof")}: <span className="text-ink">{t(`profile.proof.${v.proof || "admin"}`)}</span>
            {v.proofValue && <span className="break-all">, {v.proofValue}</span>}
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-4">
          <p className="text-[14px] text-mist">{t(`profile.verify.why.${user.kind}`)}</p>
          {v.note && (
            <p className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-[13px] text-[#ffb3b3]">{t("profile.verify.declined", { note: v.note })}</p>
          )}
          {!check.ready ? (
            <p className="rounded-lg bg-paper/50 px-3 py-2.5 text-[14px] text-mist">{t("profile.verify.notReady", { n: missing })}</p>
          ) : (
            <form onSubmit={submit} className="grid gap-3">
              <fieldset className="grid gap-1.5">
                <legend className="mb-1.5 text-[13px] font-medium text-mist">{t("profile.verify.choose")}</legend>
                {proofs.map((p) => (
                  <label key={p} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${proof === p ? "border-sky bg-tint" : "border-line hover:border-sky"}`}>
                    <input type="radio" name="proof" value={p} checked={proof === p} onChange={() => setProof(p)} className="mt-1 h-4 w-4 shrink-0 accent-[#3d7bfa]" />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-ink">{t(`profile.proof.${p}`)}</span>
                      <span className="block text-[13px] text-mist">{t(`profile.proof.${p}Text`)}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {needsValue(proof) ? (
                <label className="grid gap-1.5">
                  <span className="text-[13px] font-medium text-mist">{t(`profile.proof.${proof}Field`)}</span>
                  <Input
                    type={proof === "github" ? "text" : "email"}
                    required
                    value={values[proof] ?? ""}
                    onChange={(e) => setValues((s) => ({ ...s, [proof]: e.target.value }))}
                    placeholder={proof === "company_email" ? `you@${domain || "company.uz"}` : proof === "github" ? "github.com/username" : "name@university.uz"}
                  />
                </label>
              ) : proof === "admin" ? (
                <label className="grid gap-1.5">
                  <span className="text-[13px] font-medium text-mist">{t("profile.proof.adminField")}</span>
                  <Textarea rows={2} value={values.admin ?? ""} onChange={(e) => setValues((s) => ({ ...s, admin: e.target.value }))} maxLength={300} />
                </label>
              ) : null}
              <ErrorNote>{req.error}</ErrorNote>
              {dirty && <p className="text-[13px] text-mist">{t("profile.verify.saveFirst")}</p>}
              <button type="submit" disabled={req.pending || dirty} className={`${btn.secondary} w-full disabled:opacity-50`}>
                {req.pending && <Spinner />} {t("profile.verify.submit")}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
