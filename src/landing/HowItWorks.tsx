import { motion } from "framer-motion";
import { BadgeCheck, Heart, MessageCircle } from "lucide-react";
import { Highlight, Reveal, ease } from "../components/ui";

const steps = [
  {
    icon: BadgeCheck,
    t: "Your hackathon result is your profile",
    d: "Placements at Lumora IT case competitions are confirmed by the organizers and shown as badges. No CV to write.",
  },
  {
    icon: Heart,
    t: "Swipe companies, companies swipe you",
    d: "Right means interested. When both sides swipe right, it is a match and the conversation starts.",
  },
  {
    icon: MessageCircle,
    t: "Match, talk, get the internship",
    d: "Matched companies see your projects and reach you directly. Track every application in one place.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-36">
      <Reveal>
        <h2 className="max-w-[22ch] text-[clamp(28px,3.6vw,46px)]">
          Like a dating app, but the <Highlight>match is a job</Highlight>
        </h2>
      </Reveal>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.t}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.7, ease, delay: i * 0.12 }}
            className="group relative rounded-3xl border border-line bg-surface p-7 transition-[box-shadow,border-color,transform] hover:-translate-y-1 hover:border-sky hover:shadow-[0_24px_50px_-30px_rgba(26,75,168,0.45)]"
          >
            <span className="absolute right-6 top-6 font-display text-[13px] text-sky">0{i + 1}</span>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-tint text-sky transition-colors group-hover:bg-blue group-hover:text-white">
              <s.icon size={22} />
            </span>
            <h3 className="mt-6 text-[20px]">{s.t}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-mist">{s.d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
