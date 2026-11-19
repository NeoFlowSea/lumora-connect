import type { MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Trophy } from "lucide-react";
import type { Talent as TalentCardData } from "../data";
import { api } from "../api";
import { useApi } from "../api/hooks";
import { Shield } from "../components/Logo";
import { Reveal, initials } from "../components/ui";

function Card({ t }: { t: TalentCardData }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });

  function move(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <motion.article
      onMouseMove={move}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="flex w-[300px] shrink-0 snap-start flex-col rounded-3xl border border-line bg-surface p-6 shadow-[0_20px_40px_-30px_rgba(11,31,58,0.3)] md:w-[340px]"
    >
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-blue font-display text-[14px] text-white">{initials(t.name)}</div>
        <div>
          <div className="font-semibold">{t.name}</div>
          <div className="text-[13px] text-mist">
            {t.cat}, {t.city}
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-tint px-3 py-2.5">
        <Trophy size={16} className="shrink-0 text-sky" />
        <div className="min-w-0 truncate text-[13px]">
          <span className="font-semibold">{t.place}</span>
          <span className="text-mist">, {t.event}</span>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-mist" title="Confirmed by Lumora">
          <Shield size={9} mono="#8db0ff" /> verified
        </span>
      </div>
      <p className="mt-5 text-[14px] text-mist">Built {t.project}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
        {t.skills.map((s) => (
          <span key={s} className="rounded-md bg-cloud px-2 py-1 text-[12px] font-semibold text-ink">
            {s}
          </span>
        ))}
      </div>
    </motion.article>
  );
}

export function Talent({ onOpenApp }: { onOpenApp: () => void }) {
  const winners = useApi(() => api.users.winners(8), []);
  const cards: TalentCardData[] = (winners.data ?? []).map((t) => {
    const b = t.badges.slice().sort((x, y) => (x.place ?? 99) - (y.place ?? 99))[0];
    return { id: t.id, name: t.name, cat: t.cat, city: t.city, age: t.age ?? 0, place: b.title, event: b.hackathonName, skills: t.skills, project: t.project, bio: t.bio, avail: t.avail };
  });
  return (
    <section id="talent" className="pb-16 pt-24 md:pb-24 md:pt-36">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[16ch] text-[clamp(28px,3.6vw,46px)]">Winners from this season</h2>
          <button onClick={onOpenApp} className="text-[15px] font-semibold text-sky underline-offset-4 hover:underline">
            Swipe all profiles
          </button>
        </Reveal>
      </div>
      <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 pt-2 md:px-[max(32px,calc((100vw-1240px)/2+32px))]">
        {cards.map((t) => (
          <Card key={t.id} t={t} />
        ))}
        <div className="w-5 shrink-0" />
      </div>
    </section>
  );
}
