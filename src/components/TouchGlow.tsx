import { useEffect, useRef } from "react";

/* Phone version of the background: a soft blue glow that fades in on the first
   touch and follows the finger while scrolling, then fades out. One transformed
   div, no canvas, no filters, so it stays smooth on low-end phones. */
export function TouchGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const SIZE = 440;
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.6;
    let tx = x;
    let ty = y;
    let op = 0;
    let target = 0;
    let raf = 0;
    let hide = 0;
    let running = false;

    const frame = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      op += (target - op) * 0.08;
      el.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0)`;
      el.style.opacity = op.toFixed(3);
      if (op < 0.005 && target === 0) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    const start = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      window.clearTimeout(hide);
      tx = t.clientX;
      ty = t.clientY;
      if (op < 0.01) {
        x = tx;
        y = ty + 60;
      }
      target = 1;
      run();
    };
    const move = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      tx = t.clientX;
      ty = t.clientY;
    };
    const end = () => {
      hide = window.setTimeout(() => {
        target = 0;
        run();
      }, 700);
    };

    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    window.addEventListener("touchcancel", end, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hide);
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 -z-10 h-[440px] w-[440px] rounded-full opacity-0 will-change-transform"
      style={{
        background:
          "radial-gradient(closest-side, rgba(61,123,250,0.45), rgba(61,123,250,0.18) 45%, rgba(61,123,250,0) 72%)",
      }}
    />
  );
}
