import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BadgeCheck, Briefcase, Check, Clock, Eye, EyeOff, Lock, Pencil, Plus, Trash2, Users, XCircle } from "lucide-react";
import { api, completeness, type OpportunityWithCompany } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { CompanyProfile } from "../api/types";
import { Card, Empty, ErrorNote, Skeleton, Spinner, ago } from "../components/form";
import { Modal, btn, useToast } from "../components/ui";
import { useLang } from "../i18n";
import { useRoute } from "../lib/router";
import { SectionTitle, Stat, Verified } from "./parts/common";
import { Applicants } from "./jobs/Applicants";
import { Dots } from "./jobs/bits";
import { PostingForm } from "./jobs/PostingForm";
import { cityLabel, dateText, openState, salaryText, typeLabel, type OpenState } from "./jobs/format";

export function Dashboard() {
  const { t } = useLang();
  const user = useSession();
  if (!user || user.kind !== "company") {
    return <Empty title={t("jobs.dash.companyOnly")} text={t("jobs.dash.companyOnlyText")} />;
  }
  return <CompanyDashboard company={user} />;
}

const stateCls: Record<OpenState, string> = {
  open: "bg-good/15 text-good",
  closed: "border border-line text-mist",
  expired: "border border-line text-mist",
  hidden: "bg-bad/15 text-[#ffb3b3]",
};

function CompanyDashboard({ company }: { company: CompanyProfile }) {
  const { t, tp } = useLang();
  const toast = useToast();
  const route = useRoute();
  const mine = useApi(() => api.opportunities.mine(), []);
  const applicants = useApi(() => api.opportunities.applicants(), []);
  const matches = useApi(() => api.swipe.matches(), []);
  const [editing, setEditing] = useState<OpportunityWithCompany | "new" | null>(null);
  const [removing, setRemoving] = useState<OpportunityWithCompany | null>(null);
  const [posting, setPosting] = useState("");
  const toggle = useAction(async (o: OpportunityWithCompany) => {
    await api.opportunities.update(o.id, { closed: !o.closed });
    return !o.closed;
  });
  const approved = company.status === "approved";

  // #/app/dashboard?edit=<id> opens that posting in the editor (the job page links here)
  const editId = route.query.edit;
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!editId || !mine.data || handled.current === editId) return;
    handled.current = editId;
    const o = mine.data.find((x) => x.id === editId);
    if (o) setEditing(o);
    const base = window.location.hash.split("?")[0];
    window.history.replaceState(window.history.state, "", base);
  }, [editId, mine.data]);

  const apps = applicants.data ?? [];
  const countFor = (id: string) => apps.filter((a) => a.opportunityId === id).length;
  const newFor = (id: string) => apps.filter((a) => a.opportunityId === id && a.status === "pending").length;

  async function flip(o: OpportunityWithCompany) {
    const r = await toggle.run(o);
    if (r !== undefined) toast(r ? t("jobs.dash.closedToast") : t("jobs.dash.reopenedToast"));
  }

  function review(id: string) {
    setPosting(id);
    document.getElementById("applicants")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[clamp(26px,3vw,36px)]">{t("jobs.dash.title")}</h1>
          <p className="mt-1 text-[14px] text-mist">{t("jobs.dash.lead", { name: company.name })}</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          disabled={!approved}
          title={approved ? undefined : t("jobs.dash.afterApproval")}
          className={`${btn.primary} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Plus size={16} /> {t("jobs.dash.post")}
        </button>
      </div>

      <StatusCard company={company} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={mine.data ? mine.data.filter((o) => openState(o) === "open").length : "–"} label={t("jobs.dash.statOpen")} />
        <Stat value={applicants.data ? apps.length : "–"} label={t("jobs.dash.statApplicants")} />
        <Stat value={applicants.data ? apps.filter((a) => a.status === "shortlisted").length : "–"} label={t("jobs.dash.statShortlisted")} />
        <Stat value={matches.data ? matches.data.length : "–"} label={t("jobs.dash.statMatches")} />
      </div>

      <section>
        <SectionTitle>{t("jobs.dash.postings")}</SectionTitle>
        <ErrorNote>{toggle.error}</ErrorNote>
        {mine.loading && !mine.data ? (
          <Skeleton rows={2} />
        ) : mine.error ? (
          <ErrorNote>{mine.error}</ErrorNote>
        ) : !mine.data?.length ? (
          <Empty
            icon={<Briefcase size={20} />}
            title={t("jobs.dash.noPostings")}
            text={approved ? t("jobs.dash.noPostingsText") : t("jobs.dash.noPostingsLocked")}
            action={
              approved ? (
                <button onClick={() => setEditing("new")} className={btn.primary}>
                  <Plus size={16} /> {t("jobs.dash.post")}
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {mine.data.map((o) => {
              const st = openState(o);
              const n = countFor(o.id);
              const fresh = newFor(o.id);
              return (
                <li key={o.id}>
                  <Card className="flex h-full flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[12px] font-semibold ${stateCls[st]}`}>{t(`jobs.state.${st}`)}</span>
                      <span className="rounded-md border border-line px-2 py-0.5 text-[12px] text-mist">{typeLabel(o.type)}</span>
                      <span className="text-[12px] text-mist">{t("jobs.dash.posted", { when: ago(o.postedAt) })}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[17px] leading-snug">{o.title}</h3>
                      <Dots className="mt-1 text-[13px] text-mist" parts={[cityLabel(o.city), salaryText(o), o.deadline ? t("jobs.dash.until", { date: dateText(o.deadline) }) : null]} />
                    </div>
                    {o.hidden && (
                      <div className="flex items-start gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-[#ffb3b3]">
                        <EyeOff size={14} className="mt-0.5 shrink-0" />
                        <span>{o.hiddenReason ? t("jobs.dash.hiddenReason", { reason: o.hiddenReason }) : t("jobs.dash.hidden")}</span>
                      </div>
                    )}
                    <button onClick={() => review(o.id)} disabled={!n} className="inline-flex min-h-11 items-center gap-2 self-start text-[14px] font-semibold text-sky disabled:text-mist">
                      <Users size={15} /> {tp("jobs.fact.applicantsN", n)}
                      {fresh > 0 && <span className="rounded-md bg-accent px-1.5 text-[12px] font-semibold text-paper">{t("jobs.dash.newN", { n: fresh })}</span>}
                    </button>
                    <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-3">
                      <button onClick={() => setEditing(o)} className={`${btn.sm} min-h-11 border border-line hover:bg-tint`}>
                        <Pencil size={14} /> {t("common.action.edit")}
                      </button>
                      <button onClick={() => flip(o)} disabled={toggle.pending} className={`${btn.sm} min-h-11 border border-line hover:bg-tint disabled:opacity-60`}>
                        {o.closed ? <Check size={14} /> : <XCircle size={14} />} {o.closed ? t("jobs.dash.reopen") : t("jobs.dash.close")}
                      </button>
                      <a href={`#/jobs/${o.id}`} className={`${btn.sm} min-h-11 border border-line hover:bg-tint`}>
                        <Eye size={14} /> {t("jobs.dash.view")}
                      </a>
                      <button onClick={() => setRemoving(o)} aria-label={t("common.action.delete")} className={`${btn.sm} ml-auto min-h-11 min-w-11 border border-line text-[#ffb3b3] hover:bg-bad/10`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Applicants list={applicants.data} loading={applicants.loading} error={applicants.error} postings={mine.data ?? []} posting={posting} setPosting={setPosting} />

      <Modal open={!!editing} onClose={() => setEditing(null)} wide>
        {editing && <PostingForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Modal>
      <RemoveModal posting={removing} onClose={() => setRemoving(null)} />
    </div>
  );
}

function StatusCard({ company }: { company: CompanyProfile }) {
  const { t } = useLang();
  const c = completeness(company);
  const missing = c.items.filter((i) => !i.done);

  const progress = (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-mist">{t("jobs.dash.completeness")}</span>
        <span className="font-semibold tabular-nums text-accent">{c.percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper/70" role="progressbar" aria-valuenow={c.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-blue" style={{ width: `${c.percent}%` }} />
      </div>
      {missing.length > 0 && (
        <p className="text-[13px] text-mist">
          {t("jobs.dash.missing")} {missing.map((i) => t(`jobs.check.${i.key}`)).join(", ")}
        </p>
      )}
    </div>
  );

  if (company.status === "approved") {
    return (
      <Card className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-good/15 text-good">
            <BadgeCheck size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              {t(company.orgKind === "organization" ? "jobs.dash.approvedOrg" : "jobs.dash.approvedCompany")}
              <Verified on={company.verified} />
            </div>
            <p className="mt-1 text-[13px] text-mist">{company.verified ? t("jobs.dash.approvedVerified") : t("jobs.dash.approvedText")}</p>
          </div>
        </div>
        {c.percent < 100 ? (
          <div className="grid gap-2">
            {progress}
            <a href="#/app/profile" className="text-[13px] font-semibold text-sky hover:underline">
              {t("jobs.dash.completeProfile")}
            </a>
          </div>
        ) : (
          <a href={`#/company/${company.id}`} className={`${btn.ghost} md:justify-self-end`}>
            {t("jobs.dash.publicPage")}
          </a>
        )}
      </Card>
    );
  }

  const locked = ["swipe", "publish", "applicants"];
  const pending = company.status === "pending";
  return (
    <Card className={`grid gap-5 ${pending ? "border-accent/40" : "border-bad/40"}`}>
      <div className="flex items-start gap-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${pending ? "bg-accent/15 text-accent" : "bg-bad/15 text-[#ffb3b3]"}`}>
          {pending ? <Clock size={22} /> : <XCircle size={22} />}
        </span>
        <div className="min-w-0">
          <div className="font-semibold">{pending ? t("jobs.dash.pendingTitle") : t("jobs.dash.rejectedTitle")}</div>
          <p className="mt-1 text-[13px] text-mist">
            {pending ? t("jobs.dash.pendingText") : company.statusNote ? t("jobs.dash.rejectedReason", { note: company.statusNote }) : t("jobs.dash.rejectedText")}
          </p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <div className="text-[13px] text-mist">{t("jobs.dash.lockedTitle")}</div>
          <ul className="mt-2 grid gap-2 text-[14px]">
            {locked.map((k) => (
              <li key={k} className="flex items-start gap-2">
                <Lock size={14} className="mt-1 shrink-0 text-mist" /> {t(`jobs.dash.locked.${k}`)}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid content-start gap-3">
          {progress}
          <a href="#/app/profile" className={`${btn.secondary} justify-self-start`}>
            {t("jobs.dash.completeProfile")}
          </a>
        </div>
      </div>
    </Card>
  );
}

function RemoveModal({ posting, onClose }: { posting: OpportunityWithCompany | null; onClose: () => void }) {
  const { t } = useLang();
  const act = useAction(async (id: string) => {
    await api.opportunities.remove(id);
    return true;
  });
  const toast = useToast();
  async function confirm() {
    if (!posting) return;
    const ok = await act.run(posting.id);
    if (ok) {
      toast(t("jobs.dash.removed"));
      onClose();
    }
  }
  return (
    <Modal open={!!posting} onClose={onClose}>
      {posting && (
        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-bad/15 text-[#ffb3b3]">
              <AlertTriangle size={18} />
            </span>
            <h2 className="text-[22px]">{t("jobs.dash.removeTitle")}</h2>
          </div>
          <p className="text-[14px] text-mist">{t("jobs.dash.removeText", { title: posting.title })}</p>
          <ErrorNote>{act.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button onClick={confirm} disabled={act.pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-bad px-5 text-[15px] font-semibold text-white hover:bg-bad/90 disabled:opacity-60">
              {act.pending && <Spinner />} {t("jobs.dash.removeConfirm")}
            </button>
            <button onClick={onClose} className={btn.ghost}>
              {t("jobs.dash.keep")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
