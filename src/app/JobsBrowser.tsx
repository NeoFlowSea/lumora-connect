/* Searchable list of opportunities with filters, used at #/jobs and in the talent app tab. Owned by the jobs agent (dict: jobs). */
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Briefcase, Search, SlidersHorizontal, X } from "lucide-react";
import { api, type OpportunityWithCompany } from "../api";
import { useApi, useSession } from "../api/hooks";
import type { ApplicationStatus, OpportunityLevel, OpportunityType, WorkFormat } from "../api/types";
import { categories } from "../data";
import { Empty, ErrorNote, Select, Skeleton, Toggle } from "../components/form";
import { btn } from "../components/ui";
import { trackLabel, useLang } from "../i18n";
import { useRoute } from "../lib/router";
import { ApplyBox } from "./jobs/Apply";
import { PageWrap, useMedia } from "./jobs/bits";
import { JobBody } from "./jobs/JobBody";
import { JobCard } from "./jobs/JobCard";
import { FORMATS, LEVELS, TYPES, formatLabel, isPaid, levelLabel, openState, salarySortValue, typeLabel } from "./jobs/format";

type Sort = "new" | "salary";
type Filters = { q: string; track: string; type: string; level: string; format: string; city: string; paid: boolean; sort: Sort };

const EMPTY: Filters = { q: "", track: "", type: "", level: "", format: "", city: "", paid: false, sort: "new" };

function fromQuery(q: Record<string, string>): Filters {
  return {
    q: q.q ?? "",
    track: q.track ?? "",
    type: TYPES.includes(q.type as OpportunityType) ? q.type : "",
    level: LEVELS.includes(q.level as OpportunityLevel) ? q.level : "",
    format: FORMATS.includes(q.format as WorkFormat) ? q.format : "",
    city: q.city ?? "",
    paid: q.paid === "1",
    sort: q.sort === "salary" ? "salary" : "new",
  };
}

/** keep the filters in the address so a search can be shared; replaceState does not fire hashchange */
function writeQuery(f: Filters) {
  const base = (window.location.hash || "#/jobs").split("?")[0];
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.track) p.set("track", f.track);
  if (f.type) p.set("type", f.type);
  if (f.level) p.set("level", f.level);
  if (f.format) p.set("format", f.format);
  if (f.city) p.set("city", f.city);
  if (f.paid) p.set("paid", "1");
  if (f.sort !== "new") p.set("sort", f.sort);
  const qs = p.toString();
  const next = qs ? `${base}?${qs}` : base;
  if (next !== window.location.hash) window.history.replaceState(window.history.state, "", next);
}

function matches(o: OpportunityWithCompany, f: Filters, skip?: keyof Filters) {
  const s = f.q.trim().toLowerCase();
  if (s) {
    const hay = [o.title, o.company.name, o.city, o.cats.join(" "), o.req.join(" "), o.niceToHave.join(" "), o.company.tags.join(" "), o.company.industry]
      .join(" ")
      .toLowerCase();
    if (!s.split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  if (skip !== "track" && f.track && !o.cats.includes(f.track)) return false;
  if (f.type && o.type !== f.type) return false;
  if (f.level && o.level !== f.level) return false;
  if (f.format && o.format !== f.format) return false;
  if (f.city && o.city !== f.city) return false;
  if (f.paid && !isPaid(o)) return false;
  return true;
}

export function JobsBrowser() {
  const { t, tp } = useLang();
  const user = useSession();
  const route = useRoute();
  const wide = useMedia("(min-width: 1024px)");
  const list = useApi(() => api.opportunities.list(), []);
  const mine = useApi(() => (user?.kind === "talent" ? api.opportunities.myApplications() : Promise.resolve([])), [user?.id]);
  const [f, setF] = useState<Filters>(() => fromQuery(route.query));
  const [sel, setSel] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // links like #/jobs?track=Frontend from the landing page change the query while this screen is open
  const qs = JSON.stringify(route.query);
  useEffect(() => {
    setF(fromQuery(route.query));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);
  useEffect(() => {
    writeQuery(f);
  }, [f]);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((x) => ({ ...x, [k]: v }));

  const statusBy = useMemo(() => {
    const m: Record<string, ApplicationStatus> = {};
    for (const a of mine.data ?? []) m[a.opportunityId] = a.status;
    return m;
  }, [mine.data]);

  const all = list.data ?? [];
  const cities = useMemo(() => [...new Set(all.map((o) => o.city).filter((c) => c !== "Remote"))].sort(), [all]);

  const results = useMemo(() => {
    const r = all.filter((o) => matches(o, f));
    const open = (o: OpportunityWithCompany) => (openState(o) === "open" ? 1 : 0);
    return r.sort((a, b) =>
      f.sort === "salary"
        ? open(b) - open(a) || salarySortValue(b) - salarySortValue(a) || b.postedAt.localeCompare(a.postedAt)
        : open(b) - open(a) || b.postedAt.localeCompare(a.postedAt),
    );
  }, [all, f]);

  const trackCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of all) if (matches(o, f, "track")) for (const c of o.cats) m[c] = (m[c] ?? 0) + 1;
    return m;
  }, [all, f]);
  const trackTotal = useMemo(() => all.filter((o) => matches(o, f, "track")).length, [all, f]);

  const active = [f.type, f.level, f.format, f.city].filter(Boolean).length + (f.paid ? 1 : 0);
  const anyFilter = active > 0 || !!f.q.trim() || !!f.track;
  const selected = wide ? (results.find((o) => o.id === sel) ?? results[0]) : undefined;

  function pick(e: MouseEvent<HTMLAnchorElement>, id: string) {
    if (!wide || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setSel(id);
  }

  const chip = (on: boolean) =>
    `inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors ${
      on ? "border-sky bg-tint text-ink" : "border-line text-mist hover:border-sky/60 hover:text-ink"
    }`;

  return (
    <PageWrap>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-[clamp(26px,3.2vw,36px)]">{t("jobs.browser.title")}</h1>
          <p className="mt-1 max-w-[60ch] text-[14px] text-mist">{t("jobs.browser.lead")}</p>
        </div>
      </div>

      {/* search and sort */}
      <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
        <label className="flex min-h-12 items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 focus-within:border-sky">
          <Search size={18} className="shrink-0 text-mist" />
          <span className="sr-only">{t("common.action.search")}</span>
          <input
            type="search"
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder={t("jobs.browser.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-mist/80"
          />
          {f.q && (
            <button onClick={() => set("q", "")} aria-label={t("jobs.browser.clearSearch")} className="grid h-9 w-9 place-items-center rounded-lg text-mist hover:text-ink">
              <X size={16} />
            </button>
          )}
        </label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 md:grid-cols-1">
          <Select
            aria-label={t("jobs.browser.sort")}
            value={f.sort}
            onChange={(e) => set("sort", e.target.value as Sort)}
            options={[
              { value: "new", label: t("jobs.browser.sortNew") },
              { value: "salary", label: t("jobs.browser.sortSalary") },
            ]}
          />
          <button onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} className={`${btn.ghost} px-4 md:hidden`}>
            <SlidersHorizontal size={16} /> {t("jobs.browser.filters")}
            {active > 0 && <span className="rounded-md bg-accent px-1.5 text-[12px] font-semibold text-paper">{active}</span>}
          </button>
        </div>
      </div>

      {/* tracks */}
      <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button onClick={() => set("track", "")} className={chip(!f.track)} aria-pressed={!f.track}>
          {t("jobs.browser.allTracks")} <span className="tabular-nums text-mist">{trackTotal}</span>
        </button>
        {categories.map((c) => (
          <button key={c.name} onClick={() => set("track", f.track === c.name ? "" : c.name)} className={chip(f.track === c.name)} aria-pressed={f.track === c.name}>
            {trackLabel(c.name)} <span className="tabular-nums text-mist">{trackCounts[c.name] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* other filters: always visible from tablet up, behind a button on phones */}
      <div className={`${showFilters ? "grid" : "hidden"} mt-3 grid-cols-2 gap-3 rounded-xl border border-line bg-surface/60 p-3 md:grid md:grid-cols-[repeat(4,minmax(0,1fr))_auto] md:border-0 md:bg-transparent md:p-0`}>
        <Select
          aria-label={t("jobs.filter.type")}
          value={f.type}
          onChange={(e) => set("type", e.target.value)}
          options={[{ value: "", label: t("jobs.filter.anyType") }, ...TYPES.map((x) => ({ value: x, label: typeLabel(x) }))]}
        />
        <Select
          aria-label={t("jobs.filter.level")}
          value={f.level}
          onChange={(e) => set("level", e.target.value)}
          options={[{ value: "", label: t("jobs.filter.anyLevel") }, ...LEVELS.map((x) => ({ value: x, label: levelLabel(x) }))]}
        />
        <Select
          aria-label={t("jobs.filter.format")}
          value={f.format}
          onChange={(e) => set("format", e.target.value)}
          options={[{ value: "", label: t("jobs.filter.anyFormat") }, ...FORMATS.map((x) => ({ value: x, label: formatLabel(x) }))]}
        />
        <Select
          aria-label={t("jobs.filter.city")}
          value={f.city}
          onChange={(e) => set("city", e.target.value)}
          options={[{ value: "", label: t("jobs.filter.anyCity") }, ...cities.map((c) => ({ value: c, label: c }))]}
        />
        <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-1">
          <Toggle checked={f.paid} onChange={(v) => set("paid", v)} label={t("jobs.filter.paid")} />
        </div>
      </div>

      <div className="mt-5 flex min-h-9 flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] text-mist" aria-live="polite">
          {list.data ? tp("jobs.browser.results", results.length) : t("common.state.loading")}
        </p>
        {anyFilter && (
          <button onClick={() => setF({ ...EMPTY, sort: f.sort })} className="min-h-9 rounded-lg px-2 text-[13px] font-semibold text-sky hover:underline">
            {t("common.action.clearFilters")}
          </button>
        )}
      </div>

      <div className="mt-3">
        {list.loading && !list.data ? (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <Skeleton rows={4} className="h-36" />
            <Skeleton rows={1} className="hidden h-[480px] lg:block" />
          </div>
        ) : list.error ? (
          <ErrorNote>{list.error}</ErrorNote>
        ) : results.length === 0 ? (
          <Empty
            icon={<Briefcase size={22} />}
            title={t("jobs.browser.emptyTitle")}
            text={t("jobs.browser.emptyText")}
            action={
              <button onClick={() => setF(EMPTY)} className={btn.ghost}>
                {t("common.action.clearFilters")}
              </button>
            }
          />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <ul className="grid gap-3">
              {results.map((o) => (
                <li key={o.id}>
                  <JobCard o={o} status={statusBy[o.id]} selected={selected?.id === o.id} onSelect={(e) => pick(e, o.id)} />
                </li>
              ))}
            </ul>
            {wide && selected && <Preview id={selected.id} />}
          </div>
        )}
      </div>
    </PageWrap>
  );
}

/* right-hand detail on desktop */
function Preview({ id }: { id: string }) {
  const { t } = useLang();
  const q = useApi(() => api.opportunities.get(id), [id]);
  const o = q.data && q.data.id === id ? q.data : undefined;
  return (
    <aside className="sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto rounded-xl border border-line bg-surface" aria-label={t("jobs.browser.preview")}>
      {!o ? (
        <div className="p-6">
          <Skeleton rows={3} className="h-28" />
        </div>
      ) : (
        <>
          <div className="p-6">
            <JobBody o={o} compact />
          </div>
          <div className="sticky bottom-0 grid gap-3 border-t border-line bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <ApplyBox key={o.id} o={o} variant="bar" />
            <a href={`#/jobs/${o.id}`} className={btn.ghost}>
              {t("jobs.browser.openPage")}
            </a>
          </div>
        </>
      )}
    </aside>
  );
}
