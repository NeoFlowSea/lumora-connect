import { Wordmark } from "../components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-cloud">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-[36ch] text-[14px] text-mist">The talent network of Lumora IT case competitions. Tashkent, Uzbekistan.</p>
        </div>
        {[
          { h: "Talent", l: ["Create profile", "Opportunities", "Hackathons", "Leaderboard"] },
          { h: "Companies", l: ["Post an opportunity", "Swipe talent", "Sponsor a case", "Partner with Lumora"] },
          { h: "Lumora", l: ["About", "Hackathons", "Telegram", "Contact"] },
        ].map((c) => (
          <div key={c.h}>
            <div className="text-[14px] font-semibold">{c.h}</div>
            <ul className="mt-3 space-y-2 text-[14px] text-mist">
              {c.l.map((x) => (
                <li key={x}>
                  <a href="#top" className="transition-colors hover:text-ink">
                    {x}
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
          <span>Preview build. English, with Russian and Uzbek coming</span>
        </div>
      </div>
    </footer>
  );
}
