import { useEffect, useState } from "react";
import { useLang } from "../i18n";
import { lumora, photo } from "../content/lumora";

/* Photos from real Lumora rounds on the home hero, changing every few seconds.
   On desktop they sit blurred and come into focus while the cursor is over them (the owner's idea;
   styles in index.css, .peek). Hovering or focusing also holds the current photo. With reduced
   motion nothing changes on its own; the dots still switch photos. */

const PHOTOS = ["school21-group", "tashkent-final", "school21-pitch", "regional-winners", "bukhara-build", "fergana-pitch"];
const EVERY = 4500;

export function HeroPhotos() {
  const { t } = useLang();
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (reduced || hold) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % PHOTOS.length), EVERY);
    return () => window.clearInterval(id);
  }, [reduced, hold]);

  return (
    <div
      className="peek"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <div role="group" aria-roledescription="carousel" aria-label={t("home.hero.photos")} className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-cloud md:aspect-[4/5]">
        {PHOTOS.map((p, k) => (
          <img
            key={p}
            src={photo(p, 800)}
            alt={k === i ? lumora.photos[p] : ""}
            aria-hidden={k === i ? undefined : true}
            width={800}
            height={1000}
            loading={k === 0 ? "eager" : "lazy"}
            decoding="async"
            className={`peek-img absolute inset-0 h-full w-full object-cover ${k === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        {PHOTOS.map((p, k) => (
          <button
            key={p}
            type="button"
            onClick={() => setI(k)}
            aria-label={t("home.hero.photo", { n: k + 1, total: PHOTOS.length })}
            aria-current={k === i ? "true" : undefined}
            className="grid h-11 w-8 place-items-center"
          >
            <span className={`block h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-ink" : "w-1.5 bg-mist/50"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
