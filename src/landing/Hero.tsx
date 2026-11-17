import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MapPin, X } from "lucide-react";
import { companies } from "../data";
import { btn, ease, initials } from "../components/ui";

/* A deck that swipes itself: right, left, right... so the idea lands in two seconds. */
function SwipeDemo() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [stamp, setStamp] = useState<0 | 1 | -1>(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let t2 = 0;
    const t1 = setInterval(() => {
      setDir((d) => {
        const nd = d === 1 ? -1 : 1;
        setStamp(nd);
        return nd;
      });
      t2 = window.setTimeout(() => {
        setStamp(0);
        setI((x) => x + 1);
      }, 520);
    }, 2600);
    return () => {
      clearInterval(t1);
      clearTimeout(t2);
    };
  }, []);

  const stack = [0, 1, 2].map((k) => companies[(i + k) % companies.length]);

  return (
    <div className="mx-auto w-[300px] md:w-[330px]">
    <div className="relative h-[420px] md:h-[460px]">
      <AnimatePresence initial={false}>
        {stack
          .slice()
          .reverse()
          .map((c, idx) => {
            const depth = 2 - idx; // 0 = top
            const top = depth === 0;
            return (
              <motion.div
                key={c.id}

                className="absolute inset-0 overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_30px_60px_-30px_rgba(11,31,58,0.35)]"
                initial={{ scale: 0.9, y: 36, opacity: 0 }}
                animate={{ scale: 1 - depth * 0.05, y: depth * 14, opacity: 1, rotate: 0 }}
                exit={{ x: dir * 420, rotate: dir * 18, opacity: 0, transition: { duration: 0.55, ease } }}
                transition={{ duration: 0.5, ease }}
                style={{ zIndex: 10 - depth }}
              >
                <div className="h-[44%] p-5" style={{ background: `linear-gradient(135deg, #3d7bfa, ${c.hue})` }}>
                  <div className="flex items-start justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 font-display text-[15px] text-blue">
                      {initials(c.name)}
                    </div>
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-semibold text-white">{c.industry}</span>
                  </div>
                  <div className="mt-7 font-display text-[22px] leading-tight text-white">{c.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-[13px] text-white/85">
                    <MapPin size={13} /> {c.city}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[14px] text-ink">{c.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.tags.map((t) => (
                      <span key={t} className="rounded-md bg-tint px-2 py-1 text-[12px] font-semibold text-sky">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 text-[13px] text-mist">Hiring: {c.roles.join(", ")}</div>
                </div>
                {top && (
                  <>
                    <motion.div
                      className="absolute left-5 top-5 rotate-[-14deg] rounded-lg border-[3px] border-good px-3 py-1 font-display text-[22px] font-semibold text-good"
                      animate={{ opacity: stamp === 1 ? 1 : 0, scale: stamp === 1 ? 1 : 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      LIKE
                    </motion.div>
                    <motion.div
                      className="absolute right-5 top-5 rotate-[14deg] rounded-lg border-[3px] border-bad px-3 py-1 font-display text-[22px] font-semibold text-bad"
                      animate={{ opacity: stamp === -1 ? 1 : 0, scale: stamp === -1 ? 1 : 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      NOPE
                    </motion.div>
                  </>
                )}
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
      {/* action buttons under the deck, in normal flow so cards never cover them */}
      <div className="relative z-20 mt-6 flex items-center justify-center gap-4">
        <motion.span
          animate={{ scale: stamp === -1 ? 1.15 : 1 }}
          className="grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-bad shadow-md"
        >
          <X size={24} />
        </motion.span>
        <motion.span
          animate={{ scale: stamp === 1 ? 1.15 : 1 }}
          className="grid h-14 w-14 place-items-center rounded-full bg-accent text-paper shadow-[0_12px_30px_-10px_rgba(255,201,60,0.7)]"
        >
          <Heart size={24} />
        </motion.span>
      </div>
    </div>
  );
}

const line = {
  hidden: { y: "110%", opacity: 0 },
  show: (i: number) => ({
    y: "0%",
    opacity: 1,
    transition: { delay: 0.1 + i * 0.1, duration: 0.8, ease },
  }),
};

export function Hero({ onOpenApp }: { onOpenApp: () => void }) {
  const words = ["Swipe right on", "your next", "internship."];
  return (
    <section id="top" className="relative overflow-hidden pt-28 md:pt-36">
      <div className="glow-blue pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full" />
      <div className="glow-blue pointer-events-none absolute -left-60 top-80 h-[420px] w-[420px] rounded-full opacity-60" />

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 pb-28 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:pb-36">
        <div>
          <h1 className="text-[clamp(38px,5.4vw,72px)]">
            {words.map((w, i) => (
              <span key={w} className="block overflow-hidden pb-[0.08em]">
                <motion.span className="block" variants={line} custom={i} initial="hidden" animate="show">
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-mist md:text-[18px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            Lumora Connect matches hackathon winners with companies in Uzbekistan. Talent swipes companies,
            companies swipe verified talent, and a match means a real conversation about an internship or a job.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7 }}
          >
            <button onClick={onOpenApp} className={btn.primary}>
              Start swiping
            </button>
            <a href="#opportunities" className={btn.ghost}>
              See opportunities
            </a>
          </motion.div>
          <motion.div
            className="mt-10 flex items-center gap-3 text-[14px] text-mist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.7 }}
          >
            <span className="flex -space-x-2">
              {["DK", "JR", "MY", "ST"].map((x) => (
                <span key={x} className="grid h-8 w-8 place-items-center rounded-full border-2 border-paper bg-blue text-[11px] font-bold text-white">
                  {x}
                </span>
              ))}
            </span>
            214 verified hackathon participants already here
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9, ease }}
          className="pb-12"
        >
          <SwipeDemo />
        </motion.div>
      </div>
    </section>
  );
}
