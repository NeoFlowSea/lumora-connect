import type { ReactNode } from "react";
import { BadgeCheck, Building2, CalendarPlus, EyeOff, ScrollText } from "lucide-react";
import { api, statsNow } from "../api";
import { useApi, useSession } from "../api/hooks";
import { Card, Empty, Skeleton, ago } from "../components/form";
import { btn } from "../components/ui";
import { locale, t, tp } from "../i18n";
import { go } from "../lib/router";
import { AdminHeader } from "./AdminShell";
import { ActionPill } from "./Audit";

export function Overview() {
  useSession(); // keeps statsNow() fresh on every DB change
  const s = statsNow();
  const queue = useApi(() => api.admin.companyQueue(), []);
  const verifs = useApi(() => api.admin.verificationQueue(), []);
  const opps = useApi(() => api.admin.opportunities(), []);
  const audit = useApi(() => api.admin.audit(), []);
  const hidden = (opps.data ?? []).filter((o) => o.hidden);
  const num = (n: number) => n.toLocaleString(locale());

  const cards: { key: string; value: number; href: string }[] = [
    { key: "talents", value: s.talents, href: "#/admin/users" },
    { key: "verifiedTalents", value: s.verifiedTalents, href: "#/admin/users" },
    { key: "companies", value: s.companies, href: "#/admin/companies" },
    { key: "openOpportunities", value: s.openOpportunities, href: "#/admin/opportunities" },
    { key: "hiddenOpportunities", value: s.hiddenOpportunities, href: "#/admin/opportunities" },
    { key: "events", value: s.events, href: "#/admin/events" },
    { key: "cities", value: s.cities, href: "#/admin/events" },
    { key: "teams", value: s.teams, href: "#/admin/events" },
  ];

  const waiting = [
    { key: "pendingVerifications", n: s.pendingVerifications, href: "#/admin/verification", icon: BadgeCheck },
    { key: "pendingCompanies", n: s.pendingCompanies, href: "#/admin/companies", icon: Building2 },
  ];

  return (
    <div>
      <AdminHeader
        title={t("admin.overview.title")}
        text={t("admin.overview.lead")}
        action={
          <button onClick={() => go("#/admin/events/new")} className={btn.primary}>
            <CalendarPlus size={17} /> {t("admin.events.create")}
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {waiting.map((w) => (
          <button
            key={w.key}
            onClick={() => go(w.href)}
            className={`flex min-w-0 items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:border-sky md:p-5 ${w.n > 0 ? "border-accent/50 bg-surface" : "border-line bg-surface"}`}
          >
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${w.n > 0 ? "bg-accent text-paper" : "bg-tint text-sky"}`}>
              <w.icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[28px] font-semibold leading-none ${w.n > 0 ? "text-accent" : "text-ink"}`}>{num(w.n)}</span>
              <span className="mt-1.5 block text-[14px] text-mist">{t(`admin.overview.${w.key}`)}</span>
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-sky">{w.n > 0 ? t("admin.overview.review") : t("admin.overview.open")}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <button key={c.key} onClick={() => go(c.href)} className="min-w-0 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-sky">
            <div className="text-[24px] font-semibold leading-none">{num(c.value)}</div>
            <div className="mt-2 text-[13px] text-mist">{t(`admin.overview.stat.${c.key}`)}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <h2 className="text-[17px]">{t("admin.overview.attention")}</h2>
          {queue.loading || opps.loading || verifs.loading ? (
            <div className="mt-4">
              <Skeleton rows={2} className="h-14" />
            </div>
          ) : (queue.data?.length ?? 0) + (verifs.data?.length ?? 0) + hidden.length === 0 ? (
            <div className="mt-4">
              <Empty title={t("admin.overview.clearTitle")} text={t("admin.overview.clearText")} />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {verifs.data?.map((u) => (
                <AttentionRow
                  key={u.id}
                  icon={<BadgeCheck size={17} />}
                  title={u.name}
                  text={t("admin.overview.verifyAsked", { when: ago(u.verification.requestedAt || u.createdAt) })}
                  action={t("admin.overview.review")}
                  href="#/admin/verification"
                />
              ))}
              {queue.data?.map((c) => (
                <AttentionRow
                  key={c.id}
                  icon={<Building2 size={17} />}
                  title={c.name}
                  text={t("admin.overview.companyWaiting", { when: ago(c.createdAt) })}
                  action={t("admin.overview.review")}
                  href="#/admin/companies"
                />
              ))}
              {hidden.map((o) => (
                <AttentionRow
                  key={o.id}
                  tone="bad"
                  icon={<EyeOff size={17} />}
                  title={o.title}
                  text={`${t("admin.overview.hiddenBy", { name: o.company?.name ?? "—" })}${o.hiddenReason ? `. ${o.hiddenReason}` : ""}`}
                  action={t("admin.overview.open")}
                  href="#/admin/opportunities"
                />
              ))}
            </ul>
          )}
        </Card>

        <Card className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[17px]">{t("admin.overview.recent")}</h2>
            <button onClick={() => go("#/admin/audit")} className="min-h-11 text-[13px] font-semibold text-sky hover:underline">
              {t("admin.overview.fullLog")}
            </button>
          </div>
          {audit.loading ? (
            <div className="mt-4">
              <Skeleton rows={3} className="h-12" />
            </div>
          ) : !audit.data?.length ? (
            <div className="mt-4">
              <Empty icon={<ScrollText size={20} />} title={t("admin.overview.noActions")} />
            </div>
          ) : (
            <ul className="mt-3 grid gap-3">
              {audit.data.slice(0, 6).map((a) => (
                <li key={a.id} className="grid min-w-0 gap-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <ActionPill action={a.action} />
                    <span className="min-w-0 break-words text-[14px] font-semibold">{a.target}</span>
                  </div>
                  <div className="text-[12px] text-mist">
                    {a.actorName}, {ago(a.at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-6 text-[12px] text-mist">{tp("admin.overview.footnote", s.talents + s.companies)}</p>
    </div>
  );
}

function AttentionRow({ icon, title, text, action, href, tone }: { icon: ReactNode; title: string; text: string; action: string; href: string; tone?: "bad" }) {
  return (
    <li className="flex min-w-0 items-center gap-3 py-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone === "bad" ? "bg-bad/15 text-bad" : "bg-tint text-sky"}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{title}</span>
        <span className="block truncate text-[12px] text-mist">{text}</span>
      </span>
      <button onClick={() => go(href)} className={`${btn.sm} min-h-11 shrink-0 border border-line hover:border-sky hover:bg-tint md:min-h-9`}>
        {action}
      </button>
    </li>
  );
}
