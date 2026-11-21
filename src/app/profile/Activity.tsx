import { useState } from "react";
import { Briefcase, CalendarDays, Trophy } from "lucide-react";
import { api, statusLabel } from "../../api";
import type { ApplicationWithOpportunity } from "../../api";
import { useAction, useApi } from "../../api/hooks";
import type { ApplicationStatus, TalentProfile } from "../../api/types";
import { locale, useLang } from "../../i18n";
import { Empty, ErrorNote, Skeleton, Spinner, ago, when } from "../../components/form";
import { Modal, btn, useToast } from "../../components/ui";
import { go } from "../../lib/router";
import { Section, Tag } from "./kit";

/* Talent activity on the profile page: hackathon results and teams, job applications. */

export function HackathonHistory({ u }: { u: TalentProfile }) {
  const { t } = useLang();
  const teams = useApi(() => api.hackathons.myTeams(), []);
  const events = useApi(() => api.hackathons.list(), []);
  const byId = new Map((events.data ?? []).map((h) => [h.id, h]));
  const rows = (teams.data ?? [])
    .map((tm) => ({ tm, h: byId.get(tm.hackathonId) }))
    .filter((r) => r.h)
    .sort((a, b) => b.h!.start.localeCompare(a.h!.start));
  const badges = u.badges.slice().reverse();
  const loading = teams.loading || events.loading;

  return (
    <Section id="history" title={t("profile.sec.history")} text={t("profile.sec.historyText")}>
      {loading ? (
        <Skeleton rows={2} className="h-16" />
      ) : badges.length === 0 && rows.length === 0 ? (
        <Empty
          icon={<Trophy size={20} />}
          title={t("profile.history.emptyTitle")}
          text={t("profile.history.empty")}
          action={
            <button type="button" onClick={() => go("#/app/hackathons")} className={btn.ghost}>
              {t("profile.history.find")}
            </button>
          }
        />
      ) : (
        <div className="grid gap-5">
          {badges.length > 0 && (
            <div className="grid gap-2">
              <h3 className="text-[14px] font-medium text-mist">{t("profile.history.badges")}</h3>
              <ul className="grid gap-2">
                {badges.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 rounded-lg border border-line bg-paper/30 px-3 py-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                      <Trophy size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{b.title}</span>
                      <span className="block truncate text-[13px] text-mist">
                        {b.hackathonName}
                        {b.teamName ? `, ${t("profile.history.team", { team: b.teamName })}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] text-mist">{new Date(b.awardedAt).toLocaleDateString(locale(), { month: "short", year: "numeric" })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rows.length > 0 && (
            <div className="grid gap-2">
              <h3 className="text-[14px] font-medium text-mist">{t("profile.history.teams")}</h3>
              <ul className="grid gap-2">
                {rows.map(({ tm, h }) => (
                  <li key={tm.id}>
                    <button
                      type="button"
                      onClick={() => go(`#/app/hackathons/${h!.id}`)}
                      className="flex w-full items-center gap-3 rounded-lg border border-line bg-paper/30 px-3 py-2.5 text-left transition-colors hover:border-sky"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-tint text-sky">
                        <CalendarDays size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{h!.title}</span>
                        <span className="block truncate text-[13px] text-mist">
                          {t("profile.history.team", { team: tm.teamName })}
                          {tm.track ? `, ${tm.track}` : ""}, {when(h!.start, false)}
                        </span>
                      </span>
                      <span className="hidden shrink-0 sm:inline">
                        <Tag>{statusLabel(h!.status)}</Tag>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {teams.error && <ErrorNote>{teams.error}</ErrorNote>}
    </Section>
  );
}

const STATUS_TONE: Record<ApplicationStatus, "line" | "tint" | "good" | "bad"> = { pending: "line", shortlisted: "tint", accepted: "good", rejected: "bad" };

export function Applications() {
  const { t } = useLang();
  const toast = useToast();
  const apps = useApi(() => api.opportunities.myApplications(), []);
  const [confirm, setConfirm] = useState<ApplicationWithOpportunity | null>(null);
  const withdraw = useAction(async (id: string) => {
    await api.opportunities.withdraw(id);
    return true;
  });

  async function doWithdraw() {
    if (!confirm) return;
    if (await withdraw.run(confirm.id)) {
      setConfirm(null);
      toast(t("profile.apps.withdrawn"));
    }
  }

  return (
    <Section id="applications" title={t("profile.sec.applications")}>
      {apps.loading ? (
        <Skeleton rows={2} className="h-16" />
      ) : apps.error ? (
        <ErrorNote>{apps.error}</ErrorNote>
      ) : !apps.data?.length ? (
        <Empty
          icon={<Briefcase size={20} />}
          title={t("profile.apps.emptyTitle")}
          text={t("profile.apps.empty")}
          action={
            <button type="button" onClick={() => go("#/jobs")} className={btn.ghost}>
              {t("profile.apps.browse")}
            </button>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {apps.data.map((a) => (
            <li key={a.id} className="grid gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="min-w-0 flex-1">
                  <a href={`#/jobs/${a.opportunity.id}`} className="block font-semibold text-ink hover:text-sky">
                    {a.opportunity.title}
                  </a>
                  <p className="text-[13px] text-mist">{t("profile.apps.meta", { company: a.opportunity.company.name, when: ago(a.createdAt) })}</p>
                </div>
                <Tag tone={STATUS_TONE[a.status]}>{t(`profile.apps.status.${a.status}`)}</Tag>
              </div>
              {a.note && <p className="rounded-lg bg-paper/50 px-3 py-2 text-[13px] text-mist">{t("profile.apps.note", { company: a.opportunity.company.name, note: a.note })}</p>}
              {a.status !== "accepted" && (
                <button type="button" onClick={() => setConfirm(a)} className="min-h-11 w-fit rounded-lg px-2 text-[13px] font-semibold text-mist hover:text-ink">
                  {t("profile.apps.withdraw")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!confirm} onClose={() => setConfirm(null)}>
        <div className="grid gap-4">
          <h2 className="text-[22px]">{t("profile.apps.confirmTitle")}</h2>
          <p className="text-[15px] text-mist">{t("profile.apps.confirmText", { title: confirm?.opportunity.title ?? "" })}</p>
          <ErrorNote>{withdraw.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={doWithdraw} disabled={withdraw.pending} className={`${btn.secondary} disabled:opacity-60`}>
              {withdraw.pending && <Spinner />} {t("profile.apps.withdraw")}
            </button>
            <button type="button" onClick={() => setConfirm(null)} className={btn.ghost}>
              {t("common.action.cancel")}
            </button>
          </div>
        </div>
      </Modal>
    </Section>
  );
}
