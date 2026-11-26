import { useState, type ReactNode } from "react";
import { ArrowLeft, Building2, GraduationCap } from "lucide-react";
import type { OrgKind } from "../api/types";
import { startSocialSignIn, type PendingSignUp, type SocialProvider } from "../api/social";
import { useLang } from "../i18n";
import { ErrorNote, Field, Input, Select, Spinner } from "../components/form";
import { go } from "../lib/router";
import { CitySelect, Segmented } from "../onboarding/fields";
import { TRACKS, trackLabel } from "../onboarding/options";
import { AuthLayout, Consent } from "./parts";

/* #/login and #/register. There are no passwords: people sign in with Telegram or Google.
   Sign-up stays short: account type, a few fields and consent, then the provider. The choices
   are applied when the person comes back (src/api/social.ts), and App sends new accounts to
   onboarding (#/onboarding). */

type Mode = "login" | "register";
type AccountType = "talent" | "company";

export function AuthScreen({ mode, initialType, next }: { mode: Mode; initialType?: AccountType; next?: string }) {
  useLang();
  return <AuthLayout>{mode === "login" ? <LoginForm next={next} /> : <RegisterFlow type={initialType} />}</AuthLayout>;
}

function Heading({ title, text, step }: { title: string; text?: ReactNode; step?: string }) {
  return (
    <div className="mb-7">
      {step && <p className="mb-2 text-[13px] font-medium text-sky">{step}</p>}
      <h1 className="text-[28px] sm:text-[32px]">{title}</h1>
      {text && <p className="mt-2 text-[15px] text-mist">{text}</p>}
    </div>
  );
}

const linkCls = "hit font-semibold text-sky underline-offset-4 hover:text-ink hover:underline";

/* ---------- the two sign-in buttons ---------- */

function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path fill="#fff" d="M5.4 11.8 16.9 7.3c.5-.2 1 .1.8.9l-2 9.3c-.1.6-.5.8-1 .5l-2.9-2.1-1.4 1.3c-.2.2-.3.3-.6.3l.2-3 5.4-4.9c.2-.2 0-.3-.3-.1l-6.7 4.2-2.9-.9c-.6-.2-.6-.6.1-.9Z" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.2-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.8V6.5H1.4a12 12 0 0 0 0 10.9l4-3Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

/**
 * Telegram and Google buttons. `check` runs before leaving (form checks on sign-up) and returns
 * an error to show, or the sign-up data to remember.
 */
function SocialButtons({ next, check }: { next: string; check?: () => { error: string } | { signUp: PendingSignUp } }) {
  const { t } = useLang();
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(provider: SocialProvider) {
    setError(null);
    let signUp: PendingSignUp | null = null;
    if (check) {
      const r = check();
      if ("error" in r) return setError(r.error);
      signUp = r.signUp;
    }
    setBusy(provider);
    const err = await startSocialSignIn(provider, next, signUp);
    // on success the browser is already leaving for the provider
    if (err) {
      setBusy(null);
      setError(t("auth.social.unavailable"));
    }
  }

  const cls =
    "flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border px-5 text-[15px] font-semibold transition-colors disabled:opacity-70";
  return (
    <div className="grid gap-3">
      <button type="button" disabled={!!busy} onClick={() => go("telegram")} className={`${cls} border-[#2AABEE]/40 bg-[#2AABEE]/10 text-ink hover:bg-[#2AABEE]/20`}>
        {busy === "telegram" ? <Spinner /> : <TelegramMark />} {t("auth.social.telegram")}
      </button>
      <button type="button" disabled={!!busy} onClick={() => go("google")} className={`${cls} border-line bg-white text-[#1f1f1f] hover:bg-white/90`}>
        {busy === "google" ? <Spinner /> : <GoogleMark />} {t("auth.social.google")}
      </button>
      <ErrorNote>{error}</ErrorNote>
      <p className="text-[13px] text-mist">{t("auth.social.note")}</p>
    </div>
  );
}

/* ---------- sign in ---------- */

function LoginForm({ next }: { next?: string }) {
  const { t } = useLang();
  const back = next && next.startsWith("#/") ? `#/login?next=${encodeURIComponent(next)}` : "#/login";
  return (
    <>
      <Heading title={t("auth.login.title")} text={t("auth.login.text")} />
      <SocialButtons next={back} />
      <p className="mt-6 text-[14px] text-mist">
        {t("auth.login.new")}{" "}
        <a href="#/register" className={linkCls}>
          {t("auth.login.create")}
        </a>
      </p>
    </>
  );
}

/* ---------- sign up ---------- */

function RegisterFlow({ type }: { type?: AccountType }) {
  const { t } = useLang();
  if (!type) {
    return (
      <>
        <Heading step={t("auth.register.step", { n: 1 })} title={t("auth.register.title")} text={t("auth.register.pickText")} />
        <div className="grid gap-3">
          <TypeCard icon={<GraduationCap size={22} />} title={t("auth.type.talent")} text={t("auth.type.talentText")} onClick={() => go("#/register?type=talent")} />
          <TypeCard icon={<Building2 size={22} />} title={t("auth.type.company")} text={t("auth.type.companyText")} onClick={() => go("#/register?type=company")} />
        </div>
        <p className="mt-6 text-[14px] text-mist">
          {t("auth.register.have")}{" "}
          <a href="#/login" className={linkCls}>
            {t("auth.register.signIn")}
          </a>
        </p>
      </>
    );
  }
  return (
    <>
      <button type="button" onClick={() => go("#/register")} className="-ml-1 mb-4 inline-flex min-h-11 items-center gap-1.5 px-1 text-[14px] font-semibold text-mist hover:text-ink">
        <ArrowLeft size={16} /> {t("auth.register.changeType")}
      </button>
      <Heading
        step={t("auth.register.step", { n: 2 })}
        title={type === "talent" ? t("auth.register.talentTitle") : t("auth.register.companyTitle")}
        text={type === "talent" ? t("auth.register.talentText") : t("auth.register.companyText")}
      />
      {type === "talent" ? <TalentForm /> : <CompanyForm />}
    </>
  );
}

function TypeCard({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-4 rounded-xl border border-line bg-surface p-5 text-left transition-colors hover:border-sky hover:bg-[#1a3a7d]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue text-white">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[17px] font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-[14px] leading-relaxed text-mist">{text}</span>
      </span>
    </button>
  );
}

function TalentForm() {
  const { t } = useLang();
  const [f, setF] = useState({ name: "", cat: TRACKS[0], city: "", consent: false });
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const check = () => {
    if (!f.name.trim()) return { error: t("api.noName") };
    if (!f.city.trim()) return { error: t("api.noCity") };
    if (!f.consent) return { error: t("api.noConsent") };
    return { signUp: { type: "talent", name: f.name.trim(), cat: f.cat, city: f.city, consent: true } as PendingSignUp };
  };

  return (
    <div className="grid gap-4">
      <Field label={t("auth.field.fullName")}>
        <Input required autoComplete="name" value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder={t("auth.field.fullNamePh")} maxLength={80} />
      </Field>
      <Field label={t("auth.field.track")} hint={t("auth.field.trackHint")}>
        <Select value={f.cat} onChange={(e) => set("cat")(e.target.value)} options={TRACKS.map((c) => ({ value: c, label: trackLabel(c) }))} />
      </Field>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-medium text-mist">{t("auth.field.city")}</span>
        <CitySelect value={f.city} onChange={set("city")} />
      </div>
      <Consent checked={f.consent} onChange={set("consent")} />
      <p className="mt-1 text-[14px] font-semibold">{t("auth.social.finish")}</p>
      <SocialButtons next="#/onboarding" check={check} />
    </div>
  );
}

function CompanyForm() {
  const { t } = useLang();
  const [f, setF] = useState({ name: "", orgKind: "company" as OrgKind, city: "", consent: false });
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const check = () => {
    if (!f.name.trim()) return { error: t("api.noOrgName") };
    if (!f.city.trim()) return { error: t("api.noCity") };
    if (!f.consent) return { error: t("api.noConsent") };
    return { signUp: { type: "company", name: f.name.trim(), orgKind: f.orgKind, city: f.city, consent: true } as PendingSignUp };
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <span className="text-[13px] font-medium text-mist">{t("auth.field.orgKind")}</span>
        <Segmented
          label={t("auth.field.orgKind")}
          value={f.orgKind}
          onChange={set("orgKind")}
          options={[
            { value: "company", label: t("auth.org.company") },
            { value: "organization", label: t("auth.org.organization") },
          ]}
        />
        <span className="text-[12px] text-mist">{f.orgKind === "company" ? t("auth.org.companyHint") : t("auth.org.organizationHint")}</span>
      </div>
      <Field label={f.orgKind === "company" ? t("auth.field.companyName") : t("auth.field.orgName")}>
        <Input required autoComplete="organization" value={f.name} onChange={(e) => set("name")(e.target.value)} maxLength={80} />
      </Field>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-medium text-mist">{t("auth.field.city")}</span>
        <CitySelect value={f.city} onChange={set("city")} />
      </div>
      <Consent checked={f.consent} onChange={set("consent")} />
      <p className="mt-1 text-[14px] font-semibold">{t("auth.social.finish")}</p>
      <SocialButtons next="#/onboarding" check={check} />
      <p className="text-[13px] text-mist">{t("auth.register.reviewNote")}</p>
    </div>
  );
}
