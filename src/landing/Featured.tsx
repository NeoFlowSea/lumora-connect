import { Clock, MapPin } from "lucide-react";
import { locale, t as tr, useLang } from "../i18n";
import { listNow, statsNow, type OpportunityWithCompany } from "../api";
import { useDbTick } from "../api/hooks";
import { ago } from "../components/form";
import { Fade, Monogram, Rise, SampleTag, Section, SectionHead } from "./parts";
import { Stable } from "../i18n/Stable";

/* Six open postings, Wellfound style: role first, company, place, pay up front. */
export function Featured() {
  const { t } = useLang();
  useDbTick();
  const list = listNow().filter((o) => !o.closed && o.company);
  const total = statsNow().openOpportunities;

  return (
    <Section id="jobs">
      <Fade>
        <SectionHead
          title={<Stable k="landing.jobs.title" />}
          lead={<Stable k="landing.jobs.lead" />}
          aside={
            <a href="#/jobs" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-sky underline-offset-4 hover:underline">
              {t("landing.jobs.all", { n: total })}
            </a>
          }
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, 6).map((o, i) => (
            <Rise key={o.id} i={i}>
              <JobCard o={o} />
            </Rise>
          ))}
        </ul>
      </Fade>
    </Section>
  );
}

export function salary(o: Pick<OpportunityWithCompany, "salaryMin" | "salaryMax" | "type">): string {
  const f = new Intl.NumberFormat(locale());
  const { salaryMin: a, salaryMax: b } = o;
  if (a == null && b == null) return o.type === "Event" ? tr("landing.job.free") : tr("landing.job.noPay");
  const sum = a != null && b != null && a !== b ? `${f.format(a)}–${f.format(b)}` : f.format((a ?? b)!);
  return tr("landing.job.perMonth", { sum });
}

function JobCard({ o }: { o: OpportunityWithCompany }) {
  const { t } = useLang();
  const place = o.format === "remote" ? t("common.format.remote") : o.city;
  return (
    <a href={`#/jobs/${o.id}`} className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-sky">
      <div className="flex items-center gap-3">
        <Monogram name={o.company.name} hue={o.company.hue} logo={o.company.logo} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium text-ink">{o.company.name}</div>
          <div className="truncate text-[13px] text-mist">{o.company.industry}</div>
        </div>
        {o.demo && <SampleTag />}
      </div>
      <h3 className="mt-4 line-clamp-2 text-[18px] leading-snug tracking-[-0.01em] group-hover:text-white">{o.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mist">
        <span className="inline-flex items-center gap-1">
          <MapPin size={13} /> {place}
        </span>
        {o.format !== "remote" && <span>{t(`common.format.${o.format}`)}</span>}
        <span>{t(`landing.schedule.${o.schedule}`)}</span>
      </div>
      <div className="mt-4 text-[15px] font-semibold text-ink">{salary(o)}</div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[13px] text-mist">
        <span className="rounded-md bg-tint px-2 py-0.5 font-medium text-sky">{t(`landing.type.${o.type}`)}</span>
        <span className="inline-flex items-center gap-1">
          <Clock size={13} /> {ago(o.postedAt)}
        </span>
      </div>
    </a>
  );
}
