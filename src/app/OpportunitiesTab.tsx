import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Briefcase, Check, MapPin, Search } from "lucide-react";
import { api, type OpportunityWithCompany } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { ApplicationStatus } from "../api/types";
import { categories } from "../data";
import { Empty, ErrorNote, Skeleton, Spinner, ago } from "../components/form";
import { Modal, Pill, btn, ease, useToast } from "../components/ui";

const types = ["All", "Internship", "Work program", "Position", "Event"] as const;
const tone: Record<string, "blue" | "tint" | "line" | "good"> = {
  Internship: "blue",
  "Work program": "tint",
  Position: "good",
  Event: "line",
};
const statusText: Record<ApplicationStatus, string> = {
  pending: "Applied, waiting for the company",
  shortlisted: "You're shortlisted",
  accepted: "Accepted",
  rejected: "Not selected this time",
};

export function OpportunitiesTab() {
  const user = useSession();
  const toast = useToast();
  const list = useApi(() => api.opportunities.list(), []);
  const mine = useApi(() => (user?.kind === "talent" ? api.opportunities.myApplications() : Promise.resolve([])), [user?.id]);
  const apply = useAction(api.opportunities.apply);
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof types)[number]>("All");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<OpportunityWithCompany | null>(null);

  const appliedBy = useMemo(() => {
    const m: Record<string, ApplicationStatus> = {};
    for (const a of mine.data ?? []) m[a.opportunityId] = a.status;
    return m;
  }, [mine.data]);

  const filtered = useMemo(
    () =>
      (list.data ?? []).filter(
        (o) =>
          (type === "All" || o.type === type) &&
          (!cat || o.cats.includes(cat)) &&
          (!q || `${o.title} ${o.company.name} ${o.city} ${o.desc}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [list.data, q, type, cat],
  );

  async function doApply(o: OpportunityWithCompany) {
    const r = await apply.run(o.id);
    if (r) toast(o.type === "Event" ? "Registered" : "Application sent");
  }

  return (
    <div>
      <div>
        <h1 className="text-[clamp(26px,3vw,36px)]">Opportunities and internships</h1>
        <p className="mt-1 text-[13px] text-mist">Internships, work programs, positions and events from approved companies.</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-[14px] focus-within:border-sky">
          <Search size={16} className="text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, company, city" className="w-full bg-transparent outline-none placeholder:text-mist" />
        </label>
        <div className="scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`relative shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${type === t ? "text-white" : "text-mist hover:text-ink"}`}
            >
              {type === t && <motion.span layoutId="type-pill" className="absolute inset-0 rounded-full bg-blue" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCat("")} className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${!cat ? "border-blue bg-tint text-sky" : "border-line bg-surface text-mist"}`}>
          All tracks
        </button>
        {categories.map((c) => (
          <button
            key={c.name}
            onClick={() => setCat(cat === c.name ? "" : c.name)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${cat === c.name ? "border-blue bg-tint text-sky" : "border-line bg-surface text-mist"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {list.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton rows={1} className="h-56" />
            <Skeleton rows={1} className="h-56" />
            <Skeleton rows={1} className="h-56" />
          </div>
        ) : list.error ? (
          <ErrorNote>{list.error}</ErrorNote>
        ) : filtered.length === 0 ? (
          <Empty
            icon={<Briefcase size={22} />}
            title="Nothing matches these filters"
            text="Try another track or type, or clear the search."
            action={
              <button
                onClick={() => {
                  setQ("");
                  setType("All");
                  setCat("");
                }}
                className={btn.ghost}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o, i) => {
              const st = appliedBy[o.id];
              return (
                <motion.button
                  key={o.id}
                  onClick={() => setOpen(o)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease, delay: Math.min(i, 8) * 0.03 }}
                  className="flex flex-col rounded-3xl border border-line bg-surface p-5 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-sky"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue font-display text-[13px] text-white">{o.company.name[0]}</span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 truncate text-[13px] text-mist">
                        {o.company.name} {o.company.verified && <BadgeCheck size={13} className="shrink-0 text-sky" />}
                      </span>
                      <span className="flex items-center gap-1 text-[12px] text-mist">
                        <MapPin size={11} /> {o.city}
                      </span>
                    </span>
                    <span className="ml-auto">
                      <Pill tone={tone[o.type]}>{o.type}</Pill>
                    </span>
                  </div>
                  <h3 className="mt-4 text-[17px]">{o.title}</h3>
                  <p className="mt-2 line-clamp-2 text-[13px] text-mist">{o.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {o.cats.map((c) => (
                      <span key={c} className="rounded-md bg-tint px-2 py-0.5 text-[11px] font-semibold text-sky">
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-5 text-[12px] text-mist">
                    <span className="truncate">{o.pay}</span>
                    {st ? (
                      <span className={`flex shrink-0 items-center gap-1 font-semibold ${st === "rejected" ? "text-mist" : "text-good"}`}>
                        <Check size={13} /> {st === "pending" ? "Applied" : st[0].toUpperCase() + st.slice(1)}
                      </span>
                    ) : (
                      <span className="shrink-0">{ago(o.postedAt)}</span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} wide>
        {open && (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={tone[open.type]}>{open.type}</Pill>
              {open.cats.map((c) => (
                <Pill key={c} tone="line">
                  {c}
                </Pill>
              ))}
            </div>
            <h2 className="mt-4 text-[24px]">{open.title}</h2>
            <p className="mt-1 flex items-center gap-1 text-[13px] text-mist">
              {open.company.name} {open.company.verified && <BadgeCheck size={13} className="text-sky" />}, {open.city}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["When", open.dur],
                ["Compensation", open.pay],
                ["Posted", ago(open.postedAt)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-cloud p-3">
                  <div className="text-[11px] text-mist">{k}</div>
                  <div className="mt-0.5 text-[13px] font-semibold">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[14px] leading-relaxed">{open.desc}</p>
            {open.req.length > 0 && (
              <>
                <h3 className="mt-5 text-[14px]">Requirements</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-mist">
                  {open.req.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            )}
            <h3 className="mt-5 text-[14px]">About {open.company.name}</h3>
            <p className="mt-1 text-[13px] text-mist">{open.company.about || open.company.tagline}</p>
            <div className="mt-6 grid gap-3">
              <ErrorNote>{apply.error}</ErrorNote>
              <div className="flex flex-wrap gap-3">
                {appliedBy[open.id] ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-good/15 px-5 py-3 text-[14px] font-semibold text-good">
                    <Check size={16} /> {statusText[appliedBy[open.id]]}
                  </span>
                ) : (
                  <button onClick={() => doApply(open)} disabled={apply.pending} className={btn.primary}>
                    {apply.pending && <Spinner />} {open.type === "Event" ? "Register" : "Apply with my profile"}
                  </button>
                )}
                <button onClick={() => setOpen(null)} className={btn.ghost}>
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
