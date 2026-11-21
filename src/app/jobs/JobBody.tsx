import { BadgeCheck, Building2, Clock, MapPin } from "lucide-react";
import type { OpportunityDetail } from "../../api";
import { ago } from "../../components/form";
import { trackLabel, useLang } from "../../i18n";
import { Avatar, DemoTag, Tags } from "../parts/common";
import { Block, Bullets, Dots, Fact } from "./bits";
import { cityLabel, dateText, deadlineSoon, formatLabel, levelLabel, openState, salaryText, scheduleLabel, typeLabel } from "./format";

/* The content of a posting: header, key facts and sections. Used on the job page
   and, more compact, in the preview pane of the jobs list. */
export function JobBody({ o, compact = false }: { o: OpportunityDetail; compact?: boolean }) {
  const { t, tp } = useLang();
  const state = openState(o);
  const soon = state === "open" ? deadlineSoon(o.deadline) : null;
  const c = o.company;
  const isEvent = o.type === "Event";

  return (
    <article className="grid gap-7">
      <header className="grid gap-4">
        <div className="flex items-start gap-4">
          <a href={`#/company/${c.id}`} className="shrink-0" aria-label={c.name}>
            <Avatar name={c.name} src={c.logo} size={compact ? 52 : 64} shape="square" />
          </a>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-tint px-2 py-0.5 text-[12px] font-semibold text-sky">{typeLabel(o.type)}</span>
              {o.cats.map((x) => (
                <span key={x} className="rounded-md border border-line px-2 py-0.5 text-[12px] text-mist">
                  {trackLabel(x)}
                </span>
              ))}
              {o.demo && <DemoTag sample />}
            </div>
            {compact ? (
              <h2 className="mt-2 text-[22px] leading-tight">{o.title}</h2>
            ) : (
              <h1 className="mt-2 text-[clamp(24px,3.2vw,34px)] leading-tight">{o.title}</h1>
            )}
            <a href={`#/company/${c.id}`} className="mt-1.5 inline-flex min-h-8 items-center gap-1 text-[15px] font-medium text-ink/90 hover:text-sky">
              {c.name}
              {c.verified && <BadgeCheck size={15} className="text-sky" aria-label={t("common.status.verified")} />}
            </a>
            <Dots
              className="mt-1 text-[14px] text-mist"
              parts={[
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {cityLabel(o.city)}
                </span>,
                o.city !== "Remote" ? formatLabel(o.format) : null,
                scheduleLabel(o.schedule),
                o.level !== "any" ? levelLabel(o.level) : null,
              ]}
            />
          </div>
        </div>

        {state !== "open" && (
          <div className="rounded-lg border border-line bg-paper/50 px-4 py-3 text-[14px] text-mist">
            {state === "closed" ? t("jobs.apply.closedReason") : state === "expired" ? t("jobs.apply.expiredReason") : t("jobs.apply.hiddenReason")}
          </div>
        )}

        <div className={`grid grid-cols-2 gap-2 ${compact ? "" : "md:grid-cols-3"}`}>
          <Fact label={isEvent ? t("jobs.fact.entry") : t("jobs.fact.salary")} strong>
            {salaryText(o)}
          </Fact>
          {o.deadline && (
            <Fact label={t("jobs.fact.deadline")}>
              <span className="block">{dateText(o.deadline)}</span>
              {soon && (
                <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-semibold text-sky">
                  <Clock size={12} /> {soon}
                </span>
              )}
            </Fact>
          )}
          <Fact label={isEvent ? t("jobs.fact.seats") : t("jobs.fact.openings")}>{tp("jobs.fact.openingsN", o.openings)}</Fact>
          {o.dur && <Fact label={t("jobs.fact.duration")}>{o.dur}</Fact>}
          <Fact label={t("jobs.fact.posted")}>{ago(o.postedAt)}</Fact>
          {o.applicants > 0 && !isEvent && <Fact label={t("jobs.fact.applicants")}>{tp("jobs.fact.applicantsN", o.applicants)}</Fact>}
        </div>
      </header>

      {o.desc && (
        <Block title={isEvent ? t("jobs.section.aboutEvent") : t("jobs.section.about")}>
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{o.desc}</p>
        </Block>
      )}
      {o.responsibilities.length > 0 && (
        <Block title={t("jobs.section.responsibilities")}>
          <Bullets items={o.responsibilities} />
        </Block>
      )}
      {o.req.length > 0 && (
        <Block title={t("jobs.section.requirements")}>
          <Bullets items={o.req} />
        </Block>
      )}
      {o.niceToHave.length > 0 && (
        <Block title={t("jobs.section.nice")}>
          <Bullets items={o.niceToHave} />
        </Block>
      )}
      {o.perks.length > 0 && (
        <Block title={t("jobs.section.perks")}>
          <Bullets items={o.perks} />
        </Block>
      )}
      {o.questions.length > 0 && !compact && (
        <Block title={t("jobs.section.questions")}>
          <ol className="grid gap-2 text-[15px] leading-relaxed text-mist">
            {o.questions.map((q, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-5 shrink-0 font-semibold tabular-nums text-sky">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </Block>
      )}

      <section className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center gap-3">
          <Avatar name={c.name} src={c.logo} size={40} shape="square" />
          <div className="min-w-0">
            <h2 className="text-[16px]">{t("jobs.section.company", { name: c.name })}</h2>
            <p className="text-[13px] text-mist">
              {[c.industry, c.city, c.size].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
        {(c.about || c.tagline) && <p className="mt-3 line-clamp-4 text-[14px] leading-relaxed text-mist">{c.about || c.tagline}</p>}
        {c.tags.length > 0 && (
          <div className="mt-3">
            <Tags items={c.tags} />
          </div>
        )}
        <a href={`#/company/${c.id}`} className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-sky hover:underline">
          <Building2 size={15} /> {t("jobs.section.companyLink")}
        </a>
      </section>
    </article>
  );
}
