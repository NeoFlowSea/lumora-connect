import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLang } from "../i18n";

/* Countdown to an event start. Digits in Press Start 2P (the only place that font is used).
   Real numbers on the first frame; a changing digit drops in, or simply swaps with reduced motion. */

function parts(to: string) {
  const diff = Math.max(0, new Date(to).getTime() - Date.now());
  return [
    { v: Math.floor(diff / 86400000), k: "days" },
    { v: Math.floor((diff % 86400000) / 3600000), k: "hours" },
    { v: Math.floor((diff % 3600000) / 60000), k: "min" },
    { v: Math.floor((diff % 60000) / 1000), k: "sec" },
  ];
}

function DropNumber({ value, big = false }: { value: string; big?: boolean }) {
  const reduce = useReducedMotion();
  const size = big ? "h-[20px] text-[20px] sm:h-[32px] sm:text-[32px]" : "h-[17px] text-[17px]";
  if (reduce) return <div className={`font-pixel leading-none ${size}`}>{value}</div>;
  return (
    <div className={`relative overflow-hidden ${size.split(" ").filter((c) => c.includes("h-")).join(" ")}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={value}
          className={`font-pixel leading-none ${size.split(" ").filter((c) => c.includes("text-")).join(" ")}`}
          initial={{ y: "-110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "110%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.6 }}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** `big`: larger digits and boxes, for the next round on the site pages */
export function Countdown({ to, dark, big = false }: { to: string; dark?: boolean; big?: boolean }) {
  const { t } = useLang();
  const [p, setP] = useState(() => parts(to));
  useEffect(() => {
    setP(parts(to));
    const id = setInterval(() => setP(parts(to)), 1000);
    return () => clearInterval(id);
  }, [to]);
  const label = p.map((x) => `${x.v} ${t(`landing.cd.${x.k}`)}`).join(", ");
  return (
    <div className={big ? "grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-3" : "flex flex-wrap gap-2"} role="timer" aria-label={label}>
      {p.map((x) => (
        <div key={x.k} aria-hidden className={`rounded-lg text-center ${big ? "min-w-0 px-1 py-3 sm:min-w-[92px] sm:px-4 sm:py-4" : "min-w-[64px] px-3 py-2"} ${dark ? "bg-white/15 text-current" : "bg-tint text-sky"}`}>
          <DropNumber value={String(x.v).padStart(2, "0")} big={big} />
          <div className={`${big ? "mt-2 text-[13px]" : "mt-1.5 text-[12px]"} ${dark ? "opacity-80" : "text-mist"}`}>{t(`landing.cd.${x.k}`)}</div>
        </div>
      ))}
    </div>
  );
}
