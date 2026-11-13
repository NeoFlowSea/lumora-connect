import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const flows = {
  talent: {
    title: "From a hackathon podium to a first job in three steps",
    steps: [
      {
        t: "Build a profile from your results",
        d: "Your Lumora placements are confirmed by the organizers and shown as badges companies can trust. Add skills, a project and a portfolio link.",
      },
      {
        t: "Apply with one click",
        d: "Internships, work programs, positions and events, filtered by your category and city. Your profile is the application.",
      },
      {
        t: "Get shortlisted and hired",
        d: "Companies review profiles, shortlist, and reach you on Telegram. Track every application in one place.",
      },
    ],
  },
  company: {
    title: "Hire people who have already shipped under pressure",
    steps: [
      {
        t: "Post in two minutes",
        d: "Describe the role, pick the categories you need and set the format. It goes live for every matching talent immediately.",
      },
      {
        t: "Browse verified talent",
        d: "Filter by category, city and availability. Every hackathon result on a profile is confirmed by Lumora.",
      },
      {
        t: "Shortlist and accept",
        d: "Review applicants side by side, shortlist the strongest and contact them directly.",
      },
    ],
  },
};

export function HowItWorks() {
  const [side, setSide] = useState<"talent" | "company">("talent");
  const f = flows[side];
  return (
    <section id="how" className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-36">
      <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-20">
        <div className="md:sticky md:top-32 md:self-start">
          <div className="inline-flex rounded-full border border-line p-1 text-[14px]">
            {(["talent", "company"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setSide(k)}
                className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
                  side === k ? "bg-snow text-ink" : "text-mist hover:text-snow"
                }`}
              >
                {k === "talent" ? "For talent" : "For companies"}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.h2
              key={side}
              className="mt-8 text-[clamp(28px,3.6vw,46px)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              {f.title}
            </motion.h2>
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          <motion.ol
            key={side}
            className="divide-y divide-line border-t border-line"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {f.steps.map((s, i) => (
              <motion.li
                key={s.t}
                className="grid grid-cols-[48px_1fr] gap-6 py-8 md:grid-cols-[72px_1fr] md:py-10"
                variants={{ hidden: { opacity: 0, x: 16 }, show: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.4 }}
              >
                <span className="font-display text-[14px] text-royal">0{i + 1}</span>
                <div>
                  <h3 className="text-[20px] md:text-[24px]">{s.t}</h3>
                  <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-mist md:text-[16px]">{s.d}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </AnimatePresence>
      </div>
    </section>
  );
}
