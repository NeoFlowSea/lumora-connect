import { useState } from "react";
import { Briefcase, Eye, EyeOff, MapPin, Trash2 } from "lucide-react";
import { api, type OpportunityWithCompany } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { AdminProfile } from "../api/types";
import { Card, Empty, ErrorNote, Field, Skeleton, Spinner, Textarea, ago } from "../components/form";
import { Modal, Pill, btn, useToast } from "../components/ui";
import { t } from "../i18n";
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
        title={t("admin.opps.title")}
        text={`${t("admin.opps.lead")}${hiddenCount ? ` ${t("admin.opps.hiddenNow", { n: hiddenCount })}` : ""}`}
      />
      <ErrorNote>{list.error}</ErrorNote>
      {list.loading ? (
        <Skeleton rows={4} className="h-24" />
      ) : !list.data?.length ? (
        <Empty icon={<Briefcase size={20} />} title={t("admin.opps.noneTitle")} text={t("admin.opps.noneText")} />
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
    <Card className={`min-w-0 ${o.hidden ? "border-bad/40" : ""}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-[16px]">{o.title}</h3>
            <Pill tone="line">{t(`admin.opps.type.${o.type.replace(" ", "")}`)}</Pill>
            {o.demo && <Pill tone="line">{t("common.status.demo")}</Pill>}
            {o.hidden && (
              <span className="inline-flex items-center gap-1 rounded-md bg-bad/15 px-2 py-0.5 text-[12px] font-semibold text-[#ffb3b3]">
                <EyeOff size={12} /> {t("admin.opps.hidden")}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-mist">
            <a href={`#/company/${o.companyId}`} className="hover:underline">{o.company?.name ?? t("admin.opps.deletedCompany")}</a>
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {o.city}
            </span>
            <span>{o.pay}</span>
            <span>{t("admin.opps.posted", { when: ago(o.postedAt) })}</span>
            <a href={`#/jobs/${o.id}`} className="text-sky hover:underline">{t("admin.opps.view")}</a>
          </div>
          {o.hidden && o.hiddenReason && (
            <p className="mt-2 break-words rounded-lg bg-bad/10 px-3 py-2 text-[13px] text-[#ffb3b3]">{t("admin.opps.reasonShown", { reason: o.hiddenReason })}</p>
          )}
          <p className="mt-2 line-clamp-2 max-w-[80ch] text-[13px] text-mist">{o.desc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {o.hidden ? (
            <button
              disabled={restore.pending}
              onClick={async () => {
                if (await restore.run()) toast(t("admin.opps.restoredToast"));
              }}
              className={`${btn.sm} min-h-11 bg-blue text-white hover:bg-blue-deep disabled:opacity-60 md:min-h-9`}
            >
              {restore.pending ? <Spinner /> : <Eye size={15} />} {t("admin.opps.restore")}
            </button>
          ) : (
            <button onClick={onHide} className={`${btn.sm} min-h-11 border border-line hover:bg-tint md:min-h-9`}>
              <EyeOff size={15} /> {t("admin.opps.hide")}
            </button>
          )}
          {isSuper && (
            <button onClick={onDelete} className={`${btn.sm} min-h-11 border border-line text-[#ffb3b3] hover:border-bad md:min-h-9`}>
              <Trash2 size={15} /> {t("common.action.delete")}
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
              hide.setError(t("admin.opps.reasonRequired"));
              return;
            }
            if (await hide.run(opp.id, reason)) {
              toast(t("admin.opps.hiddenToast"));
              close();
            }
          }}
        >
          <h2 className="break-words text-[22px]">{t("admin.opps.hideTitle", { title: opp.title })}</h2>
          <p className="text-[14px] text-mist">{t("admin.opps.hideText", { name: opp.company?.name ?? "—" })}</p>
          <Field label={t("admin.companies.reason")}>
            <Textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("admin.opps.reasonPh")} />
          </Field>
          <ErrorNote>{hide.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={hide.pending} className={`${btn.primary} disabled:opacity-60`}>
              {hide.pending ? <Spinner /> : <EyeOff size={16} />} {t("admin.opps.hideSubmit")}
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
          <h2 className="break-words text-[22px]">{t("admin.opps.deleteTitle", { title: opp.title })}</h2>
          <p className="text-[14px] text-mist">{t("admin.opps.deleteText")}</p>
          <ErrorNote>{del.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={del.pending}
              onClick={async () => {
                if (await del.run(opp.id)) {
                  toast(t("admin.opps.deletedToast"));
                  onClose();
                }
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-bad px-5 text-[15px] font-semibold text-white hover:bg-bad/90 disabled:opacity-60"
            >
              {del.pending ? <Spinner /> : <Trash2 size={15} />} {t("admin.opps.deleteSubmit")}
            </button>
            <button onClick={onClose} className={btn.ghost}>
              {t("common.action.cancel")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
