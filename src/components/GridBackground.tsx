import { useEffect, useRef } from "react";

/* Living grid: a dot lattice behind the landing. Short blue signals run along the
   lattice lines and turn at nodes; dots near the cursor light up and lean toward it.
   Fades out further down the page so it never competes with content. */

const SP = 28; // grid spacing in px
const R = 170; // cursor influence radius
const BLUE = "141,176,255";
const ORANGE = "34,197,94"; // the accent (green)

type Dir = 0 | 1 | 2 | 3; // right, down, left, up
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

type Pulse = {
  x: number; // in cell units
  y: number;
  dir: Dir;
  speed: number; // cells per second
  trail: number; // cells
  life: number; // seconds
  age: number;
  hist: { x: number; y: number }[];
  sky: boolean;
};

export function GridBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let raf = 0;
    let last = performance.now();
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const pulses: Pulse[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cols = Math.ceil(w / SP) + 2;
      rows = Math.ceil(h / SP) + 2;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      const dir = Math.floor(Math.random() * 4) as Dir;
      pulses.push({
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
        dir,
        speed: (reduced ? 0.5 : 1) * (4.5 + Math.random() * 4),
        trail: 4 + Math.random() * 5,
        life: 2.5 + Math.random() * 3.5,
        age: 0,
        hist: [],
        sky: Math.random() < 0.18,
      });
    }

    function stepPulse(p: Pulse, dt: number) {
      p.age += dt;
      const before = p.dir % 2 === 0 ? Math.floor(p.x) : Math.floor(p.y);
      p.x += DX[p.dir] * p.speed * dt;
      p.y += DY[p.dir] * p.speed * dt;
      const after = p.dir % 2 === 0 ? Math.floor(p.x) : Math.floor(p.y);
      // crossed a node: maybe turn 90 degrees
      if (before !== after && Math.random() < 0.38) {
        const nx = Math.round(p.x);
        const ny = Math.round(p.y);
        p.x = nx;
        p.y = ny;
        p.dir = ((p.dir + (Math.random() < 0.5 ? 1 : 3)) % 4) as Dir;
      }
      p.hist.push({ x: p.x, y: p.y });
      // keep the trail to its length in cells
      let len = 0;
      for (let i = p.hist.length - 1; i > 0; i--) {
        len += Math.abs(p.hist[i].x - p.hist[i - 1].x) + Math.abs(p.hist[i].y - p.hist[i - 1].y);
        if (len > p.trail) {
          p.hist.splice(0, i);
          break;
        }
      }
    }

    function draw(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const scroll = window.scrollY;
      // brighter in the hero, quieter further down
      const fade = Math.max(0.35, 1 - scroll / 1600);
      const oy = -(scroll % SP);
      const ox = SP / 2;

      ctx!.clearRect(0, 0, w, h);

      // cursor easing
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;

      // dots
      const base = 0.18 * fade;
      ctx!.fillStyle = `rgba(${BLUE},${base})`;
      for (let gy = 0; gy < rows; gy++) {
        const y = gy * SP + oy;
        for (let gx = 0; gx < cols; gx++) {
          const x = gx * SP + ox;
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < R) {
            const t = 1 - d / R;
            const pull = t * t * 7;
            const px = x - (dx / (d || 1)) * pull;
            const py = y - (dy / (d || 1)) * pull;
            ctx!.fillStyle = `rgba(${BLUE},${Math.min(1, base + t * 0.75)})`;
            ctx!.beginPath();
            ctx!.arc(px, py, 1 + t * 1.5, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.fillStyle = `rgba(${BLUE},${base})`;
          } else {
            ctx!.fillRect(x - 1, y - 1, 2, 2);
          }
        }
      }

      // pulses: fewer and slower when the OS asks for reduced motion
      const target = Math.round((reduced ? 4 : 9) * fade);
      while (pulses.length < target) spawn();
      ctx!.lineCap = "round";
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        stepPulse(p, dt);
        const off = p.x < -1 || p.y < -1 || p.x > cols + 1 || p.y > rows + 1;
        if (p.age > p.life || off) {
          pulses.splice(i, 1);
          continue;
        }
        const env = Math.min(1, p.age * 2.5, (p.life - p.age) * 2);
        const col = p.sky ? ORANGE : BLUE;
        const n = p.hist.length;
        for (let k = 1; k < n; k++) {
          const a = (k / n) * env * 0.9;
          ctx!.strokeStyle = `rgba(${col},${a})`;
          ctx!.lineWidth = 1.2 + (k / n) * 0.8;
          ctx!.beginPath();
          ctx!.moveTo(p.hist[k - 1].x * SP + ox, p.hist[k - 1].y * SP + oy);
          ctx!.lineTo(p.hist[k].x * SP + ox, p.hist[k].y * SP + oy);
          ctx!.stroke();
        }
        // head
        const hx = p.x * SP + ox;
        const hy = p.y * SP + oy;
        const g = ctx!.createRadialGradient(hx, hy, 0, hx, hy, 9);
        g.addColorStop(0, `rgba(${col},${0.9 * env})`);
        g.addColorStop(1, `rgba(${col},0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(hx, hy, 9, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function loop(now: number) {
      draw(now);
      raf = requestAnimationFrame(loop);
    }

    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
    };
    const onLeave = () => {
      mouse.tx = -9999;
      mouse.ty = -9999;
    };

    resize();
    window.addEventListener("resize", resize);
    if (!coarse) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" />;
}
