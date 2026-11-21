import { useState } from "react";
import { Check, Circle, MailWarning, ShieldCheck, UserRound } from "lucide-react";
import { api } from "../api";
import type { Completeness } from "../api";
import { useAction } from "../api/hooks";
import type { CompanyProfile, TalentProfile } from "../api/types";
import { useLang } from "../i18n";
import { ErrorNote, Spinner } from "../components/form";
import { PreviewMailbox } from "../auth/parts";
import { Meter } from "./fields";

/* Pieces shared by onboarding and the profile page. */

/** percent, meter and the checklist. `onItem` turns each item into a button (used to jump to a profile section). */
export function CompletenessList({ c, onItem, compact = false }: { c: Completeness; onItem?: (key: string) => void; compact?: boolean }) {
  const { t } = useLang();
  const items = compact ? c.items.filter((i) => !i.done) : c.items;
  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] text-mist">{t("profile.check.title")}</span>
        <span className="text-[22px] font-semibold tabular-nums text-accent">{c.percent}%</span>
      </div>
      <Meter percent={c.percent} label={t("profile.check.title")} />
      {items.length > 0 && (
        <ul className="mt-1 grid gap-0.5">
          {items.map((i) => {
            const body = (
              <>
                {i.done ? <Check size={16} className="shrink-0 text-good" /> : <Circle size={16} className="shrink-0 text-mist" />}
                <span className={`min-w-0 flex-1 ${i.done ? "text-mist line-through decoration-line" : "text-ink"}`}>{t(`profile.check.${i.key}`)}</span>
                {!i.done && <span className="shrink-0 text-[12px] text-mist">{i.required ? t("profile.check.required") : t("profile.check.optional")}</span>}
              </>
            );
            return (
              <li key={i.key}>
                {onItem && !i.done ? (
                  <button type="button" onClick={() => onItem(i.key)} className="flex min-h-10 w-full items-center gap-2.5 rounded-md px-1 text-left text-[14px] hover:bg-tint">
                    {body}
                  </button>
                ) : (
                  <div className="flex min-h-9 items-center gap-2.5 px-1 text-[14px]">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** the two account levels explained side by side */
export function Levels({ user }: { user: TalentProfile | CompanyProfile }) {
  const { t } = useLang();
  const k = user.kind;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center gap-2 text-[15px] font-semibold">
          <UserRound size={17} className="text-sky" /> {t("profile.levels.unverified")}
        </div>
        <p className="mt-1.5 text-[14px] text-mist">{t(`profile.levels.unverifiedText.${k}`)}</p>
      </div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center gap-2 text-[15px] font-semibold">
          <ShieldCheck size={17} className="text-sky" /> {t("profile.levels.verified")}
        </div>
        <p className="mt-1.5 text-[14px] text-mist">{t(`profile.levels.verifiedText.${k}`)}</p>
      </div>
    </div>
  );
}

/** shown while the email is not confirmed: resend the link and open the preview mailbox */
export function EmailBanner({ user }: { user: TalentProfile | CompanyProfile }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const resend = useAction(async () => {
    await api.auth.resendConfirm();
    return true;
  });
  if (user.emailConfirmed) return null;
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <MailWarning size={20} className="mt-0.5 shrink-0 text-sky" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink">{t("profile.email.title")}</p>
          <p className="mt-0.5 break-words text-[14px] text-mist">{t("profile.email.text", { email: user.email })}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={resend.pending}
              onClick={async () => {
                if (await resend.run()) {
                  setSent(true);
                  setOpen(true);
                }
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-[14px] font-semibold hover:border-sky hover:bg-tint disabled:opacity-60"
            >
              {resend.pending && <Spinner />} {sent ? t("profile.email.resent") : t("profile.email.resend")}
            </button>
            <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex min-h-11 items-center px-3 text-[14px] font-semibold text-sky hover:text-ink">
              {open ? t("profile.email.hideMailbox") : t("profile.email.mailbox")}
            </button>
          </div>
          <ErrorNote>{resend.error}</ErrorNote>
          {open && (
            <div className="mt-3">
              <PreviewMailbox email={user.email} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
