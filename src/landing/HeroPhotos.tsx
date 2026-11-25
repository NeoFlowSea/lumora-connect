import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../i18n";
import { lumora, photo } from "../content/lumora";

/* Photos from real Lumora rounds on the home hero. They change on their own every 6 seconds,
   on every device; the arrows on the sides and the dots switch them by hand (and restart the timer).
   On desktop the photos sit blurred and come into focus while the cursor is over them, or while
   a keyboard user is on the arrows (styles in index.css, .peek). The owner asked for both. */

const PHOTOS = ["school21-group", "tashkent-final", "school21-pitch", "regional-winners", "bukhara-build", "fergana-pitch"];
const EVERY = 6000;

export function HeroPhotos() {
  const { t } = useLang();
  const [i, setI] = useState(0);
  const [tick, setTick] = useState(0); // restarts the timer after a manual switch
  const n = PHOTOS.length;

  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % n), EVERY);
    return () => window.clearInterval(id);
  }, [tick, n]);

  const go = (k: number) => {
    setI(((k % n) + n) % n);
    setTick((x) => x + 1);
  };
  const arrow =
    "absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper/80 text-ink transition-colors hover:bg-paper";

  return (
    <div className="peek">
      <div role="group" aria-roledescription="carousel" aria-label={t("home.hero.photos")} className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-cloud md:aspect-[4/5] lg:aspect-square">
        {PHOTOS.map((p, k) => (
          <img
            key={p}
            src={photo(p, 800)}
            alt={k === i ? lumora.photos[p] : ""}
            aria-hidden={k === i ? undefined : true}
            width={800}
            height={800}
            loading={k === 0 ? "eager" : "lazy"}
            decoding="async"
            className={`peek-img absolute inset-0 h-full w-full object-cover ${k === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <button type="button" onClick={() => go(i - 1)} aria-label={t("home.hero.prev")} className={`${arrow} left-3`}>
          <ChevronLeft size={22} aria-hidden />
        </button>
        <button type="button" onClick={() => go(i + 1)} aria-label={t("home.hero.next")} className={`${arrow} right-3`}>
          <ChevronRight size={22} aria-hidden />
        </button>
      </div>
      <div className="mt-2 flex justify-center">
        {PHOTOS.map((p, k) => (
          <button
            key={p}
            type="button"
            onClick={() => go(k)}
            aria-label={t("home.hero.photo", { n: k + 1, total: n })}
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
