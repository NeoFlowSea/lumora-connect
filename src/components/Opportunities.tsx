import { opportunities } from "../data";

const typeStyle: Record<string, string> = {
  Internship: "bg-royal text-snow",
  "Work program": "bg-navy text-ice",
  Position: "bg-snow/10 text-snow",
  Event: "border border-line text-mist",
};

export function Opportunities() {
  return (
    <section id="opportunities" className="border-t border-line">
      <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-20 md:px-8 md:pb-36 md:pt-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[16ch] text-[clamp(28px,3.6vw,46px)]">Open this week</h2>
          <a href="#join" className="text-[15px] font-semibold text-ice underline-offset-4 hover:underline">
            See all 38 opportunities
          </a>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {opportunities.map((o) => (
            <li key={o.title}>
              <a
                href="#join"
                className="group grid grid-cols-[44px_1fr_auto] items-center gap-4 py-5 transition-colors hover:bg-snow/[0.03] md:grid-cols-[52px_1.4fr_1fr_1fr_auto] md:gap-6 md:px-4"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-navy font-display text-[13px] text-snow md:h-13 md:w-13">
                  {o.co[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold leading-snug md:truncate md:text-[18px]">{o.title}</div>
                  <div className="text-[13px] text-mist">{o.co}</div>
                </div>
                <div className="hidden text-[14px] text-mist md:block">{o.city}</div>
                <div className="hidden text-[14px] text-mist md:block">{o.pay}</div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${typeStyle[o.type]}`}>{o.type}</span>
                  <span className="hidden rounded-full border border-line px-4 py-1.5 text-[13px] font-semibold transition-colors group-hover:border-ice/40 group-hover:bg-snow group-hover:text-ink md:inline-block">
                    {o.type === "Event" ? "Register" : "Apply"}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
