import { useState } from "react";

const sides = [
  {
    key: "talent",
    title: "I'm tech talent",
    text: "Turn your hackathon results into a profile companies trust, and apply to internships and jobs in one click.",
    cta: "Create profile",
  },
  {
    key: "company",
    title: "I'm a company",
    text: "Post internships, programs, positions and events. Browse verified talent by category and shortlist in minutes.",
    cta: "Post an opportunity",
  },
];

export function Join() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <section id="join" className="mx-auto max-w-[1240px] px-5 pb-24 md:px-8 md:pb-36">
      <div className="flex flex-col gap-3 md:flex-row">
        {sides.map((s) => {
          const active = hover === s.key;
          const dim = hover && !active;
          return (
            <div
              key={s.key}
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
              className={`relative overflow-hidden rounded-3xl border p-8 transition-[flex-grow,border-color,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] md:p-12 ${
                active ? "border-royal/60" : "border-line"
              } ${dim ? "opacity-70" : ""}`}
              style={{ flexGrow: active ? 1.6 : 1, flexBasis: 0 }}
            >
              <div
                className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-royal blur-3xl transition-opacity duration-500 ${
                  active ? "opacity-40" : "opacity-0"
                }`}
              />
              <h2 className="relative text-[clamp(26px,3vw,40px)]">{s.title}</h2>
              <p className="relative mt-4 max-w-[42ch] text-[15px] text-mist md:text-[16px]">{s.text}</p>
              <a
                href="#top"
                className={`relative mt-8 inline-block rounded-full px-6 py-3 text-[15px] font-semibold transition-colors ${
                  s.key === "talent" ? "bg-snow text-ink hover:bg-ice" : "bg-royal text-snow hover:bg-[#2b6cf0]"
                }`}
              >
                {s.cta}
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
