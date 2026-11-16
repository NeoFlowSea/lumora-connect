import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { partners } from "../data";

function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const ctrl = animate(0, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = Math.round(v).toString();
      },
    });
    return () => ctrl.stop();
  }, [inView, to]);
  return <span ref={ref}>0</span>;
}

const stats = [
  { n: 214, label: "verified talents" },
  { n: 38, label: "open opportunities" },
  { n: 26, label: "companies swiping" },
  { n: 7, label: "cities across Uzbekistan" },
];

export function Stats() {
  const list = [...partners, ...partners];
  return (
    <section className="border-y border-line bg-cloud">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-8 md:px-8 md:py-10">
            <div className="font-display text-[34px] font-medium leading-none text-blue md:text-[44px]">
              <Counter to={s.n} />
            </div>
            <div className="mt-2 text-[14px] text-mist">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="marquee relative overflow-hidden border-t border-line py-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-cloud to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-cloud to-transparent" />
        <div className="marquee-track flex w-max items-center gap-14 whitespace-nowrap px-7">
          {list.map((p, i) => (
            <span key={i} className="font-display text-[14px] font-light tracking-wide text-mist">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
