import { useState } from "react";
import { ScrollText } from "lucide-react";
import { api } from "../api";
import { useApi } from "../api/hooks";
import { Card, Empty, ErrorNote, Skeleton, ago } from "../components/form";
import { locale, t } from "../i18n";
import { AdminHeader, FilterChip } from "./AdminShell";

const filters = ["", "event", "company", "user", "badge", "opportunity", "admin"];

/** label for an audit action code like "company.approve"; unknown codes show as they are */
export function actionLabel(action: string): string {
  const k = `admin.action.${action}`;
  const s = t(k);
  return s === k ? action : s;
}

/** small pill for an audit action, shared with the overview page */
export function ActionPill({ action }: { action: string }) {
  const danger = /delete|reject|hide|revoke|unverify|decline/.test(action);
  const good = /approve|verify|award|restore|create/.test(action) && !danger;
  const cls = danger ? "bg-bad/15 text-[#ffb3b3]" : good ? "bg-good/15 text-good" : "bg-tint text-sky";
  return <span className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold ${cls}`}>{actionLabel(action)}</span>;
}

export function Audit() {
  const list = useApi(() => api.admin.audit(), []);
  const [filter, setFilter] = useState("");
  const rows = (list.data ?? []).filter((a) => !filter || a.action.startsWith(`${filter}.`));

  return (
    <div>
      <AdminHeader title={t("admin.audit.title")} text={t("admin.audit.lead")} />

      <div className="scrollbar-none mb-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <FilterChip key={f || "all"} on={filter === f} onClick={() => setFilter(f)}>
            {t(`admin.audit.filter.${f || "all"}`)}
          </FilterChip>
        ))}
      </div>

      <ErrorNote>{list.error}</ErrorNote>
      {list.loading ? (
        <Skeleton rows={6} className="h-14" />
      ) : !rows.length ? (
        <Empty icon={<ScrollText size={20} />} title={t("admin.audit.emptyTitle")} text={t("admin.audit.emptyText")} />
      ) : (
        <Card className="p-0 md:p-0">
          <div className="hidden grid-cols-[130px_160px_170px_minmax(0,1fr)] gap-4 border-b border-line px-5 py-3 text-[12px] font-semibold text-mist lg:grid">
            <span>{t("admin.audit.when")}</span>
            <span>{t("admin.audit.who")}</span>
            <span>{t("admin.audit.action")}</span>
            <span>{t("admin.audit.target")}</span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((a) => (
              <li key={a.id} className="grid min-w-0 gap-1.5 px-4 py-3 md:px-5 lg:grid-cols-[130px_160px_170px_minmax(0,1fr)] lg:items-center lg:gap-4">
                <span className="text-[12px] text-mist" title={new Date(a.at).toLocaleString(locale())}>
                  {ago(a.at)}
                </span>
                <span className="truncate text-[13px] font-semibold">{a.actorName}</span>
                <span>
                  <ActionPill action={a.action} />
                </span>
                <span className="min-w-0 break-words text-[13px]">
                  <span className="font-semibold">{a.target}</span>
                  {a.detail && <span className="text-mist">. {a.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
