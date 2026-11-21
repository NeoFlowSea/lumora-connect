import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, MailCheck, TriangleAlert } from "lucide-react";
import { api } from "../api";
import { useAction, useSession } from "../api/hooks";
import { useLang } from "../i18n";
import { ErrorNote, Field, Input, Loading, Spinner } from "../components/form";
import { btn } from "../components/ui";
import { go } from "../lib/router";
import { AuthLayout, PasswordInput, PreviewMailbox, StrengthHint } from "./parts";

/* Forgot password (#/forgot), new password from the emailed link (#/reset?token=),
   and email confirmation (#/confirm?token=). */

const linkCls = "font-semibold text-sky underline-offset-4 hover:text-ink hover:underline";

function Notice({ tone, title, children }: { tone: "good" | "bad" | "info"; title: string; children?: ReactNode }) {
  const Icon = tone === "good" ? CheckCircle2 : tone === "bad" ? TriangleAlert : MailCheck;
  const color = tone === "good" ? "text-good" : tone === "bad" ? "text-[#ffb3b3]" : "text-sky";
  return (
    <div className="rounded-xl border border-line bg-surface p-5" role={tone === "bad" ? "alert" : "status"}>
      <div className="flex items-start gap-3">
        <Icon size={22} className={`mt-0.5 shrink-0 ${color}`} />
        <div className="min-w-0">
          <h2 className="text-[18px]">{title}</h2>
          {children && <div className="mt-1.5 text-[14px] text-mist">{children}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- forgot ---------- */

export function ForgotScreen() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const send = useAction(async (e: string) => {
    await api.auth.requestReset(e);
    return true;
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (await send.run(v)) setSentTo(v);
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <h1 className="text-[28px] sm:text-[32px]">{t("auth.forgot.title")}</h1>
        <p className="mt-2 text-[15px] text-mist">{t("auth.forgot.text")}</p>
      </div>
      {sentTo ? (
        <div className="grid gap-4">
          <Notice tone="info" title={t("auth.forgot.sentTitle")}>
            {t("auth.forgot.sent", { email: sentTo })}
          </Notice>
          <PreviewMailbox email={sentTo} />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setSentTo(null)} className={btn.ghost}>
              {t("auth.forgot.again")}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <Field label={t("auth.field.email")}>
            <Input type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.uz" />
          </Field>
          <ErrorNote>{send.error}</ErrorNote>
          <button type="submit" disabled={send.pending} className={`${btn.primary} w-full disabled:opacity-70`}>
            {send.pending && <Spinner />} {t("auth.forgot.submit")}
          </button>
        </form>
      )}
      <p className="mt-6 text-[14px] text-mist">
        {t("auth.forgot.remember")}{" "}
        <a href="#/login" className={linkCls}>
          {t("auth.register.signIn")}
        </a>
      </p>
    </AuthLayout>
  );
}

/* ---------- reset ---------- */

export function ResetScreen({ token }: { token: string }) {
  const { t } = useLang();
  const [done, setDone] = useState(false);
  // checked once: after a successful reset the token is gone, which must not flip the screen to "expired"
  const [valid, setValid] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    setValid(null);
    if (!token) setValid(false);
    else api.auth.checkToken(token, "reset").then((ok) => alive && setValid(ok));
    return () => {
      alive = false;
    };
  }, [token]);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const reset = useAction(async () => {
    await api.auth.resetPassword(token, p1);
    return true;
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (p1 !== p2) {
      reset.setError(t("auth.reset.mismatch"));
      return;
    }
    if (await reset.run()) setDone(true);
  }

  return (
    <AuthLayout>
      <div className="mb-7">
        <h1 className="text-[28px] sm:text-[32px]">{t("auth.reset.title")}</h1>
        {!done && valid && <p className="mt-2 text-[15px] text-mist">{t("auth.reset.text")}</p>}
      </div>
      {done ? (
        <div className="grid gap-4">
          <Notice tone="good" title={t("auth.reset.doneTitle")}>
            {t("auth.reset.done")}
          </Notice>
          <button type="button" onClick={() => go("#/login")} className={`${btn.primary} w-full`}>
            {t("auth.login.submit")}
          </button>
        </div>
      ) : valid === null ? (
        <Loading />
      ) : !valid ? (
        <div className="grid gap-4">
          <Notice tone="bad" title={t("auth.link.expiredTitle")}>
            {t("auth.reset.expired")}
          </Notice>
          <button type="button" onClick={() => go("#/forgot")} className={`${btn.primary} w-full`}>
            {t("auth.reset.newLink")}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="reset-p1" className="text-[13px] font-medium text-mist">
              {t("auth.reset.new")}
            </label>
            <PasswordInput id="reset-p1" required minLength={8} autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} />
            <StrengthHint password={p1} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="reset-p2" className="text-[13px] font-medium text-mist">
              {t("auth.reset.repeat")}
            </label>
            <PasswordInput id="reset-p2" required minLength={8} autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} />
          </div>
          <ErrorNote>{reset.error}</ErrorNote>
          <button type="submit" disabled={reset.pending} className={`${btn.primary} w-full disabled:opacity-70`}>
            {reset.pending && <Spinner />} {t("auth.reset.submit")}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

/* ---------- confirm email ---------- */

// one request per token, so React's double effects in development cannot use the token twice
const confirming = new Map<string, Promise<boolean>>();
function confirmOnce(token: string): Promise<boolean> {
  if (!confirming.has(token))
    confirming.set(
      token,
      api.auth.confirmEmail(token).then(
        () => true,
        () => false,
      ),
    );
  return confirming.get(token)!;
}

export function ConfirmScreen({ token }: { token: string }) {
  const { t } = useLang();
  const user = useSession();
  const [state, setState] = useState<"pending" | "ok" | "bad">("pending");
  useEffect(() => {
    let alive = true;
    if (!token) {
      setState("bad");
      return;
    }
    confirmOnce(token).then((ok) => alive && setState(ok ? "ok" : "bad"));
    return () => {
      alive = false;
    };
  }, [token]);
  const resend = useAction(async () => {
    await api.auth.resendConfirm();
    return true;
  });
  const [resent, setResent] = useState(false);

  const signedIn = user && user.kind !== "admin" ? user : null;
  // an already confirmed account opening an old link is still a success
  const ok = state === "ok" || (state === "bad" && !!signedIn?.emailConfirmed);
  const next = signedIn ? (signedIn.onboarded ? "#/app/profile" : "#/onboarding") : "#/login";

  return (
    <AuthLayout>
      <h1 className="mb-7 text-[28px] sm:text-[32px]">{t("auth.confirm.title")}</h1>
      {state === "pending" ? (
        <Loading label={t("auth.confirm.checking")} />
      ) : ok ? (
        <div className="grid gap-4">
          <Notice tone="good" title={t("auth.confirm.okTitle")}>
            {t("auth.confirm.ok")}
          </Notice>
          <button type="button" onClick={() => go(next)} className={`${btn.primary} w-full`}>
            {signedIn ? t("auth.confirm.continue") : t("auth.login.submit")}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          <Notice tone="bad" title={t("auth.link.expiredTitle")}>
            {signedIn ? t("auth.confirm.expiredSignedIn") : t("auth.confirm.expired")}
          </Notice>
          {signedIn ? (
            <>
              <button
                type="button"
                disabled={resend.pending}
                onClick={async () => {
                  if (await resend.run()) setResent(true);
                }}
                className={`${btn.primary} w-full disabled:opacity-70`}
              >
                {resend.pending && <Spinner />} {resent ? t("auth.confirm.resent") : t("auth.confirm.resend")}
              </button>
              <ErrorNote>{resend.error}</ErrorNote>
              {resent && <PreviewMailbox />}
            </>
          ) : (
            <button type="button" onClick={() => go("#/login")} className={`${btn.primary} w-full`}>
              {t("auth.login.submit")}
            </button>
          )}
        </div>
      )}
    </AuthLayout>
  );
}
