import { useEffect, useRef, useState } from "react";

/* Glitch text that plays while the cursor is over it.
   - At rest the text is still. Hovering starts the 3.6 s beat from its first frame
     and repeats it as long as the cursor stays. When the cursor leaves during a burst,
     the burst finishes first, so the text never freezes half-glitched.
   - On touch screens a tap plays one burst.
   - Only transform and opacity animate, on stacked copies of the text, so the
     compositor runs it and scrolling cannot freeze it. */

export const GLITCH_PERIOD = 3600;
/** the glitching part of each beat; the rest of the beat is still */
const BURST = 1300;

export function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const started = useRef(0);
  const stopTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(stopTimer.current), []);

  function start() {
    window.clearTimeout(stopTimer.current);
    if (playing) return;
    started.current = performance.now();
    setPlaying(true);
  }

  /** stop after the current burst, or right away if the beat is in its still part */
  function stopSoon() {
    const inBeat = (performance.now() - started.current) % GLITCH_PERIOD;
    const wait = inBeat < BURST ? BURST - inBeat : 0;
    window.clearTimeout(stopTimer.current);
    stopTimer.current = window.setTimeout(() => setPlaying(false), wait);
  }

  return (
    <span
      className={`glitch ${playing ? "" : "glitch-off"} ${className}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && start()}
      onPointerLeave={(e) => e.pointerType === "mouse" && stopSoon()}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        start();
        stopSoon();
      }}
    >
      <span className="glitch-main">{text}</span>
      <span aria-hidden className="glitch-layer glitch-y">{text}</span>
      <span aria-hidden className="glitch-layer glitch-b">{text}</span>
      <span aria-hidden className="glitch-layer glitch-s1">{text}</span>
      <span aria-hidden className="glitch-layer glitch-s2">{text}</span>
      <span aria-hidden className="glitch-layer glitch-flash-sky">{text}</span>
      <span aria-hidden className="glitch-layer glitch-flash-yellow">{text}</span>
    </span>
  );
}
