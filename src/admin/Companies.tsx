import { useState } from "react";
import { BadgeCheck, Building2, Check, ExternalLink, Globe, Mail, MapPin, Users as UsersIcon, X } from "lucide-react";
import { api } from "../api";
import { useAction, useApi } from "../api/hooks";
import type { CompanyProfile } from "../api/types";
import { Card, Empty, ErrorNote, Field, Skeleton, Spinner, Textarea, ago } from "../components/form";
import { Modal, Pill, btn, useToast } from "../components/ui";
import { t } from "../i18n";
import { Avatar } from "../app/parts/common";
import { AdminHeader } from "./AdminShell";

const kindLabel = (c: CompanyProfile) => t(c.orgKind === "organization" ? "admin.kind.organization" : "admin.kind.company");
const rowBtn = `${btn.sm} min-h-11 md:min-h-9`;

export function Companies() {
  const queue = useApi(() => api.admin.companyQueue(), []);
  const all = useApi(() => api.admin.users({ role: "company" }), []);
  const [rejecting, setRejecting] = useState<CompanyProfile | null>(null);
  const companies = (all.data ?? []).filter((u): u is CompanyProfile => u.kind === "company");

  return (
    <div>
      <AdminHeader title={t("admin.companies.title")} text={t("admin.companies.lead")} />

      <h2 className="mb-3 text-[17px]">
        {t("admin.companies.waiting")} {queue.data && queue.data.length > 0 && <span className="text-accent">({queue.data.length})</span>}
      </h2>
      <ErrorNote>{queue.error}</ErrorNote>
      {queue.loading ? (
        <Skeleton rows={1} className="h-40" />
      ) : !queue.data?.length ? (
        <Empty icon={<Check size={20} />} title={t("admin.companies.noneWaiting")} text={t("admin.companies.noneWaitingText")} />
      ) : (
        <div className="grid gap-4">
          {queue.data.map((c) => (
            <QueueCard key={c.id} c={c} onReject={() => setRejecting(c)} />
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-10 text-[17px]">{t("admin.companies.all")}</h2>
      <ErrorNote>{all.error}</ErrorNote>
      {all.loading ? (
        <Skeleton rows={3} className="h-16" />
      ) : !companies.length ? (
        <Empty title={t("admin.companies.none")} />
      ) : (
        <Card className="p-0 md:p-0">
          <ul className="divide-y divide-line">
            {companies.map((c) => (
              <CompanyRow key={c.id} c={c} />
            ))}
          </ul>
        </Card>
      )}

      <RejectModal company={rejecting} onClose={() => setRejecting(null)} />
    </div>
  );
}

function QueueCard({ c, onReject }: { c: CompanyProfile; onReject: () => void }) {
  const toast = useToast();
  const approve = useAction(async () => {
    await api.admin.setCompanyStatus(c.id, "approved");
    return true as const;
  });
  const notSet = t("admin.companies.notSet");
  return (
    <Card className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-start gap-4">
        <Avatar name={c.name} size={48} tone="paper" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-[18px]">{c.name}</h3>
            <Pill tone="line">{kindLabel(c)}</Pill>
            {c.demo && <Pill tone="line">{t("common.status.demo")}</Pill>}
            <span className="text-[12px] text-mist">{t("admin.companies.registered", { when: ago(c.createdAt) })}</span>
          </div>
          {c.tagline && <p className="mt-1 break-words text-[14px] text-mist">{c.tagline}</p>}
          <div className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] text-mist sm:grid-cols-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <Building2 size={14} className="shrink-0" /> <span className="truncate">{c.industry || notSet}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin size={14} className="shrink-0" /> <span className="truncate">{c.city || notSet}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <UsersIcon size={14} className="shrink-0" /> <span className="truncate">{c.size || notSet}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <Globe size={14} className="shrink-0" /> <span className="truncate">{c.website || notSet}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5 sm:col-span-2">
              <Mail size={14} className="shrink-0" />{" "}
              <span className="truncate">
                {c.email}
                {c.contact && c.contact !== c.email ? `, ${c.contact}` : ""}
              </span>
            </span>
          </div>
          {c.about && <p className="mt-3 max-w-[70ch] break-words text-[14px] leading-relaxed">{c.about}</p>}
          <a href={`#/company/${c.id}`} className="mt-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-sky hover:underline md:min-h-0">
            {t("admin.companies.openPage")} <ExternalLink size={12} />
          </a>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={approve.pending}
          onClick={async () => {
            if (await approve.run()) toast(t("admin.companies.approvedToast", { name: c.name }));
          }}
          className={`${btn.secondary} disabled:opacity-60`}
        >
          {approve.pending ? <Spinner /> : <Check size={16} />} {t("admin.companies.approve")}
        </button>
        <button onClick={onReject} className={`${btn.ghost} hover:border-bad`}>
          <X size={16} /> {t("admin.companies.reject")}
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

function CompanyRow({ c }: { c: CompanyProfile }) {
  const toast = useToast();
  const verify = useAction(async (v: boolean) => {
    await api.admin.setVerified(c.id, v);
    return true as const;
  });
  const tone = c.status === "approved" ? "good" : c.status === "pending" ? "tint" : "line";
  return (
    <li className="flex min-w-0 flex-wrap items-center gap-3 px-4 py-3 md:px-5">
      <Avatar name={c.name} size={40} tone="paper" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <a href={`#/company/${c.id}`} className="min-w-0 truncate text-[14px] font-semibold hover:underline">
            {c.name}
          </a>
          {c.verified && <BadgeCheck size={15} className="shrink-0 text-sky" aria-label={t("common.status.verified")} />}
          {c.demo && <Pill tone="line">{t("common.status.demo")}</Pill>}
        </div>
        <div className="truncate text-[12px] text-mist">{[kindLabel(c), c.industry, c.city].filter(Boolean).join(", ")}</div>
        {c.status === "rejected" && c.statusNote && <div className="mt-0.5 break-words text-[12px] text-[#ffb3b3]">{t("admin.companies.rejectedNote", { note: c.statusNote })}</div>}
      </div>
      <Pill tone={tone}>{t(`common.status.${c.status}`)}</Pill>
      <button
        disabled={verify.pending}
        onClick={async () => {
          const was = c.verified;
          if (await verify.run(!was)) toast(t(was ? "admin.users.unverifiedToast" : "admin.users.verifiedToast", { name: c.name }));
        }}
        className={`${rowBtn} border border-line hover:bg-tint disabled:opacity-60`}
      >
        {verify.pending ? <Spinner /> : <BadgeCheck size={15} />} {t(c.verified ? "admin.users.unverify" : "admin.users.verify")}
      </button>
      {verify.error && (
        <div className="w-full">
          <ErrorNote>{verify.error}</ErrorNote>
        </div>
      )}
    </li>
  );
}

function RejectModal({ company, onClose }: { company: CompanyProfile | null; onClose: () => void }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const reject = useAction(async (id: string, n: string) => {
    await api.admin.setCompanyStatus(id, "rejected", n);
    return true as const;
  });

  function close() {
    setNote("");
    reject.setError(null);
    onClose();
  }

  return (
    <Modal open={!!company} onClose={close}>
      {company && (
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!note.trim()) {
              reject.setError(t("admin.companies.reasonRequired"));
              return;
            }
            if (await reject.run(company.id, note.trim())) {
              toast(t("admin.companies.rejectedToast", { name: company.name }));
              close();
            }
          }}
        >
          <h2 className="break-words text-[22px]">{t("admin.companies.rejectTitle", { name: company.name })}</h2>
          <p className="text-[14px] text-mist">{t("admin.companies.rejectText")}</p>
          <Field label={t("admin.companies.reason")}>
            <Textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("admin.companies.reasonPh")} />
          </Field>
          <ErrorNote>{reject.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={reject.pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-bad px-5 text-[15px] font-semibold text-white hover:bg-bad/90 disabled:opacity-60">
              {reject.pending && <Spinner />} {t("admin.companies.rejectSubmit")}
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
