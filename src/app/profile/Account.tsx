import { useState, type FormEvent } from "react";
import { LogOut } from "lucide-react";
import { api } from "../../api";
import { useAction } from "../../api/hooks";
import type { CompanyProfile, TalentProfile } from "../../api/types";
import { locale, useLang } from "../../i18n";
import { ErrorNote, Spinner } from "../../components/form";
import { btn, useToast } from "../../components/ui";
import { go } from "../../lib/router";
import { PasswordInput, StrengthHint } from "../../auth/parts";
import { Row, Section } from "./kit";
import { TelegramStatus } from "../parts/telegram";

/* Account: email and its state, password change, sign out. */

export function AccountCard({ user }: { user: TalentProfile | CompanyProfile }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const logout = useAction(async () => {
    await api.auth.logout();
    return true;
  });
  const type = user.kind === "talent" ? t("profile.account.talent") : user.orgKind === "organization" ? t("profile.account.organization") : t("profile.account.company");

  return (
    <Section id="account" title={t("profile.sec.account")}>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* sign-in is through Telegram or Google: show the email when the provider gave one, nothing to confirm */}
        {user.email && (
          <Row label={t("profile.account.email")}>
            <span className="break-all">{user.email}</span>
          </Row>
        )}
        <Row label={t("profile.account.type")}>{type}</Row>
        <div className="sm:col-span-2">
          <Row label="Telegram">
            <TelegramStatus />
          </Row>
        </div>
        <Row label={t("profile.account.since")}>{new Date(user.createdAt).toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" })}</Row>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        {open ? (
          <PasswordForm onDone={() => setOpen(false)} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={logout.pending}
              onClick={async () => {
                if (await logout.run()) go("#/");
              }}
              className={`${btn.ghost} disabled:opacity-60`}
            >
              {logout.pending ? <Spinner /> : <LogOut size={16} />} {t("common.nav.signOut")}
            </button>
          </div>
        )}
        <ErrorNote>{logout.error}</ErrorNote>
      </div>
    </Section>
  );
}

function PasswordForm({ onDone }: { onDone: () => void }) {
  const { t } = useLang();
  const toast = useToast();
  const [f, setF] = useState({ old: "", p1: "", p2: "" });
  const change = useAction(async (oldPassword: string, password: string) => {
    await api.auth.changePassword(oldPassword, password);
    return true;
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (f.p1 !== f.p2) {
      change.setError(t("auth.reset.mismatch"));
      return;
    }
    if (await change.run(f.old, f.p1)) {
      toast(t("profile.account.passwordChanged"));
      onDone();
    }
  }

  return (
    <form onSubmit={submit} className="grid max-w-[420px] gap-4">
      <h3 className="text-[16px]">{t("profile.account.changePassword")}</h3>
      <div className="grid gap-1.5">
        <label htmlFor="pw-old" className="text-[13px] font-medium text-mist">
          {t("profile.account.current")}
        </label>
        <PasswordInput id="pw-old" required autoComplete="current-password" value={f.old} onChange={(e) => setF((s) => ({ ...s, old: e.target.value }))} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="pw-new" className="text-[13px] font-medium text-mist">
          {t("auth.reset.new")}
        </label>
        <PasswordInput id="pw-new" required minLength={8} autoComplete="new-password" value={f.p1} onChange={(e) => setF((s) => ({ ...s, p1: e.target.value }))} />
        <StrengthHint password={f.p1} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="pw-new2" className="text-[13px] font-medium text-mist">
          {t("auth.reset.repeat")}
        </label>
        <PasswordInput id="pw-new2" required minLength={8} autoComplete="new-password" value={f.p2} onChange={(e) => setF((s) => ({ ...s, p2: e.target.value }))} />
      </div>
      <ErrorNote>{change.error}</ErrorNote>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={change.pending} className={`${btn.secondary} disabled:opacity-60`}>
          {change.pending && <Spinner />} {t("profile.account.updatePassword")}
        </button>
        <button type="button" onClick={onDone} className={btn.ghost}>
          {t("common.action.cancel")}
        </button>
      </div>
    </form>
  );
}
