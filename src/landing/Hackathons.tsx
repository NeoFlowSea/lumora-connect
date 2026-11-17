import { Calendar, MapPin, Users } from "lucide-react";
import { hackathons } from "../data";
import { Countdown } from "../components/Countdown";
import { Pill, Reveal, btn } from "../components/ui";

export function Hackathons({ onOpenApp }: { onOpenApp: () => void }) {
  const [next, ...rest] = hackathons;
  return (
    <section id="hackathons" className="relative overflow-hidden bg-blue text-white">
      <div className="dots pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" style={{ filter: "invert(1)" }} />
      <div className="relative mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-36">
        <Reveal>
          <h2 className="max-w-[18ch] text-[clamp(28px,3.6vw,46px)]">Next Lumora hackathon</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <Reveal className="rounded-3xl bg-surface p-7 text-ink shadow-2xl md:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="blue">{next.org}</Pill>
              <Pill tone="tint">{next.format}</Pill>
            </div>
            <h3 className="mt-5 text-[clamp(24px,3vw,36px)]">{next.name}</h3>
            <div className="mt-4 flex flex-wrap gap-5 text-[14px] text-mist">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} /> {next.dateLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={15} /> {next.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={15} /> {next.teams}
              </span>
            </div>
            <p className="mt-4 max-w-[52ch] text-[15px] text-mist">{next.desc}</p>
            <div className="mt-6">
              <Countdown to={next.date} />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={onOpenApp} className={btn.primary}>
                Register a team
              </button>
              <span className="self-center text-[13px] text-mist">{next.prize}</span>
            </div>
          </Reveal>
          <div className="flex flex-col gap-3">
            {rest.map((h, i) => (
              <Reveal key={h.id} delay={0.1 + i * 0.08}>
                <button
                  onClick={onOpenApp}
                  className="flex w-full items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 text-left transition-colors hover:bg-white/15"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 font-display text-[12px] leading-tight">
                    {h.dateLabel.split(" ")[0]}
                    <br />
                    {h.dateLabel.split(" ")[1].slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{h.name}</div>
                    <div className="text-[13px] text-white/75">
                      {h.city}, {h.format}
                      {h.partner ? ", partner event" : ""}
                    </div>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
