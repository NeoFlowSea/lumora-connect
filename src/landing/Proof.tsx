import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { locale, useLang } from "../i18n";
import { lumora } from "../content/lumora";
import { wrap } from "./parts";
import { Stable } from "../i18n/Stable";

/* Counts up from zero when the number scrolls into view. Until then it shows the
   real number, so a screenshot or a reader that never scrolls still sees the right value. */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [v, setV] = useState(to);
  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(0, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => ctrl.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {v.toLocaleString(locale())}
      {suffix}
    </span>
  );
}

/* Real Lumora numbers, then the partner names running as a marquee. */
export function Proof() {
  const { t } = useLang();
  const stats = [
    { v: lumora.numbers.hackathons, s: "+", l: "landing.proof.hackathons" },
    { v: lumora.numbers.students, s: "+", l: "landing.proof.students" },
    { v: lumora.numbers.regions, s: "", l: "landing.proof.regions" },
    { v: lumora.numbers.partners, s: "+", l: "landing.proof.partners" },
  ];
  const more = Math.max(0, lumora.numbers.partners - lumora.partners.length);
  const names = [...lumora.partners, ...(more > 0 ? [t("landing.proof.more", { n: more })] : [])];

  return (
    <section aria-label={t("landing.proof.label")} className="mt-16 border-y border-line bg-cloud/80 md:mt-24">
      <div className={`${wrap} grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4 md:py-12`}>
        {stats.map((s) => (
          <div key={s.l} className="pr-4">
            <div className="text-[clamp(34px,4vw,48px)] font-semibold leading-none tracking-[-0.03em] text-accent">
              <CountUp to={s.v} suffix={s.s} />
            </div>
            <div className="mt-2 text-[14px] text-mist">
              <Stable k={s.l} />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className={`${wrap} pt-8 md:pt-10`}>
          <h2 className="text-center text-[15px] font-medium tracking-normal text-mist"><Stable k="landing.proof.partnersTitle" /></h2>
        </div>
          <div className="marquee relative mt-4 overflow-hidden pb-8 md:pb-10 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <ul className="sr-only">
              {names.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div aria-hidden className="marquee-track flex w-max items-center gap-12 whitespace-nowrap px-6">
              {[...names, ...names].map((p, i) => (
                <span key={i} className="text-[18px] font-semibold tracking-[-0.01em] text-ink/85 md:text-[21px]">
                  {p}
                </span>
              ))}
            </div>
          </div>
      </div>
    </section>
  );
}
