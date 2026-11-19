import { useState } from "react";
import { ScrollText } from "lucide-react";
import { api } from "../api";
import { useApi } from "../api/hooks";
import { Card, Empty, ErrorNote, Skeleton, ago } from "../components/form";
import { AdminHeader } from "./AdminShell";

const filters = [
  { key: "", label: "All" },
  { key: "event", label: "Events" },
  { key: "company", label: "Companies" },
  { key: "user", label: "Users" },
  { key: "badge", label: "Badges" },
  { key: "opportunity", label: "Postings" },
  { key: "admin", label: "Admins" },
];

const actionLabels: Record<string, string> = {
  "event.create": "Event created",
  "event.update": "Event updated",
  "event.delete": "Event deleted",
  "event.results": "Results assigned",
  "company.approve": "Company approved",
  "company.reject": "Company rejected",
  "user.verify": "Verified",
  "user.unverify": "Unverified",
  "user.delete": "Account deleted",
  "badge.award": "Badge awarded",
  "badge.revoke": "Badge revoked",
  "opportunity.hide": "Posting hidden",
  "opportunity.restore": "Posting restored",
  "opportunity.delete": "Posting deleted",
  "admin.create": "Admin added",
  "admin.role": "Admin level changed",
};

/** small pill for an audit action, shared with the overview page */
export function ActionPill({ action }: { action: string }) {
  const danger = /delete|reject|hide|revoke|unverify/.test(action);
  const good = /approve|verify|award|restore|create/.test(action) && !danger;
  const cls = danger ? "bg-bad/15 text-[#ffb3b3]" : good ? "bg-good/15 text-good" : "bg-tint text-sky";
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>{actionLabels[action] ?? action}</span>;
}

export function Audit() {
  const list = useApi(() => api.admin.audit(), []);
  const [filter, setFilter] = useState("");
  const rows = (list.data ?? []).filter((a) => !filter || a.action.startsWith(`${filter}.`));

  return (
    <div>
      <AdminHeader title="Audit log" text="Every admin action, newest first. Use it to see who changed what." />

      <div className="scrollbar-none mb-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              filter === f.key ? "border-accent bg-accent text-paper" : "border-line text-mist hover:border-sky hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ErrorNote>{list.error}</ErrorNote>
      {list.loading ? (
        <Skeleton rows={6} className="h-14" />
      ) : !rows.length ? (
        <Empty icon={<ScrollText size={20} />} title="Nothing here yet" text="Admin actions in this category will show up as soon as someone makes one." />
      ) : (
        <Card className="p-0 md:p-0">
          {/* desktop table header */}
          <div className="hidden grid-cols-[130px_160px_170px_1fr] gap-4 border-b border-line px-5 py-3 text-[12px] font-semibold text-mist lg:grid">
            <span>When</span>
            <span>Who</span>
            <span>Action</span>
            <span>Target and detail</span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((a) => (
              <li key={a.id} className="grid gap-1.5 px-4 py-3 md:px-5 lg:grid-cols-[130px_160px_170px_1fr] lg:items-center lg:gap-4">
                <span className="text-[12px] text-mist" title={new Date(a.at).toLocaleString("en-GB")}>
                  {ago(a.at)}
                </span>
                <span className="truncate text-[13px] font-semibold">{a.actorName}</span>
                <span>
                  <ActionPill action={a.action} />
                </span>
                <span className="min-w-0 text-[13px]">
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
