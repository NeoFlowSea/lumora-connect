import { useState } from "react";
import { BadgeCheck, Check, ExternalLink, X } from "lucide-react";
import { api, completeness } from "../api";
import { useAction, useApi } from "../api/hooks";
import type { CompanyProfile, TalentProfile } from "../api/types";
import { Card, Empty, ErrorNote, Field, Skeleton, Spinner, Textarea, ago } from "../components/form";
import { Modal, Pill, btn, useToast } from "../components/ui";
import { locale, t, trackLabel } from "../i18n";
import { Avatar } from "../app/parts/common";
import { AdminHeader } from "./AdminShell";

/* #/admin/verification: people and companies who asked for the verified mark.
   A Lumora result is checked automatically by the API; everything else lands here. */

type Person = TalentProfile | CompanyProfile;

const fullDate = (iso: string) => (iso ? new Date(iso).toLocaleString(locale(), { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

/** make a proof value clickable when it is a link we can open safely */
function ProofValue({ proof, value }: { proof: string; value: string }) {
  if (!value) return <span className="text-mist">—</span>;
  if (proof === "github" && /github\.com\/[\w-]+/i.test(value)) {
    const href = value.startsWith("http") ? value : `https://${value}`;
    return (
      <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 break-all font-semibold text-sky hover:underline">
        {value} <ExternalLink size={12} className="shrink-0" />
      </a>
    );
  }
  return <span className="break-all font-semibold">{value}</span>;
}

export function Verification() {
  const queue = useApi(() => api.admin.verificationQueue(), []);
  const [declining, setDeclining] = useState<Person | null>(null);
  const n = queue.data?.length ?? 0;

  return (
    <div>
      <AdminHeader title={t("admin.verify.title")} text={t("admin.verify.lead")} />
      <ErrorNote>{queue.error}</ErrorNote>
      {queue.loading ? (
        <Skeleton rows={2} className="h-48" />
      ) : !n ? (
        <Empty icon={<Check size={20} />} title={t("admin.verify.emptyTitle")} text={t("admin.verify.emptyText")} />
      ) : (
        <>
          <p className="mb-3 text-[13px] text-mist">{t("admin.verify.count", { n })}</p>
          <ul className="grid gap-4">
            {queue.data!.map((u) => (
              <li key={u.id}>
                <RequestCard u={u} onDecline={() => setDeclining(u)} />
              </li>
            ))}
          </ul>
        </>
      )}
      <DeclineModal person={declining} onClose={() => setDeclining(null)} />
    </div>
  );
}

function RequestCard({ u, onDecline }: { u: Person; onDecline: () => void }) {
  const toast = useToast();
  const c = completeness(u);
  const missing = c.items.filter((i) => i.required && !i.done);
  const approve = useAction(async () => {
    await api.admin.reviewVerification(u.id, true);
    return true as const;
  });
  const v = u.verification;

  return (
    <Card className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-start gap-4">
        <Avatar name={u.name} size={48} tone={u.kind === "company" ? "paper" : "blue"} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="min-w-0 break-words text-[18px]">{u.name}</h2>
            <Pill tone="line">{t(u.kind === "talent" ? "admin.kind.talent" : u.orgKind === "organization" ? "admin.kind.organization" : "admin.kind.company")}</Pill>
            {u.demo && <Pill tone="line">{t("common.status.demo")}</Pill>}
          </div>
          <div className="mt-0.5 break-all text-[13px] text-mist">{u.email}</div>
          {u.kind === "company" && (
            <a href={`#/company/${u.id}`} className="mt-1 inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-sky hover:underline md:min-h-0">
              {t("admin.verify.openPage")} <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-3 text-[14px] sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-[12px] text-mist">{t("admin.verify.proof")}</dt>
          <dd className="mt-0.5">{t(`admin.proof.${v.proof || "none"}`)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[12px] text-mist">{t("admin.verify.value")}</dt>
          <dd className="mt-0.5 min-w-0">
            <ProofValue proof={v.proof} value={v.proofValue} />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[12px] text-mist">{t("admin.verify.requested")}</dt>
          <dd className="mt-0.5" title={fullDate(v.requestedAt)}>
            {v.requestedAt ? `${ago(v.requestedAt)}, ${fullDate(v.requestedAt)}` : "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[12px] text-mist">{t("admin.verify.completeness")}</dt>
          <dd className="mt-1.5 flex items-center gap-3">
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuenow={c.percent} aria-valuemin={0} aria-valuemax={100}>
              <span className={`block h-full rounded-full ${c.ready ? "bg-good" : "bg-sky"}`} style={{ width: `${c.percent}%` }} />
            </span>
            <span className="shrink-0 tabular-nums">{c.percent}%</span>
          </dd>
        </div>
      </dl>

      {missing.length > 0 ? (
        <p className="mt-3 rounded-lg bg-bad/10 px-3 py-2 text-[13px] text-[#ffb3b3]">
          {t("admin.verify.missing", { list: missing.map((i) => t(`admin.check.${i.key}`)).join(", ") })}
        </p>
      ) : (
        <p className="mt-3 text-[13px] text-good">{t("admin.verify.ready")}</p>
      )}

      <ProfileFacts u={u} />

      {v.note && <p className="mt-3 text-[13px] text-mist">{t("admin.verify.prevNote", { note: v.note })}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          disabled={approve.pending}
          onClick={async () => {
            if (await approve.run()) toast(t("admin.verify.approved", { name: u.name }));
          }}
          className={`${btn.secondary} disabled:opacity-60`}
        >
          {approve.pending ? <Spinner /> : <BadgeCheck size={16} />} {t("admin.verify.approve")}
        </button>
        <button onClick={onDecline} className={`${btn.ghost} hover:border-bad`}>
          <X size={16} /> {t("admin.verify.decline")}
        </button>
      </div>
      {approve.error && (
        <div className="mt-3">
          <ErrorNote>{approve.error}</ErrorNote>
        </div>
      )}
    </Card>
  );
}

/** the facts a reviewer needs without leaving the queue */
function ProfileFacts({ u }: { u: Person }) {
  const rows: [string, string][] =
    u.kind === "talent"
      ? [
          [t("admin.facts.headline"), u.headline],
          [t("admin.facts.city"), [u.city, trackLabel(u.cat)].filter(Boolean).join(", ")],
          [t("admin.facts.education"), [u.education.institution, u.education.program, u.education.year].filter(Boolean).join(", ")],
          [t("admin.facts.skills"), u.skills.join(", ")],
          [t("admin.facts.links"), [u.github, u.portfolio, u.linkedin].filter(Boolean).join(", ")],
          [t("admin.facts.projects"), u.projects.map((p) => p.name).join(", ")],
          [t("admin.facts.badges"), u.badges.map((b) => `${b.title}, ${b.hackathonName}`).join("; ")],
        ]
      : [
          [t("admin.facts.tagline"), u.tagline],
          [t("admin.facts.industry"), [u.industry, u.size, u.city].filter(Boolean).join(", ")],
          [t("admin.facts.website"), u.website],
          [t("admin.facts.status"), t(`common.status.${u.status}`)],
          [t("admin.facts.contact"), u.contact],
        ];
  const shown = rows.filter(([, v]) => v.trim());
  if (!shown.length) return null;
  return (
    <details className="mt-4 rounded-lg border border-line">
      <summary className="flex min-h-11 cursor-pointer items-center px-3 text-[13px] font-semibold text-sky">{t("admin.verify.profile")}</summary>
      <dl className="grid gap-2 border-t border-line px-3 py-3 text-[13px]">
        {shown.map(([k, v]) => (
          <div key={k} className="grid gap-0.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-3">
            <dt className="text-mist">{k}</dt>
            <dd className="min-w-0 break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function DeclineModal({ person, onClose }: { person: Person | null; onClose: () => void }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const decline = useAction(async (id: string, n: string) => {
    await api.admin.reviewVerification(id, false, n);
    return true as const;
  });

  function close() {
    setNote("");
    decline.setError(null);
    onClose();
  }

  return (
    <Modal open={!!person} onClose={close}>
      {person && (
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!note.trim()) {
              decline.setError(t("admin.verify.noteRequired"));
              return;
            }
            if (await decline.run(person.id, note.trim())) {
              toast(t("admin.verify.declined", { name: person.name }));
              close();
            }
          }}
        >
          <h2 className="break-words text-[22px]">{t("admin.verify.declineTitle", { name: person.name })}</h2>
          <p className="text-[14px] text-mist">{t("admin.verify.declineText")}</p>
          <Field label={t("admin.verify.note")}>
            <Textarea autoFocus required value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("admin.verify.notePh")} />
          </Field>
          <ErrorNote>{decline.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={decline.pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-bad px-5 text-[15px] font-semibold text-white hover:bg-bad/90 disabled:opacity-60">
              {decline.pending && <Spinner />} {t("admin.verify.declineSubmit")}
            </button>
            <button type="button" onClick={close} className={btn.ghost}>
              {t("common.action.cancel")}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
