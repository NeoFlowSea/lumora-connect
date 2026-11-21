import type { MouseEvent } from "react";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import type { OpportunityWithCompany } from "../../api";
import type { ApplicationStatus } from "../../api/types";
import { ago } from "../../components/form";
import { useLang } from "../../i18n";
import { AppStatusPill, Avatar, DemoTag } from "../parts/common";
import { Dots } from "./bits";
import { cityLabel, deadlineSoon, formatLabel, isPaid, levelLabel, openState, salaryText, scheduleLabel, typeLabel } from "./format";

/* One posting in a list, like a row on hh.uz or LinkedIn Jobs. */
export function JobCard({
  o,
  status,
  selected = false,
  onSelect,
  showCompany = true,
}: {
  o: OpportunityWithCompany;
  status?: ApplicationStatus;
  selected?: boolean;
  onSelect?: (e: MouseEvent<HTMLAnchorElement>) => void;
  showCompany?: boolean;
}) {
  const { t } = useLang();
  const state = openState(o);
  const soon = state === "open" ? deadlineSoon(o.deadline) : null;
  const paid = isPaid(o);
  return (
    <a
      href={`#/jobs/${o.id}`}
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`group flex gap-3.5 rounded-xl border p-4 transition-colors sm:gap-4 sm:p-5 ${
        selected ? "border-sky bg-tint" : "border-line bg-surface hover:border-sky/60"
      } ${state !== "open" ? "opacity-75" : ""}`}
    >
      {showCompany && <Avatar name={o.company.name} src={o.company.logo} size={44} shape="square" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug group-hover:text-white">{o.title}</h3>
          {status ? <AppStatusPill status={status} /> : <span className="shrink-0 rounded-md border border-line px-2 py-0.5 text-[12px] text-mist">{typeLabel(o.type)}</span>}
        </div>
        {showCompany && (
          <div className="mt-1 flex min-w-0 items-center gap-1 text-[14px] text-ink/85">
            <span className="truncate">{o.company.name}</span>
            {o.company.verified && <BadgeCheck size={14} className="shrink-0 text-sky" aria-label={t("common.status.verified")} />}
          </div>
        )}
        <Dots
          className="mt-1.5 text-[13px] text-mist"
          parts={[
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {cityLabel(o.city)}
            </span>,
            o.city !== "Remote" ? formatLabel(o.format) : null,
            scheduleLabel(o.schedule),
            o.level !== "any" ? levelLabel(o.level) : null,
          ]}
        />
        <div className={`mt-2 text-[14px] font-semibold ${paid ? "text-ink" : "text-mist"}`}>{salaryText(o)}</div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-mist">
          <span>{ago(o.postedAt)}</span>
          {soon && (
            <span className="inline-flex items-center gap-1 font-semibold text-sky">
              <Clock size={12} /> {soon}
            </span>
          )}
          {state === "closed" && <span className="font-semibold">{t("jobs.state.closed")}</span>}
          {state === "expired" && <span className="font-semibold">{t("jobs.state.expired")}</span>}
          {o.demo && <DemoTag sample />}
        </div>
      </div>
    </a>
  );
}
