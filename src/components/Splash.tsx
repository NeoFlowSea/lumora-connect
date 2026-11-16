import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Braces, Code2, Cpu, Database, GitBranch, Laptop, Rocket, Terminal } from "lucide-react";
import { Shield } from "./Logo";

/* App-launch intro, about 2.4 seconds:
   1. the shield lands on the blue screen;
   2. it pops, leaving a ring of translucent tech icons behind;
   3. the blue tears into slanted strips that race off to the right,
      the top edge ahead of the bottom;
   4. the icons evaporate over the revealed site. */

const STRIPS = 8;
const ICONS = [Code2, Laptop, Cpu, Terminal, Braces, Database, GitBranch, Rocket];
type Phase = "logo" | "pop" | "wipe" | "fade";

const wipeEase = [0.76, 0, 0.24, 1] as const;

export function Splash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("logo");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.innerWidth < 640;
  const radius = small ? 112 : 160;

  useEffect(() => {
    const t = reduced ? [500, 650, 1200, 1600] : [900, 1150, 1950, 2450];
    const ids = [
      setTimeout(() => setPhase("pop"), t[0]),
      setTimeout(() => setPhase("wipe"), t[1]),
      setTimeout(() => setPhase("fade"), t[2]),
      setTimeout(onDone, t[3]),
    ];
    return () => ids.forEach(clearTimeout);
  }, [onDone, reduced]);

  const popped = phase !== "logo";
  const wiping = phase === "wipe" || phase === "fade";

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      {/* slanted strips */}
      {Array.from({ length: STRIPS }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 h-full bg-blue"
          style={{
            left: `calc(${(100 / STRIPS) * i}% - 2px)`,
            width: `calc(${100 / STRIPS}% + 4px)`,
            transformOrigin: "bottom left",
            boxShadow: "0 0 0 1px #1a4ba8",
          }}
          initial={{ x: 0, skewX: 0 }}
          animate={wiping ? { x: "120vw", skewX: -18 } : { x: 0, skewX: 0 }}
          transition={{ duration: reduced ? 0.35 : 0.7, ease: wipeEase, delay: wiping ? i * 0.045 : 0 }}
        />
      ))}

      {/* logo */}
      <motion.div
        className="absolute inset-0 grid place-items-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={popped ? { scale: [1, 1.18, 0], opacity: [1, 1, 0] } : { scale: 1, opacity: 1 }}
        transition={
          popped
            ? { duration: 0.38, times: [0, 0.4, 1], ease: "easeIn" }
            : { type: "spring", stiffness: 220, damping: 20, mass: 0.8 }
        }
      >
        <Shield size={small ? 104 : 128} />
      </motion.div>

      {/* pop ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={popped ? { scale: 2.4, opacity: [0.8, 0] } : { scale: 0.4, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* tech icons left behind by the pop */}
      {ICONS.map((Icon, i) => {
        const a = (i / ICONS.length) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius;
        const target =
          phase === "logo"
            ? { x: 0, y: 0, scale: 0, opacity: 0, filter: "blur(0px)", color: "#ffffff" }
            : phase === "fade"
              ? { x: px * 1.3, y: py * 1.3 - 24, scale: 1.5, opacity: 0, filter: "blur(6px)", color: "#1a4ba8" }
              : { x: px, y: py, scale: 1, opacity: 0.9, filter: "blur(0px)", color: wiping ? "#1a4ba8" : "#ffffff" };
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 -ml-4 -mt-4"
            initial={{ x: 0, y: 0, scale: 0, opacity: 0, color: "#ffffff" }}
            animate={target}
            transition={
              phase === "fade"
                ? { duration: 0.45, ease: "easeIn", delay: i * 0.03 }
                : { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.03, color: { duration: 0.45, delay: 0.3 + i * 0.05 } }
            }
          >
            <Icon size={32} strokeWidth={1.6} />
          </motion.span>
        );
      })}
    </div>
  );
}
