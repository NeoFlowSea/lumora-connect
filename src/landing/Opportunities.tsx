import { opportunities } from "../data";
import { Pill, Reveal } from "../components/ui";

const tone: Record<string, "blue" | "tint" | "line" | "good"> = {
  Internship: "blue",
  "Work program": "tint",
  Position: "good",
  Event: "line",
};

export function Opportunities({ onOpenApp }: { onOpenApp: () => void }) {
  return (
    <section id="opportunities" className="border-t border-line">
      <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-20 md:px-8 md:pb-36 md:pt-28">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[16ch] text-[clamp(28px,3.6vw,46px)]">Open this week</h2>
          <button onClick={onOpenApp} className="text-[15px] font-semibold text-sky underline-offset-4 hover:underline">
            See all 38 opportunities
          </button>
        </Reveal>
        <ul className="divide-y divide-line border-y border-line">
          {opportunities.slice(0, 6).map((o, i) => (
            <Reveal key={o.id} delay={i * 0.05} y={12}>
              <li>
                <button
                  onClick={onOpenApp}
                  className="group grid w-full grid-cols-[44px_1fr_auto] items-center gap-4 py-5 text-left transition-colors hover:bg-cloud md:grid-cols-[52px_1.4fr_1fr_1fr_auto] md:gap-6 md:px-4"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue font-display text-[13px] text-white md:h-13 md:w-13">
                    {o.co[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold leading-snug md:truncate md:text-[18px]">{o.title}</div>
                    <div className="text-[13px] text-mist">{o.co}</div>
                  </div>
                  <div className="hidden text-[14px] text-mist md:block">{o.city}</div>
                  <div className="hidden text-[14px] text-mist md:block">{o.pay}</div>
                  <div className="flex items-center gap-3">
                    <Pill tone={tone[o.type]}>{o.type}</Pill>
                    <span className="hidden rounded-full border border-line px-4 py-1.5 text-[13px] font-semibold transition-colors group-hover:border-blue group-hover:bg-blue group-hover:text-white md:inline-block">
                      {o.type === "Event" ? "Register" : "Apply"}
                    </span>
                  </div>
                </button>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
