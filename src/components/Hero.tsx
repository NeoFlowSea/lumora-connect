import { Suspense, lazy, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

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
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const textOpacity = useTransform(scrollYProgress, [0.06, 0.3], [1, 0]);
  const textY = useTransform(scrollYProgress, [0.06, 0.3], [0, -70]);
  const captionOpacity = useTransform(scrollYProgress, [0.8, 0.93], [0, 1]);
  const captionY = useTransform(scrollYProgress, [0.8, 0.93], [16, 0]);

  const words = ["Where hackathon", "winners meet the", "companies that", "hire them."];

  return (
    /* Tall wrapper: the inner screen sticks while scroll progress drives the scene. */
    <section ref={ref} id="top" className="relative h-[260vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.3 }}
        >
          <Suspense fallback={null}>
            <Constellation progress={scrollYProgress} />
          </Suspense>
          <motion.div
            style={{ opacity: textOpacity }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/55 to-transparent md:via-ink/40"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
        </motion.div>

        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute inset-0 flex items-end md:items-center"
        >
          <div className="mx-auto w-full max-w-[1240px] px-5 pb-20 pt-32 md:px-8 md:pb-0 md:pt-24">
            <div className="max-w-[880px]">
              <h1 className="text-[clamp(38px,5.6vw,76px)] leading-[1.04]">
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
        </motion.div>

        {/* Shown once the three stars have become one. */}
        <motion.div
          style={{ opacity: captionOpacity, y: captionY }}
          className="pointer-events-none absolute inset-x-0 top-[64%] px-5 text-center md:top-[62%]"
        >
          <p className="mx-auto max-w-[30ch] font-display text-[clamp(18px,2.4vw,30px)] leading-snug">
            Every talent here started as a single spark.
          </p>
          <p className="mt-3 text-[14px] text-mist md:text-[15px]">Scroll on to see where it goes.</p>
        </motion.div>
      </div>
    </section>
  );
}
