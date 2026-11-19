import type { MouseEvent } from "react";
import { Wordmark } from "../components/Logo";

/* Every link goes somewhere real: a landing section or an app route.
   Section links scroll smoothly instead of changing the hash. */
const columns: { h: string; l: [string, string][] }[] = [
  {
    h: "Talent",
    l: [
      ["Create a profile", "#/register?type=talent"],
      ["Opportunities", "#/app/opportunities"],
      ["Hackathons", "#/app/hackathons"],
      ["This season's winners", "#talent"],
    ],
  },
  {
    h: "Companies",
    l: [
      ["Register a company", "#/register?type=company"],
      ["Post an opportunity", "#/app/dashboard"],
      ["Swipe talent", "#/app/swipe"],
      ["Sponsor a case", "#hackathons"],
    ],
  },
  {
    h: "Lumora Connect",
    l: [
      ["How it works", "#how"],
      ["Tracks", "#tracks"],
      ["Sign in", "#/login"],
      ["Demo accounts", "#/login"],
    ],
  },
];

function onSection(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (href.startsWith("#/")) return;
  e.preventDefault();
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-cloud/80">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-[36ch] text-[14px] text-mist">The talent network of Lumora IT case competitions. Tashkent, Uzbekistan.</p>
        </div>
        {columns.map((c) => (
          <div key={c.h}>
            <div className="text-[14px] font-semibold">{c.h}</div>
            <ul className="mt-3 space-y-2 text-[14px] text-mist">
              {c.l.map(([label, href]) => (
                <li key={label}>
                  <a href={href} onClick={(e) => onSection(e, href)} className="transition-colors hover:text-ink">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-3 px-5 py-5 text-[13px] text-mist md:px-8">
          <span>2026 Lumora</span>
          <span>Preview build with demo data stored in your browser. English, with Russian and Uzbek coming</span>
        </div>
      </div>
    </footer>
  );
}
