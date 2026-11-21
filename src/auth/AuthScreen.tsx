import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Building2, GraduationCap } from "lucide-react";
import { api } from "../api";
import { useAction } from "../api/hooks";
import type { OrgKind } from "../api/types";
import { useLang } from "../i18n";
import { ErrorNote, Field, Input, Select, Spinner } from "../components/form";
import { btn } from "../components/ui";
import { go } from "../lib/router";
import { CitySelect, Segmented } from "../onboarding/fields";
import { TRACKS, trackLabel } from "../onboarding/options";
import { AuthLayout, Consent, PasswordInput, StrengthHint } from "./parts";

/* #/login and #/register. Sign-up is short on purpose: account type, then a few fields.
   Everything else is asked in onboarding (#/onboarding), where App sends new accounts. */

type Mode = "login" | "register";
type AccountType = "talent" | "company";

export function AuthScreen({ mode, initialType }: { mode: Mode; initialType?: AccountType }) {
  useLang();
  return <AuthLayout>{mode === "login" ? <LoginForm /> : <RegisterFlow type={initialType} />}</AuthLayout>;
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

const linkCls = "font-semibold text-sky underline-offset-4 hover:text-ink hover:underline";

/* ---------- sign in ---------- */

function LoginForm() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAction(api.auth.login);

  function submit(e: FormEvent) {
    e.preventDefault();
    login.run(email.trim(), password);
  }

  return (
    <>
      <Heading title={t("auth.login.title")} text={t("auth.login.text")} />
      <form onSubmit={submit} className="grid gap-4" noValidate={false}>
        <Field label={t("auth.field.email")}>
          <Input type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.uz" />
        </Field>
        <div className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="login-password" className="text-[13px] font-medium text-mist">
              {t("auth.field.password")}
            </label>
            <a href="#/forgot" className={`text-[13px] ${linkCls}`}>
              {t("auth.login.forgot")}
            </a>
          </div>
          <PasswordInput id="login-password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <ErrorNote>{login.error}</ErrorNote>
        <button type="submit" disabled={login.pending} className={`${btn.primary} mt-1 w-full disabled:opacity-70`}>
          {login.pending && <Spinner />} {t("auth.login.submit")}
        </button>
      </form>
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

function Credentials({ email, setEmail, password, setPassword }: { email: string; setEmail: (v: string) => void; password: string; setPassword: (v: string) => void }) {
  const { t } = useLang();
  return (
    <>
      <Field label={t("auth.field.email")}>
        <Input type="email" inputMode="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.uz" />
      </Field>
      <div className="grid gap-1.5">
        <label htmlFor="reg-password" className="text-[13px] font-medium text-mist">
          {t("auth.field.password")}
        </label>
        <PasswordInput id="reg-password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <StrengthHint password={password} />
      </div>
    </>
  );
}

function TalentForm() {
  const { t } = useLang();
  const [f, setF] = useState({ email: "", password: "", name: "", cat: TRACKS[0], city: "", consent: false });
  const reg = useAction(api.auth.register);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    reg.run({ type: "talent", email: f.email, password: f.password, name: f.name, cat: f.cat, city: f.city, consent: f.consent });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label={t("auth.field.fullName")}>
        <Input required autoComplete="name" value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder={t("auth.field.fullNamePh")} maxLength={80} />
      </Field>
      <Credentials email={f.email} setEmail={set("email")} password={f.password} setPassword={set("password")} />
      <Field label={t("auth.field.track")} hint={t("auth.field.trackHint")}>
        <Select value={f.cat} onChange={(e) => set("cat")(e.target.value)} options={TRACKS.map((c) => ({ value: c, label: trackLabel(c) }))} />
      </Field>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-medium text-mist">{t("auth.field.city")}</span>
        <CitySelect value={f.city} onChange={set("city")} />
      </div>
      <Consent checked={f.consent} onChange={set("consent")} />
      <ErrorNote>{reg.error}</ErrorNote>
      <button type="submit" disabled={reg.pending} className={`${btn.primary} w-full disabled:opacity-70`}>
        {reg.pending && <Spinner />} {t("auth.register.submit")}
      </button>
    </form>
  );
}

function CompanyForm() {
  const { t } = useLang();
  const [f, setF] = useState({ email: "", password: "", name: "", orgKind: "company" as OrgKind, city: "", consent: false });
  const reg = useAction(api.auth.register);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    reg.run({ type: "company", email: f.email, password: f.password, name: f.name, orgKind: f.orgKind, city: f.city, consent: f.consent });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
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
      <Credentials email={f.email} setEmail={set("email")} password={f.password} setPassword={set("password")} />
      <div className="grid gap-1.5">
        <span className="text-[13px] font-medium text-mist">{t("auth.field.city")}</span>
        <CitySelect value={f.city} onChange={set("city")} />
      </div>
      <Consent checked={f.consent} onChange={set("consent")} />
      <ErrorNote>{reg.error}</ErrorNote>
      <button type="submit" disabled={reg.pending} className={`${btn.primary} w-full disabled:opacity-70`}>
        {reg.pending && <Spinner />} {t("auth.register.submitCompany")}
      </button>
      <p className="text-[13px] text-mist">{t("auth.register.reviewNote")}</p>
    </form>
  );
}
