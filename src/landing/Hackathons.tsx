import { Calendar, Globe, MapPin, Users } from "lucide-react";
import { api, statusLabel } from "../api";
import { useApi } from "../api/hooks";
import { Countdown } from "../components/Countdown";
import { GlitchText } from "../components/GlitchText";
import { when } from "../components/form";
import { Pill, Reveal, btn } from "../components/ui";

/* Landing section for upcoming events. Reads the same events admins edit, so a
   change in the admin event editor shows up here and in the countdown at once. */
export function Hackathons({ onOpen }: { onOpen: (eventId?: string) => void }) {
  const list = useApi(() => api.hackathons.list(), []);
  const upcoming = (list.data ?? []).filter((h) => !["finished", "cancelled"].includes(h.status));
  const [next, ...rest] = upcoming;

  return (
    <section id="hackathons" className="relative overflow-hidden bg-blue text-white">
      <div className="dots pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" style={{ filter: "invert(1)" }} />
      <div className="relative mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-36">
        <Reveal>
          <h2 className="max-w-[18ch] font-glitch text-[clamp(32px,4.4vw,58px)] font-normal tracking-normal">
            <GlitchText text="Next Lumora hackathon" />
          </h2>
        </Reveal>
        {!next ? (
          <p className="mt-10 max-w-[48ch] text-[15px] text-white/80">{list.loading ? "Loading events" : "The next round is being planned. Check back soon."}</p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-[1.3fr_1fr]">
            <Reveal className="rounded-3xl bg-surface p-7 text-ink shadow-2xl md:p-9">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="blue">{next.organizerName}</Pill>
                <Pill tone="tint">{statusLabel(next.status)}</Pill>
              </div>
              <h3 className="mt-5 text-[clamp(24px,3vw,36px)]">{next.title}</h3>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-mist">
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} /> {when(next.start)}
                </span>
                <span className="flex items-center gap-1.5">
                  {next.mode === "online" ? <Globe size={15} /> : <MapPin size={15} />} {next.mode === "online" ? "Online" : next.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={15} /> Teams of {next.teamMin} to {next.teamMax}
                </span>
              </div>
              <p className="mt-4 max-w-[52ch] text-[14px] text-mist">{next.short}</p>
              <div className="mt-6">
                <Countdown to={next.start} />
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button onClick={() => onOpen(next.id)} className={btn.primary}>
                  {next.status === "registration_open" ? "Register a team" : "See the event"}
                </button>
                <span className="text-[13px] text-mist">
                  {next.places.length} winning places. 1st: {next.places[0]?.prize}
                </span>
              </div>
            </Reveal>
            <div className="flex flex-col gap-3">
              {rest.slice(0, 4).map((h, i) => {
                const d = new Date(h.start);
                return (
                  <Reveal key={h.id} delay={0.1 + i * 0.08}>
                    <button
                      onClick={() => onOpen(h.id)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 text-left transition-colors hover:bg-white/15"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 text-center text-[12px] font-semibold leading-tight">
                        {d.getDate()}
                        <br />
                        {d.toLocaleDateString("en-GB", { month: "short" })}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{h.title}</div>
                        <div className="text-[12px] text-white/75">
                          {h.mode === "online" ? "Online" : h.city}, {statusLabel(h.status).toLowerCase()}
                          {h.organizerId !== "lumora" ? ", partner event" : ""}
                        </div>
                      </div>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
