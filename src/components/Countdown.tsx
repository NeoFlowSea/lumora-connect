import { useEffect, useState } from "react";

function parts(to: string) {
  const diff = Math.max(0, new Date(to).getTime() - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return [
    { v: d, l: "days" },
    { v: h, l: "hours" },
    { v: m, l: "min" },
    { v: s, l: "sec" },
  ];
}

export function Countdown({ to, dark }: { to: string; dark?: boolean }) {
  const [p, setP] = useState(() => parts(to));
  useEffect(() => {
    const t = setInterval(() => setP(parts(to)), 1000);
    return () => clearInterval(t);
  }, [to]);
  return (
    <div className="flex gap-2">
      {p.map((x) => (
        <div
          key={x.l}
          className={`min-w-[64px] rounded-xl px-3 py-2 text-center ${dark ? "bg-white/10 text-white" : "bg-tint text-sky"}`}
        >
          <div className="font-display text-[22px] leading-none tabular-nums">{String(x.v).padStart(2, "0")}</div>
          <div className={`mt-1 text-[11px] ${dark ? "text-white/70" : "text-mist"}`}>{x.l}</div>
        </div>
      ))}
    </div>
  );
}
