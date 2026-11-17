import { useState } from "react";
import { motion } from "framer-motion";
import { actions, type Role } from "../lib/store";
import { go } from "../lib/router";
import { ease } from "../components/ui";

const sides: { key: Role; title: string; text: string; cta: string }[] = [
  {
    key: "talent",
    title: "I'm tech talent",
    text: "Turn your hackathon results into a profile companies trust, then swipe the companies you would actually work for.",
    cta: "Start as talent",
  },
  {
    key: "company",
    title: "I'm a company",
    text: "Swipe verified talent by track and city, post internships and positions, sponsor a hackathon case.",
    cta: "Start as a company",
  },
];

export function Join() {
  const [hover, setHover] = useState<string | null>(null);
  function start(role: Role) {
    actions.setRole(role);
    go("#/app/swipe");
  }
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-36">
      <div className="flex flex-col gap-3 md:flex-row">
        {sides.map((s) => {
          const active = hover === s.key;
          const dim = hover !== null && !active;
          return (
            <motion.div
              key={s.key}
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
              initial={false}
              animate={{
                flexGrow: active ? 1.5 : 1,
                opacity: dim ? 0.65 : 1,
                borderColor: active ? "rgba(255,201,60,0.8)" : "rgba(255,255,255,0.1)",
              }}
              transition={{ duration: 0.7, ease }}
              style={{ flexBasis: 0 }}
              className="relative min-w-0 overflow-hidden rounded-3xl border bg-surface p-8 md:p-12"
            >
              <motion.div
                aria-hidden
                animate={{ opacity: active ? 0.5 : 0, scale: active ? 1 : 0.7 }}
                transition={{ duration: 0.9, ease }}
                className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue blur-3xl"
              />
              <motion.div animate={{ x: active ? 6 : 0 }} transition={{ duration: 0.7, ease }} className="relative">
                <h2 className="text-[clamp(26px,3vw,40px)]">{s.title}</h2>
                <p className="mt-4 max-w-[42ch] text-[15px] text-mist md:text-[16px]">{s.text}</p>
                <button
                  onClick={() => start(s.key)}
                  className={`mt-8 inline-block rounded-full px-6 py-3 text-[15px] font-semibold transition-colors duration-300 ${
                    s.key === "talent" ? "bg-accent text-paper hover:bg-accent-deep" : "bg-blue text-white hover:bg-blue-deep"
                  }`}
                >
                  {s.cta}
                </button>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
