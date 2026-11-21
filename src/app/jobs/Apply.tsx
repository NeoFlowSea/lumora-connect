import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Ban, Check, FileText, Pencil, Share2, Users } from "lucide-react";
import { api, type OpportunityDetail } from "../../api";
import { useAction, useSession } from "../../api/hooks";
import type { TalentProfile } from "../../api/types";
import { ErrorNote, Field, Spinner, Textarea, Toggle, ago } from "../../components/form";
import { Modal, btn, useToast } from "../../components/ui";
import { useLang } from "../../i18n";
import { openApp } from "../../pages/PublicFrame";
import { AppStatusPill } from "../parts/common";
import { openState, salaryText, share } from "./format";

/* The apply area of a posting. "panel" sits in the right column on desktop,
   "bar" is the compact bottom bar on phones. Both read the same state. */
export function ApplyBox({ o, variant = "panel" }: { o: OpportunityDetail; variant?: "panel" | "bar" }) {
  const { t } = useLang();
  const user = useSession();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const withdraw = useAction(async (id: string) => {
    await api.opportunities.withdraw(id);
    return true;
  });
  const state = openState(o);
  const isEvent = o.type === "Event";
  const verb = isEvent ? t("jobs.apply.register") : t("common.action.apply");
  const own = user?.kind === "company" && user.id === o.companyId;
  const app = o.myApplication;
  const bar = variant === "bar";

  async function doShare() {
    const r = await share(`#/jobs/${o.id}`, o.title);
    if (r === "copied") toast(t("common.action.linkCopied"));
    else if (r === "failed") toast(t("common.state.error"));
  }

  async function doWithdraw() {
    if (!app) return;
    const ok = await withdraw.run(app.id);
    if (ok) {
      setWithdrawing(false);
      toast(t("jobs.apply.withdrawn"));
    }
  }

  const reason =
    state === "closed" ? t("jobs.apply.closedReason") : state === "expired" ? t("jobs.apply.expiredReason") : state === "hidden" ? t("jobs.apply.hiddenReason") : "";

  let main;
  if (own) {
    main = (
      <div className={bar ? "flex min-w-0 flex-1 items-center gap-2" : "grid gap-3"}>
        {!bar && (
          <p className="flex items-center gap-2 text-[14px] text-mist">
            <Users size={15} /> {t("jobs.apply.yourPosting", { n: o.applicants })}
          </p>
        )}
        <a href={`#/app/dashboard?edit=${o.id}`} className={`${btn.secondary} ${bar ? "flex-1" : "w-full"}`}>
          <Pencil size={15} /> {t("jobs.apply.editPosting")}
        </a>
      </div>
    );
  } else if (user && user.kind !== "talent") {
    main = <p className={`text-[13px] text-mist ${bar ? "min-w-0 flex-1" : ""}`}>{t("jobs.apply.talentOnly")}</p>;
  } else if (app) {
    main = (
      <div className={bar ? "flex min-w-0 flex-1 items-center justify-between gap-2" : "grid gap-3"}>
        <div className={bar ? "min-w-0" : "grid gap-2"}>
          <div className="flex flex-wrap items-center gap-2">
            <AppStatusPill status={app.status} />
            <span className="text-[12px] text-mist">{t("jobs.apply.appliedAgo", { when: ago(app.createdAt) })}</span>
          </div>
          {!bar && app.note && <p className="rounded-lg bg-paper/50 px-3 py-2 text-[13px] text-mist">{t("jobs.apply.companyNote", { note: app.note })}</p>}
        </div>
        {app.status !== "accepted" && (
          <button onClick={() => setWithdrawing(true)} className={`${btn.ghost} ${bar ? "shrink-0 px-4" : "w-full"}`}>
            {t("jobs.apply.withdraw")}
          </button>
        )}
      </div>
    );
  } else if (state !== "open") {
    main = (
      <div className={bar ? "flex min-w-0 flex-1 items-center gap-2" : "grid gap-2"}>
        <button disabled className={`${btn.primary} cursor-not-allowed opacity-50 ${bar ? "shrink-0" : "w-full"}`}>
          <Ban size={15} /> {verb}
        </button>
        <p className="min-w-0 text-[13px] text-mist">{reason}</p>
      </div>
    );
  } else if (!user) {
    main = (
      <div className={bar ? "flex min-w-0 flex-1" : "grid gap-2"}>
        <button onClick={() => openApp(`#/jobs/${o.id}`)} className={`${btn.primary} w-full`}>
          {verb}
        </button>
        {!bar && <p className="text-[13px] text-mist">{t("jobs.apply.signInHint")}</p>}
      </div>
    );
  } else {
    main = (
      <button onClick={() => setOpen(true)} className={`${btn.primary} ${bar ? "min-w-0 flex-1" : "w-full"}`}>
        {verb}
      </button>
    );
  }

  return (
    <>
      {bar ? (
        <div className="flex items-center gap-2">
          {main}
          <button onClick={doShare} aria-label={t("common.action.copyLink")} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line text-mist hover:text-ink">
            <Share2 size={17} />
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          <div>
            <div className="text-[12px] text-mist">{isEvent ? t("jobs.fact.entry") : t("jobs.fact.salary")}</div>
            <div className="mt-0.5 text-[18px] font-semibold">{salaryText(o)}</div>
          </div>
          {main}
          <button onClick={doShare} className={`${btn.ghost} w-full`}>
            <Share2 size={15} /> {t("common.action.copyLink")}
          </button>
        </div>
      )}

      {/* portaled so a fixed or blurred parent (the phone apply bar) cannot trap the modal */}
      {createPortal(
        <>
          {user?.kind === "talent" && <ApplyModal o={o} talent={user} open={open} onClose={() => setOpen(false)} />}
          <Modal open={withdrawing} onClose={() => setWithdrawing(false)}>
        <div className="grid gap-4">
          <h2 className="text-[22px]">{t("jobs.apply.withdrawTitle")}</h2>
          <p className="text-[14px] text-mist">{t("jobs.apply.withdrawText", { title: o.title })}</p>
          <ErrorNote>{withdraw.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button onClick={doWithdraw} disabled={withdraw.pending} className={`${btn.secondary} disabled:opacity-60`}>
              {withdraw.pending && <Spinner />} {t("jobs.apply.withdraw")}
            </button>
            <button onClick={() => setWithdrawing(false)} className={btn.ghost}>
              {t("common.action.cancel")}
            </button>
          </div>
        </div>
          </Modal>
        </>,
        document.body,
      )}
    </>
  );
}

function ApplyModal({ o, talent, open, onClose }: { o: OpportunityDetail; talent: TalentProfile; open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const toast = useToast();
  const [cover, setCover] = useState("");
  const [answers, setAnswers] = useState<string[]>(() => o.questions.map(() => ""));
  const [withCv, setWithCv] = useState(!!talent.cv);
  const [tried, setTried] = useState(false);
  const apply = useAction(api.opportunities.apply);
  const isEvent = o.type === "Event";
  const missing = o.questions.some((_, i) => !answers[i]?.trim());

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (missing) return;
    const r = await apply.run(o.id, { cover, answers, withCv: withCv && !!talent.cv });
    if (r) {
      toast(isEvent ? t("jobs.apply.registered") : t("jobs.apply.sent"));
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-5" noValidate>
        <div>
          <p className="text-[13px] text-mist">{o.company.name}</p>
          <h2 className="mt-1 text-[22px]">{isEvent ? t("jobs.apply.registerTitle", { title: o.title }) : t("jobs.apply.title", { title: o.title })}</h2>
          <p className="mt-2 text-[13px] text-mist">{t("jobs.apply.profileShared")}</p>
        </div>
        <Field label={t("jobs.apply.cover")} hint={t("jobs.apply.coverHint")}>
          <Textarea rows={5} maxLength={1500} value={cover} onChange={(e) => setCover(e.target.value)} placeholder={t("jobs.apply.coverPlaceholder")} />
        </Field>
        {o.questions.map((q, i) => {
          const bad = tried && !answers[i]?.trim();
          return (
            <Field key={i} label={`${q} *`} hint={bad ? t("jobs.apply.required") : undefined}>
              <Textarea
                rows={3}
                maxLength={800}
                required
                aria-invalid={bad || undefined}
                className={bad ? "border-bad/70" : ""}
                value={answers[i] ?? ""}
                onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
              />
            </Field>
          );
        })}
        {talent.cv ? (
          <div className="rounded-lg border border-line px-3 py-1">
            <Toggle checked={withCv} onChange={setWithCv} label={t("jobs.apply.attachCv", { name: talent.cv.name })} />
          </div>
        ) : (
          <p className="flex items-start gap-2 text-[13px] text-mist">
            <FileText size={15} className="mt-0.5 shrink-0" />
            <span>
              {t("jobs.apply.noCv")}{" "}
              <a href="#/app/profile" className="text-sky hover:underline">
                {t("jobs.apply.addCv")}
              </a>
            </span>
          </p>
        )}
        <ErrorNote>{tried && missing ? t("jobs.apply.answerAll") : apply.error}</ErrorNote>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={apply.pending} className={`${btn.primary} disabled:opacity-60`}>
            {apply.pending ? <Spinner /> : <Check size={16} />} {isEvent ? t("jobs.apply.register") : t("jobs.apply.send")}
          </button>
          <button type="button" onClick={onClose} className={btn.ghost}>
            {t("common.action.cancel")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
