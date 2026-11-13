import { Suspense, lazy } from "react";
import { motion } from "framer-motion";

const Constellation = lazy(() => import("./Constellation"));

const line = {
  hidden: { y: "110%", opacity: 0 },
  show: (i: number) => ({
    y: "0%",
    opacity: 1,
    transition: { delay: 0.15 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero() {
  const words = ["Where hackathon", "winners meet the", "companies that", "hire them."];
  return (
    <section id="top" className="relative flex min-h-[100svh] items-end overflow-hidden md:items-center">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8, delay: 0.3 }}
      >
        <Suspense fallback={null}>
          <Constellation />
        </Suspense>
        {/* keep the headline readable on the left, let the network glow on the right */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent md:via-ink/40" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      </motion.div>

      <div className="relative mx-auto w-full max-w-[1240px] px-5 pb-20 pt-32 md:px-8 md:pb-0 md:pt-24">
        <div className="max-w-[760px]">
          <h1 className="text-[clamp(38px,7vw,92px)] leading-[1.02]">
            {words.map((w, i) => (
              <span key={w} className="block overflow-hidden pb-[0.08em]">
                <motion.span className="block" variants={line} custom={i} initial="hidden" animate="show">
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-7 max-w-[520px] text-[17px] leading-relaxed text-mist md:text-[18px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Lumora Connect is the talent network of Lumora IT case competitions in Uzbekistan.
            Verified hackathon results, real internships and jobs, and companies that want people
            who have already shipped under pressure.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.8 }}
          >
            <a
              href="#opportunities"
              className="rounded-full bg-royal px-6 py-3.5 text-[15px] font-semibold text-snow shadow-[0_0_40px_-8px_rgba(30,91,214,0.9)] transition-[background-color,box-shadow] hover:bg-[#2b6cf0] hover:shadow-[0_0_56px_-6px_rgba(30,91,214,1)]"
            >
              Find opportunities
            </a>
            <a
              href="#join"
              className="rounded-full border border-line px-6 py-3.5 text-[15px] font-semibold text-snow transition-colors hover:border-ice/50 hover:bg-snow/5"
            >
              Hire talent
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
