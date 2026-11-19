import { useState } from "react";
import { Briefcase, Eye, EyeOff, MapPin, Trash2 } from "lucide-react";
import { api, type OpportunityWithCompany } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { AdminProfile } from "../api/types";
import { Card, Empty, ErrorNote, Field, Skeleton, Spinner, Textarea, ago } from "../components/form";
import { Modal, Pill, btn, useToast } from "../components/ui";
import { AdminHeader } from "./AdminShell";

export function Opportunities() {
  const me = useSession() as AdminProfile | null;
  const isSuper = me?.level === "super";
  const list = useApi(() => api.admin.opportunities(), []);
  const [hiding, setHiding] = useState<OpportunityWithCompany | null>(null);
  const [deleting, setDeleting] = useState<OpportunityWithCompany | null>(null);
  const hiddenCount = (list.data ?? []).filter((o) => o.hidden).length;

  return (
    <div>
      <AdminHeader
        title="Opportunities"
        text={`Hide postings that break the rules and restore them once fixed.${hiddenCount ? ` ${hiddenCount} hidden right now.` : ""}`}
      />
      <ErrorNote>{list.error}</ErrorNote>
      {list.loading ? (
        <Skeleton rows={4} className="h-24" />
      ) : !list.data?.length ? (
        <Empty icon={<Briefcase size={20} />} title="No postings yet" text="Postings appear here as soon as an approved company publishes them." />
      ) : (
        <div className="grid gap-3">
          {list.data.map((o) => (
            <OpportunityRow key={o.id} o={o} isSuper={isSuper} onHide={() => setHiding(o)} onDelete={() => setDeleting(o)} />
          ))}
        </div>
      )}

      <HideModal opp={hiding} onClose={() => setHiding(null)} />
      <DeleteModal opp={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function OpportunityRow({
  o,
  isSuper,
  onHide,
  onDelete,
}: {
  o: OpportunityWithCompany;
  isSuper: boolean;
  onHide: () => void;
  onDelete: () => void;
}) {
  const toast = useToast();
  const restore = useAction(async () => {
    await api.admin.setOpportunityHidden(o.id, false);
    return true as const;
  });
  return (
    <Card className={o.hidden ? "border-bad/40" : ""}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16px]">{o.title}</h3>
            <Pill tone={o.type === "Internship" ? "blue" : "line"}>{o.type}</Pill>
            {o.hidden && (
              <span className="inline-flex items-center gap-1 rounded-full bg-bad/15 px-2.5 py-1 text-[12px] font-semibold text-bad">
                <EyeOff size={12} /> Hidden
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-mist">
            <span>{o.company?.name ?? "Deleted company"}</span>
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {o.city}
            </span>
            <span>{o.pay}</span>
            <span>Posted {ago(o.postedAt)}</span>
          </div>
          {o.hidden && o.hiddenReason && (
            <p className="mt-2 rounded-xl bg-bad/10 px-3 py-2 text-[13px] text-[#ffb3b3]">Reason: {o.hiddenReason}</p>
          )}
          <p className="mt-2 line-clamp-2 max-w-[80ch] text-[13px] text-mist">{o.desc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {o.hidden ? (
            <button
              disabled={restore.pending}
              onClick={async () => {
                if (await restore.run()) toast("Posting restored");
              }}
              className={`${btn.sm} bg-accent text-paper hover:bg-accent-deep disabled:opacity-60`}
            >
              {restore.pending ? <Spinner /> : <Eye size={15} />} Restore
            </button>
          ) : (
            <button onClick={onHide} className={`${btn.sm} border border-line hover:bg-tint`}>
              <EyeOff size={15} /> Hide
            </button>
          )}
          {isSuper && (
            <button onClick={onDelete} className={`${btn.sm} border border-line text-bad hover:border-bad`}>
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>
      {restore.error && (
        <div className="mt-3">
          <ErrorNote>{restore.error}</ErrorNote>
        </div>
      )}
    </Card>
  );
}

function HideModal({ opp, onClose }: { opp: OpportunityWithCompany | null; onClose: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const hide = useAction(async (id: string, r: string) => {
    await api.admin.setOpportunityHidden(id, true, r);
    return true as const;
  });
  function close() {
    setReason("");
    hide.setError(null);
    onClose();
  }
  return (
    <Modal open={!!opp} onClose={close}>
      {opp && (
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!reason.trim()) {
              hide.setError("Add a reason for hiding it.");
              return;
            }
            if (await hide.run(opp.id, reason)) {
              toast("Posting hidden");
              close();
            }
          }}
        >
          <h2 className="text-[22px]">Hide {opp.title}</h2>
          <p className="text-[13px] text-mist">
            Talent stops seeing it right away. {opp.company?.name ?? "The company"} gets a notification with your reason.
          </p>
          <Field label="Reason">
            <Textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example: pay terms are unclear, please list the monthly stipend." />
          </Field>
          <ErrorNote>{hide.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={hide.pending} className={`${btn.primary} disabled:opacity-60`}>
              {hide.pending ? <Spinner /> : <EyeOff size={16} />} Hide posting
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

function DeleteModal({ opp, onClose }: { opp: OpportunityWithCompany | null; onClose: () => void }) {
  const toast = useToast();
  const del = useAction(async (id: string) => {
    await api.admin.deleteOpportunity(id);
    return true as const;
  });
  return (
    <Modal open={!!opp} onClose={onClose}>
      {opp && (
        <div className="grid gap-4">
          <h2 className="text-[22px]">Delete {opp.title}?</h2>
          <p className="text-[13px] text-mist">The posting and all its applications are removed. This cannot be undone, except by resetting the demo data.</p>
          <ErrorNote>{del.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={del.pending}
              onClick={async () => {
                if (await del.run(opp.id)) {
                  toast("Posting deleted");
                  onClose();
                }
              }}
              className={`${btn.sm} bg-bad px-5 py-2.5 text-white hover:bg-bad/90 disabled:opacity-60`}
            >
              {del.pending ? <Spinner /> : <Trash2 size={15} />} Delete posting
            </button>
            <button onClick={onClose} className={btn.ghost}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
