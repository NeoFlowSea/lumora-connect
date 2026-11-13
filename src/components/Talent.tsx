import type { MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Trophy } from "lucide-react";
import { talents } from "../data";
import { Logo } from "./Logo";

function initials(n: string) {
  return n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

function Card({ t }: { t: (typeof talents)[number] }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), { stiffness: 200, damping: 20 });

  function move(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  }
  function leave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.article
      onMouseMove={move}
      onMouseLeave={leave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="flex w-[300px] shrink-0 snap-start flex-col rounded-3xl border border-line bg-gradient-to-b from-snow/[0.05] to-transparent p-6 md:w-[340px]"
    >
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-navy font-display text-[14px] text-snow">
          {initials(t.name)}
        </div>
        <div>
          <div className="font-semibold">{t.name}</div>
          <div className="text-[13px] text-mist">
            {t.cat}, {t.city}
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-royal/40 bg-royal/10 px-3 py-2.5">
        <Trophy size={16} className="shrink-0 text-ice" />
        <div className="min-w-0 truncate text-[13px]">
          <span className="font-semibold">{t.place}</span>
          <span className="text-mist">, {t.event}</span>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-mist" title="Confirmed by Lumora">
          <Logo size={10} /> verified
        </span>
      </div>
      <p className="mt-5 text-[14px] text-mist">Built {t.project}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
        {t.skills.map((s) => (
          <span key={s} className="rounded-md bg-snow/[0.06] px-2 py-1 text-[12px] text-snow/90">
            {s}
          </span>
        ))}
      </div>
    </motion.article>
  );
}

export function Talent() {
  return (
    <section id="talent" className="border-t border-line pb-16 pt-24 md:pb-24 md:pt-36">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[16ch] text-[clamp(28px,3.6vw,46px)]">Winners from this season</h2>
          <a href="#join" className="text-[15px] font-semibold text-ice underline-offset-4 hover:underline">
            Browse all 214 profiles
          </a>
        </div>
      </div>
      <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:px-[max(32px,calc((100vw-1240px)/2+32px))]">
        {talents.map((t) => (
          <Card key={t.name} t={t} />
        ))}
        <div className="w-5 shrink-0" />
      </div>
    </section>
  );
}
