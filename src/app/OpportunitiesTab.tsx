import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, MapPin, Search } from "lucide-react";
import { categories, opportunities, type Opportunity } from "../data";
import { actions, useStore } from "../lib/store";
import { Modal, Pill, btn, ease, useToast } from "../components/ui";

const types = ["All", "Internship", "Work program", "Position", "Event"] as const;
const tone: Record<string, "blue" | "tint" | "line" | "good"> = {
  Internship: "blue",
  "Work program": "tint",
  Position: "good",
  Event: "line",
};

export function OpportunitiesTab() {
  const { role, applied } = useStore();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof types)[number]>("All");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<Opportunity | null>(null);
  const [post, setPost] = useState(false);

  const list = useMemo(
    () =>
      opportunities.filter(
        (o) =>
          (type === "All" || o.type === type) &&
          (!cat || o.cats.includes(cat)) &&
          (!q || (o.title + o.co + o.city + o.desc).toLowerCase().includes(q.toLowerCase())),
      ),
    [q, type, cat],
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(26px,3vw,36px)]">Opportunities and internships</h1>
          <p className="mt-1 text-[14px] text-mist">Internships, work programs, positions and events from companies on Lumora Connect.</p>
        </div>
        {role === "company" && (
          <button onClick={() => setPost(true)} className={btn.primary}>
            Post an opportunity
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-[14px] focus-within:border-sky">
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
        <button onClick={() => setCat("")} className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-semibold ${!cat ? "border-blue bg-tint text-sky" : "border-line bg-surface text-mist"}`}>
          All tracks
        </button>
        {categories.map((c) => (
          <button
            key={c.name}
            onClick={() => setCat(cat === c.name ? "" : c.name)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-semibold ${cat === c.name ? "border-blue bg-tint text-sky" : "border-line bg-surface text-mist"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((o, i) => {
          const done = applied.includes(o.id);
          return (
            <motion.button
              key={o.id}
              onClick={() => setOpen(o)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: i * 0.03 }}
              className="flex flex-col rounded-3xl border border-line bg-surface p-5 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-sky hover:shadow-[0_20px_40px_-28px_rgba(26,75,168,0.5)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue font-display text-[13px] text-white">{o.co[0]}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] text-mist">{o.co}</span>
                  <span className="flex items-center gap-1 text-[12px] text-mist">
                    <MapPin size={11} /> {o.city}
                  </span>
                </span>
                <span className="ml-auto">
                  <Pill tone={tone[o.type]}>{o.type}</Pill>
                </span>
              </div>
              <h3 className="mt-4 text-[18px]">{o.title}</h3>
              <p className="mt-2 line-clamp-2 text-[14px] text-mist">{o.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {o.cats.map((c) => (
                  <span key={c} className="rounded-md bg-tint px-2 py-0.5 text-[12px] font-semibold text-sky">
                    {c}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between pt-5 text-[13px] text-mist">
                <span>{o.pay}</span>
                {done ? (
                  <span className="flex items-center gap-1 font-semibold text-good">
                    <Check size={14} /> Applied
                  </span>
                ) : (
                  <span>{o.posted}</span>
                )}
              </div>
            </motion.button>
          );
        })}
        {list.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-line p-10 text-center text-mist">Nothing matches. Try another track or type.</div>
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
            <h2 className="mt-4 text-[26px]">{open.title}</h2>
            <p className="mt-1 text-[14px] text-mist">
              {open.co}, {open.city}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["When", open.dur],
                ["Compensation", open.pay],
                ["Posted", open.posted],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-cloud p-3">
                  <div className="text-[12px] text-mist">{k}</div>
                  <div className="mt-0.5 text-[14px] font-semibold">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[15px] leading-relaxed">{open.desc}</p>
            <h3 className="mt-5 text-[15px]">Requirements</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-mist">
              {open.req.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              {role === "company" ? (
                <button onClick={() => setOpen(null)} className={btn.ghost}>
                  Close
                </button>
              ) : applied.includes(open.id) ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#E3F4EA] px-5 py-3 text-[15px] font-semibold text-good">
                  <Check size={16} /> {open.type === "Event" ? "Registered" : "Applied with your profile"}
                </span>
              ) : (
                <button
                  onClick={() => {
                    actions.apply(open.id);
                    toast(open.type === "Event" ? "Registered" : "Application sent");
                  }}
                  className={btn.primary}
                >
                  {open.type === "Event" ? "Register" : "Apply with my profile"}
                </button>
              )}
              <button onClick={() => setOpen(null)} className={btn.ghost}>
                Back
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={post} onClose={() => setPost(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPost(false);
            toast("Published. It appears in Opportunities now (preview).");
          }}
          className="grid gap-4"
        >
          <h2 className="text-[24px]">Post an opportunity</h2>
          {[
            ["Title", "Frontend intern (React)"],
            ["City or format", "Tashkent, hybrid"],
            ["Duration", "8 weeks from 1 Dec"],
            ["Compensation", "2,000,000 UZS per month"],
          ].map(([l, ph]) => (
            <label key={l} className="grid gap-1 text-[13px] font-semibold text-mist">
              {l}
              <input required placeholder={ph} className="rounded-xl border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-sky" />
            </label>
          ))}
          <label className="grid gap-1 text-[13px] font-semibold text-mist">
            Description
            <textarea rows={3} className="rounded-xl border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-sky" />
          </label>
          <div className="flex gap-3">
            <button type="submit" className={btn.primary}>
              Publish
            </button>
            <button type="button" onClick={() => setPost(false)} className={btn.ghost}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
