import { useEffect, useRef, useState, type CSSProperties } from "react";

/* Glitch text that keeps time like a clock.
   - Only transform and opacity animate, on stacked copies of the text. Browsers
     run those on the compositor, so scrolling (Lenis, the canvas grid, iOS touch
     scrolling) cannot freeze or drift them.
   - The phase comes from the wall clock (negative animation-delay), so every
     glitch heading on the page fires together on the same 3.6 s beat.
   - Off screen the layers stop animating; when they come back they rejoin the
     beat in phase. */

export const GLITCH_PERIOD = 3600;

const phase = () => -(Date.now() % GLITCH_PERIOD);

export function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState(() => ({ on: true, delay: phase() }));

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        // restarting the animation with a fresh negative delay puts it back on the beat
        setState(e.isIntersecting ? { on: true, delay: phase() } : (s) => ({ ...s, on: false }));
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style = { "--g-delay": `${state.delay}ms` } as CSSProperties;
  return (
    <span ref={ref} className={`glitch ${state.on ? "" : "glitch-off"} ${className}`} style={style}>
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
