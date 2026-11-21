import { Fragment, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { ExternalLink, Eye, EyeOff, Inbox } from "lucide-react";
import { api } from "../api";
import { useApi } from "../api/hooks";
import { locale, useLang } from "../i18n";
import { Wordmark } from "../components/Logo";
import { LangSwitch } from "../components/LangSwitch";
import { Input, ago } from "../components/form";
import { lumora, photo } from "../content/lumora";

/* Shared pieces of the sign-in, sign-up and recovery screens. */

/** page frame: header with logo and language, the form column, and a calm side panel on wide screens */
export function AuthLayout({ children, side = true }: { children: ReactNode; side?: boolean }) {
  const { t } = useLang();
  return (
    <div className={`min-h-[100svh] bg-paper ${side ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,580px)]" : ""}`}>
      <div className="flex min-h-[100svh] min-w-0 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
          <a href="#/" aria-label={t("common.nav.home")} className="min-w-0">
            <Wordmark size={28} />
          </a>
          <div className="flex shrink-0 items-center gap-3">
            <a href="#/" className="hidden text-[14px] font-medium text-mist hover:text-ink sm:inline">
              {t("common.nav.backToSite")}
            </a>
            <LangSwitch />
          </div>
        </header>
        <main className="flex flex-1 justify-center px-4 pb-12 pt-6 sm:px-8 md:pt-12">
          <div className="w-full min-w-0 max-w-[460px]">{children}</div>
        </main>
        <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 pb-6 text-[12px] text-mist sm:px-8">
          <a href="#/terms" className="hover:text-ink">
            {t("common.footer.terms")}
          </a>
          <a href="#/privacy" className="hover:text-ink">
            {t("common.footer.privacy")}
          </a>
          <span>{t("common.footer.preview")}</span>
        </footer>
      </div>
      {side && <SidePanel />}
    </div>
  );
}

function SidePanel() {
  const { t, lang } = useLang();
  const n = lumora.numbers;
  const facts = [
    { v: n.hackathons, k: "hackathons" },
    { v: n.students, k: "students" },
    { v: n.regions, k: "regions" },
    { v: n.partners, k: "partners" },
  ];
  return (
    <aside className="sticky top-0 hidden h-[100svh] flex-col border-l border-line bg-surface lg:flex">
      <figure className="relative m-0 min-h-0 flex-1 overflow-hidden">
        <img src={photo("school21-group", 800)} alt={lumora.photos["school21-group"]} className="h-full w-full object-cover" />
        <figcaption className="absolute bottom-0 left-0 right-0 bg-[#0b1d46]/85 px-8 py-3 text-[12px] text-mist">{t("auth.side.caption")}</figcaption>
      </figure>
      <div className="px-8 py-8 xl:px-10">
        <p className="max-w-[34ch] text-[20px] font-semibold leading-snug text-ink">{lumora.slogans.postcode[lang]}</p>
        <p className="mt-2 max-w-[46ch] text-[14px] text-mist">{t("auth.side.text")}</p>
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6">
          {facts.map((f) => (
            <div key={f.k}>
              <dt className="sr-only">{t(`auth.side.${f.k}`)}</dt>
              <dd className="m-0 text-[26px] font-semibold tabular-nums leading-none text-ink">{f.v.toLocaleString(locale())}+</dd>
              <dd className="m-0 mt-1 text-[13px] text-mist" aria-hidden>
                {t(`auth.side.${f.k}`)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}

/** password field with a show / hide button */
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? t("auth.password.hide") : t("auth.password.show")}
        aria-pressed={show}
        className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-lg text-mist hover:text-ink"
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

/** 0 empty, 1 too short, 2 okay, 3 strong */
export function strength(p: string): 0 | 1 | 2 | 3 {
  if (!p) return 0;
  if (p.length < 8) return 1;
  let score = 0;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (p.length >= 12) score++;
  return score >= 2 ? 3 : 2;
}

export function StrengthHint({ password }: { password: string }) {
  const { t } = useLang();
  const s = strength(password);
  const label = [t("auth.password.rule"), t("auth.password.short"), t("auth.password.okay"), t("auth.password.strong")][s];
  const color = s === 1 ? "bg-bad" : s === 2 ? "bg-sky" : "bg-good";
  return (
    <div className="grid gap-1.5" aria-live="polite">
      <div className="grid grid-cols-3 gap-1" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1 rounded-full ${s >= i ? color : "bg-line"}`} />
        ))}
      </div>
      <span className="text-[12px] text-mist">{label}</span>
    </div>
  );
}

/** fill "{name}" placeholders in a translated string with React nodes */
export function rich(text: string, parts: Record<string, ReactNode>): ReactNode {
  const out: ReactNode[] = [];
  text.split(/(\{\w+\})/).forEach((chunk, i) => {
    const m = /^\{(\w+)\}$/.exec(chunk);
    out.push(<Fragment key={i}>{m && m[1] in parts ? parts[m[1]] : chunk}</Fragment>);
  });
  return out;
}

/** the required consent checkbox with links to the terms and privacy pages (new tab, so the form keeps its data) */
export function Consent({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { t } = useLang();
  const link = (href: string, label: string) => (
    <a href={href} target="_blank" rel="noopener" className="font-medium text-sky underline underline-offset-2 hover:text-ink">
      {label}
    </a>
  );
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-mist">
      <input type="checkbox" required checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#3d7bfa]" />
      <span>{rich(t("auth.consent"), { terms: link("#/terms", t("auth.consentTerms")), privacy: link("#/privacy", t("auth.consentPrivacy")) })}</span>
    </label>
  );
}

/**
 * The preview has no mail server: emails it would send land in db.outbox.
 * This panel shows them so testers can click the confirmation or reset link.
 */
export function PreviewMailbox({ email, limit = 3 }: { email?: string; limit?: number }) {
  const { t } = useLang();
  const mail = useApi(() => api.auth.outbox(email), [email]);
  const list = (mail.data ?? []).slice(0, limit);
  return (
    <section aria-label={t("auth.mailbox.title")} className="rounded-xl border border-dashed border-line bg-paper/40 p-4">
      <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
        <Inbox size={16} className="text-sky" /> {t("auth.mailbox.title")}
      </div>
      <p className="mt-1 text-[12px] text-mist">{t("auth.mailbox.text")}</p>
      {mail.loading ? null : list.length === 0 ? (
        <p className="mt-3 text-[13px] text-mist">{t("auth.mailbox.empty")}</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {list.map((m) => (
            <li key={m.id} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="min-w-0 break-words text-[14px] font-semibold">{m.subject}</span>
                <span className="shrink-0 text-[12px] text-mist">{ago(m.at)}</span>
              </div>
              <div className="mt-0.5 break-all text-[12px] text-mist">{t("auth.mailbox.to", { email: m.to })}</div>
              <p className="mt-2 text-[13px] text-mist">{m.body}</p>
              {m.link && (
                <a href={m.link} className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-blue px-3 text-[13px] font-semibold text-white hover:bg-blue-deep">
                  <ExternalLink size={14} /> {t("auth.mailbox.open")}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
