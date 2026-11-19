import { BadgeCheck, Building2, CalendarPlus, EyeOff, ScrollText } from "lucide-react";
import { api } from "../api";
import { useApi } from "../api/hooks";
import { Card, Empty, ErrorNote, Skeleton, ago } from "../components/form";
import { btn } from "../components/ui";
import { go } from "../lib/router";
import { AdminHeader } from "./AdminShell";
import { ActionPill } from "./Audit";

export function Overview() {
  const stats = useApi(() => api.users.stats(), []);
  const queue = useApi(() => api.admin.companyQueue(), []);
  const opps = useApi(() => api.admin.opportunities(), []);
  const audit = useApi(() => api.admin.audit(), []);
  const hidden = (opps.data ?? []).filter((o) => o.hidden);

  const s = stats.data;
  const cards: { label: string; value: number | string; tone?: "accent" }[] = s
    ? [
        { label: "Talents", value: s.talents },
        { label: "Verified talents", value: s.verifiedTalents },
        { label: "Approved companies", value: s.companies },
        { label: "Pending companies", value: s.pendingCompanies, tone: s.pendingCompanies > 0 ? "accent" : undefined },
        { label: "Open postings", value: s.openOpportunities },
        { label: "Hidden postings", value: s.hiddenOpportunities },
        { label: "Public events", value: s.events },
        { label: "Registered teams", value: s.teams },
      ]
    : [];

  return (
    <div>
      <AdminHeader
        title="Overview"
        text="What needs a decision today, and what changed recently."
        action={
          <button onClick={() => go("#/admin/events/new")} className={btn.primary}>
            <CalendarPlus size={17} /> Create event
          </button>
        }
      />

      <ErrorNote>{stats.error}</ErrorNote>
      {stats.loading ? (
        <Skeleton rows={2} className="h-20" />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-line bg-surface p-4">
              <div className={`text-[26px] font-semibold leading-none ${c.tone === "accent" ? "text-accent" : "text-ink"}`}>{c.value}</div>
              <div className="mt-2 text-[12px] text-mist">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <h2 className="text-[17px]">Needs attention</h2>
          {queue.loading || opps.loading ? (
            <div className="mt-4">
              <Skeleton rows={2} className="h-14" />
            </div>
          ) : (queue.data?.length ?? 0) + hidden.length === 0 ? (
            <div className="mt-4">
              <Empty title="All clear" text="No companies are waiting and no postings are hidden." />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {queue.data?.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint text-sky">
                    <Building2 size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{c.name}</span>
                    <span className="block text-[12px] text-mist">
                      Waiting for approval, registered {ago(c.createdAt)}
                    </span>
                  </span>
                  <button onClick={() => go("#/admin/companies")} className={`${btn.sm} bg-accent text-paper hover:bg-accent-deep`}>
                    Review
                  </button>
                </li>
              ))}
              {hidden.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bad/15 text-bad">
                    <EyeOff size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{o.title}</span>
                    <span className="block truncate text-[12px] text-mist">
                      Hidden posting by {o.company?.name ?? "unknown"}. {o.hiddenReason}
                    </span>
                  </span>
                  <button onClick={() => go("#/admin/opportunities")} className={`${btn.sm} border border-line hover:bg-tint`}>
                    Open
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[17px]">Recent activity</h2>
            <button onClick={() => go("#/admin/audit")} className="text-[12px] font-semibold text-sky hover:underline">
              Full audit log
            </button>
          </div>
          {audit.loading ? (
            <div className="mt-4">
              <Skeleton rows={3} className="h-12" />
            </div>
          ) : !audit.data?.length ? (
            <div className="mt-4">
              <Empty icon={<ScrollText size={20} />} title="No admin actions yet" />
            </div>
          ) : (
            <ul className="mt-4 grid gap-3">
              {audit.data.slice(0, 6).map((a) => (
                <li key={a.id} className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ActionPill action={a.action} />
                    <span className="min-w-0 truncate text-[13px] font-semibold">{a.target}</span>
                  </div>
                  <div className="text-[11px] text-mist">
                    {a.actorName}, {ago(a.at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-[17px]">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: CalendarPlus, title: "Create event", text: "Hackathon, case competition, meetup or workshop.", href: "#/admin/events/new" },
            { icon: Building2, title: "Review companies", text: "Approve or reject new company accounts.", href: "#/admin/companies" },
            { icon: BadgeCheck, title: "Verify talent", text: "Verify participants and award winner badges.", href: "#/admin/users" },
          ].map((q) => (
            <button
              key={q.title}
              onClick={() => go(q.href)}
              className="flex items-start gap-3 rounded-2xl border border-line p-4 text-left transition-colors hover:border-sky hover:bg-tint"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue text-white">
                <q.icon size={18} />
              </span>
              <span>
                <span className="block text-[14px] font-semibold">{q.title}</span>
                <span className="mt-0.5 block text-[12px] text-mist">{q.text}</span>
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
