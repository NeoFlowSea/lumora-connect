import { useState } from "react";
import { BadgeCheck, Building2, Check, Globe, Mail, MapPin, Users as UsersIcon, X } from "lucide-react";
import { api } from "../api";
import { useAction, useApi } from "../api/hooks";
import type { CompanyProfile } from "../api/types";
import { Card, Empty, ErrorNote, Field, Skeleton, Spinner, Textarea, ago } from "../components/form";
import { Modal, Pill, btn, initials, useToast } from "../components/ui";
import { AdminHeader } from "./AdminShell";

export function Companies() {
  const queue = useApi(() => api.admin.companyQueue(), []);
  const all = useApi(() => api.admin.users({ role: "company" }), []);
  const [rejecting, setRejecting] = useState<CompanyProfile | null>(null);
  const companies = (all.data ?? []).filter((u): u is CompanyProfile => u.kind === "company");

  return (
    <div>
      <AdminHeader title="Companies" text="Approve new company and organization accounts, and manage the verified mark." />

      <h2 className="mb-3 text-[17px]">
        Waiting for approval {queue.data && queue.data.length > 0 && <span className="text-accent">({queue.data.length})</span>}
      </h2>
      <ErrorNote>{queue.error}</ErrorNote>
      {queue.loading ? (
        <Skeleton rows={1} className="h-40" />
      ) : !queue.data?.length ? (
        <Empty icon={<Check size={20} />} title="No companies waiting" text="New company accounts show up here right after they register." />
      ) : (
        <div className="grid gap-4">
          {queue.data.map((c) => (
            <QueueCard key={c.id} c={c} onReject={() => setRejecting(c)} />
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-10 text-[17px]">All companies and organizations</h2>
      <ErrorNote>{all.error}</ErrorNote>
      {all.loading ? (
        <Skeleton rows={3} className="h-16" />
      ) : !companies.length ? (
        <Empty title="No companies yet" />
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
  return (
    <Card>
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue font-semibold text-white">{initials(c.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[18px]">{c.name}</h3>
            <Pill tone="line">{c.orgKind === "organization" ? "Organization" : "Company"}</Pill>
            <Pill tone="tint">Registered {ago(c.createdAt)}</Pill>
          </div>
          {c.tagline && <p className="mt-1 text-[13px] text-mist">{c.tagline}</p>}
          <div className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] text-mist sm:grid-cols-2">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} /> {c.industry || "Industry not set"}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {c.city || "City not set"}
            </span>
            <span className="flex items-center gap-1.5">
              <UsersIcon size={14} /> {c.size || "Size not set"}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <Globe size={14} className="shrink-0" /> <span className="truncate">{c.website || "No website"}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5 sm:col-span-2">
              <Mail size={14} className="shrink-0" /> <span className="truncate">{c.email}{c.contact && c.contact !== c.email ? `, ${c.contact}` : ""}</span>
            </span>
          </div>
          {c.about && <p className="mt-3 max-w-[70ch] text-[13px] leading-relaxed">{c.about}</p>}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          disabled={approve.pending}
          onClick={async () => {
            if (await approve.run()) toast(`${c.name} approved`);
          }}
          className={`${btn.sm} bg-accent text-paper hover:bg-accent-deep disabled:opacity-60`}
        >
          {approve.pending ? <Spinner /> : <Check size={15} />} Approve
        </button>
        <button onClick={onReject} className={`${btn.sm} border border-line text-ink hover:border-bad hover:text-bad`}>
          <X size={15} /> Reject
        </button>
      </div>
      <div className="mt-3">
        <ErrorNote>{approve.error}</ErrorNote>
      </div>
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
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue text-[13px] font-semibold text-white">{initials(c.name)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[14px] font-semibold">{c.name}</span>
          {c.verified && <BadgeCheck size={15} className="text-accent" aria-label="Verified" />}
        </div>
        <div className="truncate text-[12px] text-mist">
          {c.orgKind === "organization" ? "Organization" : "Company"}, {c.industry || "no industry"}, {c.city || "no city"}
        </div>
        {c.status === "rejected" && c.statusNote && <div className="mt-0.5 text-[12px] text-bad">Rejected: {c.statusNote}</div>}
      </div>
      <Pill tone={tone}>{c.status === "approved" ? "Approved" : c.status === "pending" ? "Pending" : "Rejected"}</Pill>
      <button
        disabled={verify.pending}
        onClick={async () => {
          const was = c.verified;
          if (await verify.run(!was)) toast(was ? `${c.name} unverified` : `${c.name} verified`);
        }}
        className={`${btn.sm} border border-line hover:bg-tint disabled:opacity-60`}
      >
        {verify.pending ? <Spinner /> : <BadgeCheck size={15} />} {c.verified ? "Unverify" : "Verify"}
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
              reject.setError("Add a short reason so the company knows what to fix.");
              return;
            }
            if (await reject.run(company.id, note)) {
              toast(`${company.name} rejected`);
              close();
            }
          }}
        >
          <h2 className="text-[22px]">Reject {company.name}</h2>
          <p className="text-[13px] text-mist">The company sees this reason and can fix their profile.</p>
          <Field label="Reason">
            <Textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="For example: we could not confirm the company exists. Add a website or registration number."
            />
          </Field>
          <ErrorNote>{reject.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={reject.pending} className={`${btn.sm} bg-bad px-5 py-2.5 text-white hover:bg-bad/90 disabled:opacity-60`}>
              {reject.pending && <Spinner />} Reject company
            </button>
            <button type="button" onClick={close} className={btn.ghost}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
