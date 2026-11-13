import { useState } from "react";
import { motion } from "framer-motion";

const sides = [
  {
    key: "talent",
    title: "I'm tech talent",
    text: "Turn your hackathon results into a profile companies trust, and apply to internships and jobs in one click.",
    cta: "Create profile",
  },
  {
    key: "company",
    title: "I'm a company",
    text: "Post internships, programs, positions and events. Browse verified talent by category and shortlist in minutes.",
    cta: "Post an opportunity",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Join() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <section id="join" className="mx-auto max-w-[1240px] px-5 pb-24 md:px-8 md:pb-36">
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
                opacity: dim ? 0.6 : 1,
                borderColor: active ? "rgba(30,91,214,0.7)" : "rgba(191,214,255,0.14)",
              }}
              transition={{ duration: 0.7, ease }}
              style={{ flexBasis: 0 }}
              className="relative min-w-0 overflow-hidden rounded-3xl border p-8 md:p-12"
            >
              <motion.div
                aria-hidden
                animate={{ opacity: active ? 0.45 : 0, scale: active ? 1 : 0.7 }}
                transition={{ duration: 0.9, ease }}
                className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-royal blur-3xl"
              />
              <motion.div
                animate={{ x: active ? 6 : 0 }}
                transition={{ duration: 0.7, ease }}
                className="relative"
              >
                <h2 className="text-[clamp(26px,3vw,40px)]">{s.title}</h2>
                <p className="mt-4 max-w-[42ch] text-[15px] text-mist md:text-[16px]">{s.text}</p>
                <a
                  href="#top"
                  className={`mt-8 inline-block rounded-full px-6 py-3 text-[15px] font-semibold transition-colors duration-300 ${
                    s.key === "talent" ? "bg-snow text-ink hover:bg-ice" : "bg-royal text-snow hover:bg-[#2b6cf0]"
                  }`}
                >
                  {s.cta}
                </a>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
