import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "./Logo";

const STRIPS = 9;

/* App-launch intro: the logo lands on the blue screen, then the screen
   tears into vertical strips that slide off to the right, revealing the site. */
export function Splash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"logo" | "wipe">("logo");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const t = setTimeout(() => setPhase("wipe"), reduced ? 600 : 1250);
    return () => clearTimeout(t);
  }, [reduced]);

  useEffect(() => {
    if (phase !== "wipe") return;
    const t = setTimeout(onDone, reduced ? 400 : 1100);
    return () => clearTimeout(t);
  }, [phase, onDone, reduced]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      {/* strips */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: STRIPS }).map((_, i) => (
          <motion.div
            key={i}
            className="h-full flex-none bg-blue"
            style={{ width: `calc(${100 / STRIPS}% + 3px)`, marginRight: -3, boxShadow: "0 0 0 1px #1a4ba8" }}
            initial={{ x: 0 }}
            animate={phase === "wipe" ? { x: "110vw" } : { x: 0 }}
            transition={{
              duration: reduced ? 0.3 : 0.62,
              ease: [0.76, 0, 0.24, 1],
              delay: phase === "wipe" ? i * 0.045 : 0,
            }}
          />
        ))}
      </div>
      {/* logo */}
      <motion.div
        className="absolute inset-0 grid place-items-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={
          phase === "logo"
            ? { scale: 1, opacity: 1, x: 0 }
            : { scale: 0.9, opacity: 0, x: "70vw" }
        }
        transition={
          phase === "logo"
            ? { type: "spring", stiffness: 220, damping: 20, mass: 0.8 }
            : { duration: 0.55, ease: [0.76, 0, 0.24, 1] }
        }
      >
        <Shield size={reduced ? 110 : 128} />
      </motion.div>
    </div>
  );
}
