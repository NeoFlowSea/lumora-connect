import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Check, MapPin, Trophy, Users } from "lucide-react";
import { hackathons, pastHackathons, type Hackathon } from "../data";
import { actions, useStore } from "../lib/store";
import { Countdown } from "../components/Countdown";
import { Modal, Pill, btn, ease, useToast } from "../components/ui";

export function HackathonsTab() {
  const { role, registered } = useStore();
  const toast = useToast();
  const [form, setForm] = useState<Hackathon | null>(null);
  const [sent, setSent] = useState(false);
  const [next, ...rest] = hackathons;

  function openForm(h: Hackathon) {
    setSent(false);
    setForm(h);
  }

  return (
    <div>
      <h1 className="text-[clamp(26px,3vw,36px)]">Lumora hackathons</h1>
      <p className="mt-1 text-[14px] text-mist">IT case competitions by Lumora and partner events. Register a team or go solo.</p>

      {/* next event */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="dots mt-6 overflow-hidden rounded-3xl bg-blue p-7 text-white md:p-9"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)" }}
      >
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-blue">Next up</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold">{next.format}</span>
            </div>
            <h2 className="mt-4 text-[clamp(24px,3vw,36px)]">{next.name}</h2>
            <div className="mt-3 flex flex-wrap gap-5 text-[14px] text-white/85">
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
            <p className="mt-4 max-w-[56ch] text-[15px] text-white/85">{next.desc}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {next.tracks.map((t) => (
                <span key={t} className="rounded-md bg-white/15 px-2 py-0.5 text-[12px] font-semibold">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <Countdown to={next.date} dark />
            <div className="mt-5 flex flex-wrap gap-3">
              {role === "company" ? (
                <button onClick={() => toast("Thanks. The Lumora team will contact you about a case.")} className="rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-blue hover:bg-tint">
                  Sponsor a case
                </button>
              ) : registered.includes(next.id) ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-good">
                  <Check size={16} /> You're registered
                </span>
              ) : (
                <button onClick={() => openForm(next)} className="rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-blue hover:bg-tint">
                  Register a team
                </button>
              )}
              <span className="self-center text-[13px] text-white/80">{next.prize}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* upcoming */}
      <h2 className="mt-12 text-[20px]">Upcoming</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {rest.map((h, i) => {
          const done = registered.includes(h.id);
          return (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.1 + i * 0.06 }}
              className="flex flex-col rounded-3xl border border-line bg-white p-5"
            >
              <div className="flex items-center gap-2">
                <Pill tone={h.partner ? "line" : "blue"}>{h.org}</Pill>
                {h.partner && <Pill tone="tint">Partner event</Pill>}
              </div>
              <h3 className="mt-4 text-[18px]">{h.name}</h3>
              <div className="mt-2 text-[13px] text-mist">
                {h.dateLabel}. {h.city}, {h.format.toLowerCase()}.
              </div>
              <p className="mt-3 text-[14px] text-mist">{h.desc}</p>
              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="text-[12px] text-mist">{h.teams}</span>
                {role === "company" ? (
                  <button onClick={() => toast("Request sent to the organizers.")} className={`${btn.sm} border border-line hover:bg-cloud`}>
                    Sponsor
                  </button>
                ) : done ? (
                  <span className="flex items-center gap-1 text-[13px] font-semibold text-good">
                    <Check size={14} /> Registered
                  </span>
                ) : (
                  <button onClick={() => openForm(h)} className={`${btn.sm} bg-blue text-white hover:bg-blue-deep`}>
                    Register
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* past */}
      <h2 className="mt-12 text-[20px]">This season so far</h2>
      <ul className="mt-4 divide-y divide-line rounded-3xl border border-line bg-white">
        {pastHackathons.map((p) => (
          <li key={p.name} className="grid grid-cols-[40px_1fr_auto] items-center gap-4 px-5 py-4 md:grid-cols-[40px_1.2fr_1fr_auto]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-tint text-blue">
              <Trophy size={18} />
            </span>
            <span>
              <span className="block text-[15px] font-semibold">{p.name}</span>
              <span className="block text-[13px] text-mist">{p.city}</span>
            </span>
            <span className="hidden text-[14px] text-mist md:block">Winner: {p.winner}</span>
            <span className="text-[13px] text-mist">{p.teams} teams</span>
          </li>
        ))}
      </ul>

      <Modal open={!!form} onClose={() => setForm(null)}>
        {form && !sent && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              actions.register(form.id);
              setSent(true);
            }}
            className="grid gap-4"
          >
            <h2 className="text-[24px]">Register for {form.name}</h2>
            <p className="text-[14px] text-mist">
              {form.dateLabel}, {form.city}. {form.teams}.
            </p>
            <label className="grid gap-1 text-[13px] font-semibold text-mist">
              Team name
              <input required placeholder="Night Owls" className="rounded-xl border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-sky" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-[13px] font-semibold text-mist">
                Track
                <select className="rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-sky">
                  {form.tracks.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-[13px] font-semibold text-mist">
                Team size
                <input type="number" min={1} max={6} defaultValue={3} className="rounded-xl border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-sky" />
              </label>
            </div>
            <label className="grid gap-1 text-[13px] font-semibold text-mist">
              Telegram for the team lead
              <input required placeholder="@username" className="rounded-xl border border-line px-3 py-2.5 text-[15px] font-normal text-ink outline-none focus:border-sky" />
            </label>
            <div className="flex gap-3">
              <button type="submit" className={btn.primary}>
                Confirm registration
              </button>
              <button type="button" onClick={() => setForm(null)} className={btn.ghost}>
                Cancel
              </button>
            </div>
          </form>
        )}
        {form && sent && (
          <div className="text-center">
            <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#E3F4EA] text-good">
              <Check size={36} />
            </motion.div>
            <h2 className="mt-6 text-[26px]">You're in</h2>
            <p className="mt-2 text-[15px] text-mist">
              {form.name}, {form.dateLabel}. The organizers will message your team lead on Telegram with the case and schedule.
            </p>
            <button onClick={() => setForm(null)} className={`${btn.primary} mt-6`}>
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
