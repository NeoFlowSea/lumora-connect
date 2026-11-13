import type { MouseEvent } from "react";
import { categories } from "../data";

function track(e: MouseEvent<HTMLAnchorElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function Categories() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-24 md:px-8 md:pb-36">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <h2 className="max-w-[18ch] text-[clamp(28px,3.6vw,46px)]">Pick your track, see who is hiring in it</h2>
        <p className="max-w-[40ch] text-[15px] text-mist">
          Nine tracks, the same ones used at every Lumora IT case competition. Companies post into them directly.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {categories.map((c) => (
          <a
            key={c.name}
            href="#opportunities"
            onMouseMove={track}
            className={`spot group flex min-h-[120px] flex-col justify-between gap-4 rounded-2xl border border-line bg-snow/[0.025] p-5 transition-colors hover:border-ice/30 md:min-h-[190px] md:p-6 ${
              c.span === 2 ? "md:col-span-2" : ""
            }`}
          >
            <div className="relative flex items-start justify-between gap-3">
              <h3 className="text-[18px] md:text-[21px]">{c.name}</h3>
              <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[12px] font-semibold text-ice">
                {c.open} open
              </span>
            </div>
            <p className="relative text-[14px] text-mist">{c.desc}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
