import { useMemo, useState } from "react";
import { ChevronDown, FileText, Users } from "lucide-react";
import { api, type ApplicationWithTalent, type OpportunityWithCompany } from "../../api";
import { useAction } from "../../api/hooks";
import type { ApplicationStatus } from "../../api/types";
import { Card, Empty, ErrorNote, Field, Select, Skeleton, Spinner, Textarea, ago } from "../../components/form";
import { Modal, btn, useToast } from "../../components/ui";
import { trackLabel, useLang } from "../../i18n";
import { AppStatusPill, Avatar, BadgeRow, DemoTag, SectionTitle, Tags, Verified } from "../parts/common";

const STATUSES: ApplicationStatus[] = ["pending", "shortlisted", "accepted", "rejected"];

export function Applicants({
  list,
  loading,
  error,
  postings,
  posting,
  setPosting,
}: {
  list: ApplicationWithTalent[] | undefined;
  loading: boolean;
  error: string | null;
  postings: OpportunityWithCompany[];
  posting: string;
  setPosting: (id: string) => void;
}) {
  const { t } = useLang();
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [changing, setChanging] = useState<{ app: ApplicationWithTalent; to: ApplicationStatus } | null>(null);

  const filtered = useMemo(
    () => (list ?? []).filter((a) => (!posting || a.opportunityId === posting) && (!status || a.status === status)),
    [list, posting, status],
  );

  return (
    <section id="applicants" className="scroll-mt-24">
      <SectionTitle
        aside={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Select
              value={posting}
              onChange={(e) => setPosting(e.target.value)}
              options={[{ value: "", label: t("jobs.dash.allPostings") }, ...postings.map((o) => ({ value: o.id, label: o.title }))]}
              className="min-w-0 sm:w-60"
              aria-label={t("jobs.dash.filterPosting")}
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus | "")}
              options={[{ value: "", label: t("jobs.dash.allStatuses") }, ...STATUSES.map((s) => ({ value: s, label: t(`jobs.appStatus.${s}`) }))]}
              className="min-w-0 sm:w-44"
              aria-label={t("jobs.dash.filterStatus")}
            />
          </div>
        }
      >
        {t("jobs.dash.applicants")}
      </SectionTitle>
      {loading && !list ? (
        <Skeleton rows={3} />
      ) : error ? (
        <ErrorNote>{error}</ErrorNote>
      ) : !list?.length ? (
        <Empty icon={<Users size={20} />} title={t("jobs.dash.noApplicants")} text={t("jobs.dash.noApplicantsText")} />
      ) : !filtered.length ? (
        <Empty title={t("jobs.dash.noMatch")} text={t("jobs.dash.noMatchText")} />
      ) : (
        <ul className="grid gap-3">
          {filtered.map((a) => (
            <li key={a.id}>
              <ApplicantCard a={a} onChange={(to) => setChanging({ app: a, to })} />
            </li>
          ))}
        </ul>
      )}
      <StatusModal state={changing} onClose={() => setChanging(null)} />
    </section>
  );
}

function ApplicantCard({ a, onChange }: { a: ApplicationWithTalent; onChange: (to: ApplicationStatus) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const p = a.talent;
  const qs = a.opportunity.questions;
  const answered = a.answers.filter((x) => x.trim()).length;
  const cv = a.withCv && p.cv ? p.cv : null;

  return (
    <Card className="grid gap-4">
      <div className="flex min-w-0 gap-4">
        <a href={`#/app/talent/${p.id}`} className="shrink-0" aria-label={p.name}>
          <Avatar name={p.name} src={p.photo} size={48} />
        </a>
        <div className="grid min-w-0 flex-1 gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a href={`#/app/talent/${p.id}`} className="font-semibold hover:text-sky">
              {p.name}
            </a>
            <Verified on={p.verified} />
            <AppStatusPill status={a.status} />
            {p.demo && <DemoTag />}
          </div>
          <div className="text-[13px] text-mist">
            {[p.headline || trackLabel(p.cat), p.city].filter(Boolean).join(", ")}
          </div>
          <div className="text-[13px] text-mist">
            {t("jobs.dash.appliedTo")} <span className="text-ink">{a.opportunity.title}</span>, {ago(a.createdAt)}
          </div>
          <BadgeRow badges={p.badges} max={2} />
          <Tags items={p.skills} max={5} />
        </div>
      </div>

      {a.cover && <p className="line-clamp-3 rounded-lg bg-paper/50 px-3 py-2.5 text-[14px] leading-relaxed">{a.cover}</p>}

      {(answered > 0 || cv) && (
        <div>
          <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-sky">
            <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            {open ? t("jobs.dash.hideApplication") : t("jobs.dash.showApplication")}
          </button>
          {open && (
            <div className="mt-2 grid gap-3">
              {a.cover && (
                <div>
                  <div className="text-[12px] text-mist">{t("jobs.apply.cover")}</div>
                  <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed">{a.cover}</p>
                </div>
              )}
              {a.answers.map((ans, i) =>
                ans.trim() ? (
                  <div key={i}>
                    <div className="text-[12px] text-mist">{qs[i] ?? t("jobs.form.question", { n: i + 1 })}</div>
                    <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed">{ans}</p>
                  </div>
                ) : null,
              )}
              {cv && (
                <a href={cv.dataUrl} download={cv.name} className={`${btn.secondary} justify-self-start`}>
                  <FileText size={15} /> {t("jobs.dash.downloadCv", { name: cv.name })}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {a.note && <p className="text-[13px] text-mist">{t("jobs.dash.yourNote", { note: a.note })}</p>}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <a href={`#/app/talent/${p.id}`} className={`${btn.sm} min-h-11 border border-line hover:bg-tint`}>
          {t("jobs.fullProfile")}
        </a>
        {a.status === "pending" && (
          <button onClick={() => onChange("shortlisted")} className={`${btn.sm} min-h-11 bg-blue text-white hover:bg-blue-deep`}>
            {t("jobs.dash.shortlist")}
          </button>
        )}
        {a.status !== "accepted" && (
          <button onClick={() => onChange("accepted")} className={`${btn.sm} min-h-11 border border-line hover:bg-tint`}>
            {t("jobs.dash.accept")}
          </button>
        )}
        {a.status !== "rejected" && (
          <button onClick={() => onChange("rejected")} className={`${btn.sm} min-h-11 border border-line text-[#ffb3b3] hover:bg-bad/10`}>
            {t("jobs.dash.reject")}
          </button>
        )}
        {a.status !== "pending" && (
          <button onClick={() => onChange("pending")} className={`${btn.sm} min-h-11 text-mist hover:text-ink`}>
            {t("jobs.dash.backToPending")}
          </button>
        )}
      </div>
    </Card>
  );
}

function StatusModal({ state, onClose }: { state: { app: ApplicationWithTalent; to: ApplicationStatus } | null; onClose: () => void }) {
  return (
    <Modal open={!!state} onClose={onClose}>
      {state && <StatusForm key={`${state.app.id}-${state.to}`} app={state.app} initial={state.to} onClose={onClose} />}
    </Modal>
  );
}

function StatusForm({ app, initial, onClose }: { app: ApplicationWithTalent; initial: ApplicationStatus; onClose: () => void }) {
  const { t } = useLang();
  const toast = useToast();
  const [to, setTo] = useState<ApplicationStatus>(initial);
  const [note, setNote] = useState(app.note);
  const act = useAction(async () => {
    await api.opportunities.setStatus(app.id, to, note.trim());
    return true;
  });

  async function submit() {
    const ok = await act.run();
    if (ok) {
      toast(t("jobs.dash.statusSaved", { name: app.talent.name }));
      onClose();
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-[22px]">{t("jobs.dash.statusTitle", { name: app.talent.name })}</h2>
        <p className="mt-1 text-[14px] text-mist">{t("jobs.dash.statusText", { title: app.opportunity.title })}</p>
      </div>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("jobs.dash.status")}>
        {STATUSES.map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={to === s}
            onClick={() => setTo(s)}
            className={`min-h-11 rounded-lg border px-3 text-[14px] font-semibold transition-colors ${to === s ? "border-sky bg-tint text-ink" : "border-line text-mist hover:text-ink"}`}
          >
            {t(`jobs.appStatus.${s}`)}
          </button>
        ))}
      </div>
      <Field label={t("jobs.dash.note")} hint={to === "rejected" ? t("jobs.dash.noteRejectHint") : t("jobs.dash.noteHint")}>
        <Textarea rows={3} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} placeholder={to === "rejected" ? t("jobs.dash.noteRejectPlaceholder") : t("jobs.dash.notePlaceholder")} />
      </Field>
      <ErrorNote>{act.error}</ErrorNote>
      <div className="flex flex-wrap gap-3">
        <button onClick={submit} disabled={act.pending} className={`${btn.primary} disabled:opacity-60`}>
          {act.pending && <Spinner />} {t("jobs.dash.saveStatus")}
        </button>
        <button onClick={onClose} className={btn.ghost}>
          {t("common.action.cancel")}
        </button>
      </div>
    </div>
  );
}
