import { useEffect, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../i18n";
import { lumora, photo } from "../content/lumora";

/* Photos from real Lumora rounds on the home hero. They change on their own every 6 seconds,
   on every device; the arrows on the sides and the dots switch them by hand (and restart the timer).
   On desktop the photos sit blurred and come into focus while the cursor is over them, or while
   a keyboard user is on the arrows (styles in index.css, .peek). The owner asked for both.
   The photo sits in a liquid glass frame, and the arrows and dots are small glass controls
   (.glass in index.css); the frame's sheen follows the cursor. */

const PHOTOS = ["school21-group", "tashkent-final", "school21-pitch", "regional-winners", "bukhara-build", "fergana-pitch"];
const EVERY = 6000;

/** move the glass sheen to the cursor */
function sheen(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
}

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
  const arrow = "glass glass-dark absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-white transition-transform hover:scale-105";

  return (
    <div className="peek glass rounded-[28px] p-2" onMouseMove={sheen}>
      <div role="group" aria-roledescription="carousel" aria-label={t("home.hero.photos")} className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] bg-cloud md:aspect-[4/5] lg:aspect-square">
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
        {/* dots in a glass pill over the bottom of the photo */}
        <div className="glass glass-dark absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 rounded-full px-1.5">
          {PHOTOS.map((p, k) => (
            <button
              key={p}
              type="button"
              onClick={() => go(k)}
              aria-label={t("home.hero.photo", { n: k + 1, total: n })}
              aria-current={k === i ? "true" : undefined}
              className="relative z-10 grid h-11 w-7 place-items-center"
            >
              <span className={`block h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-white" : "w-1.5 bg-white/55"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
