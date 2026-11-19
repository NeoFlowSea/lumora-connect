import { useEffect, useRef, useState } from "react";

/* Glitch text that keeps time like a clock.
   - Only transform and opacity animate, on stacked copies of the text. Browsers
     run those on the compositor, so scrolling (Lenis, the canvas grid, iOS touch
     scrolling) cannot freeze or drift them.
   - Every layer's position in the 3.6 s cycle is set from the wall clock with the
     Web Animations API, so all glitch headings on the page fire on the same beat.
   - Off screen the layers stop animating; when they come back they are re-synced
     to the clock, so they rejoin the beat in phase. */

export const GLITCH_PERIOD = 3600;

function syncToClock(el: HTMLElement) {
  // a large whole number of periods keeps currentTime positive and the phase exact
  const t = (Date.now() % GLITCH_PERIOD) + GLITCH_PERIOD * 1000;
  for (const a of el.getAnimations({ subtree: true })) {
    try {
      a.currentTime = t;
    } catch {
      /* older engines: the CSS animation still runs, just not phase-locked */
    }
  }
}

export function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: "120px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !on || typeof el.getAnimations !== "function") return;
    // wait a frame so the browser has created the CSS animations, then lock them to the clock
    const id = requestAnimationFrame(() => syncToClock(el));
    return () => cancelAnimationFrame(id);
  }, [on]);

  return (
    <span ref={ref} className={`glitch ${on ? "" : "glitch-off"} ${className}`}>
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
