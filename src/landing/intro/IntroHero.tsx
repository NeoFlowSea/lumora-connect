import { useEffect, useRef, useState } from "react";
import { locale, useLang } from "../../i18n";
import { Stable } from "../../i18n/Stable";
import { lumora } from "../../content/lumora";
import { btn } from "../../components/ui";
import { onAnchor, wrap } from "../parts";
import { LogoPath, STEPS } from "./LogoPath";
import { NEXT_ROUND } from "./content";
import type { LogoScene } from "./LogoScene";
import { registerTeam } from "./register";

const SEEN = "lumora-intro-seen";
const FINAL = STEPS.length; // 6
const STEP_MS = 950;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** WebGL is there and the device can afford it: desktop pointer, wide screen, motion allowed */
function canRun3D(): boolean {
  if (!window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches || reducedMotion()) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/* First screen of the home page. The headline, both buttons and the header are plain HTML and
   visible from the first paint; the logo intro plays beside them and never covers them.
   About 6 seconds, once per visit (sessionStorage), skippable, finished at once with reduced motion. */
export function IntroHero() {
  const { t } = useLang();
  const date = new Date(NEXT_ROUND.start).toLocaleDateString(locale(), { day: "numeric", month: "long" });

  return (
    <section id="top" className="relative overflow-hidden pb-14 pt-24 md:pb-20 md:pt-32">
      <div className={`${wrap} grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14`}>
        <div className="relative z-10">
          <p className="text-[15px] font-medium text-sky"><Stable k="intro.hero.kicker" /></p>
          <h1 className="mt-4 text-balance text-[clamp(34px,4.8vw,62px)] font-semibold leading-[1.04] tracking-[-0.035em]">
            <Stable texts={lumora.slogans.demo} />
          </h1>
          <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-mist md:text-[18px]"><Stable k="intro.hero.text" /></p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={registerTeam} className={`${btn.primary} !min-h-13 !px-6 !text-[16px]`}>
              {t("intro.nav.register")}
            </button>
            <a href="#/?to=companies" onClick={(e) => onAnchor(e, "#/?to=companies")} className={`${btn.ghost} !min-h-13 !px-6 !text-[16px]`}>
              {t("intro.hero.partner")}
            </a>
          </div>
          <p className="mt-3 text-[15px] text-mist">
            <a href="#/?to=next" onClick={(e) => onAnchor(e, "#/?to=next")} className="inline-flex min-h-11 items-center underline-offset-4 hover:text-ink hover:underline">
              {t("intro.hero.next", { date, venue: NEXT_ROUND.venue })}
            </a>
          </p>
        </div>

        <Stage />
      </div>
    </section>
  );
}

function Stage() {
  const { t } = useLang();
  const [step, setStep] = useState(() => {
    try {
      if (reducedMotion() || sessionStorage.getItem(SEEN)) return FINAL;
    } catch {
      /* storage off: play */
    }
    return 0;
  });
  const [three, setThree] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const scene = useRef<LogoScene | null>(null);
  const [seen, setSeen] = useState(false);
  const done = step >= FINAL;

  // on phones the stage sits under the buttons: start only once it is on screen
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // one step a little under a second; the timer lives in the effect, so skip and unmount stop it
  useEffect(() => {
    if (done) {
      try {
        sessionStorage.setItem(SEEN, "1");
      } catch {
        /* ignore */
      }
      return;
    }
    if (!seen) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 1100 : STEP_MS);
    return () => window.clearTimeout(id);
  }, [step, done, seen]);

  // after the logo is assembled, load three.js and move the logo to the background in 3D
  useEffect(() => {
    if (!done || scene.current || !host.current || !canRun3D()) return;
    let cancelled = false;
    const el = host.current;
    import("./LogoScene")
      .then((m) => {
        if (cancelled) return;
        scene.current = m.mountLogoScene(el, () => !cancelled && setThree(true));
      })
      .catch(() => {
        /* no 3D: the SVG logo stays */
      });
    return () => {
      cancelled = true;
    };
  }, [done]);

  useEffect(() => () => scene.current?.dispose(), []);
  useEffect(() => scene.current?.setActive(done), [done]);

  const show3D = three && done;
  const key = done ? null : STEPS[step];

  return (
    <div className="relative w-full">
      <div ref={box} className="relative mx-auto w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[380px]">
        {/* 3D logo: bigger than the stage, behind everything, 22% */}
        <div
          ref={host}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[30%] -inset-y-[20%] transition-opacity duration-[1400ms]"
          style={{ opacity: show3D ? 0.22 : 0 }}
        />
        <div role="img" aria-label={t("intro.stage.label")} className="intro-stage relative aspect-[322/392]">
          <LogoPath step={step} faded={show3D} />
        </div>
      </div>

      <div className="relative mt-6 flex min-h-[76px] flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div aria-hidden="true" className="min-w-0">
          {key ? (
            <>
              <div className="text-[13px] tabular-nums text-sky">
                {step + 1} / {STEPS.length}
              </div>
              <div className="text-[clamp(24px,2.4vw,30px)] font-semibold leading-tight tracking-[-0.02em]">{t(`intro.step.${key}`)}</div>
              <div className="text-[15px] text-mist">{t(`intro.step.${key}.sub`)}</div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-2 text-[14px] font-medium text-ink/90">
                {STEPS.map((s, i) => (
                  <span key={s}>
                    {t(`intro.step.${s}`)}
                    {i < STEPS.length - 1 && <span className="pl-2 text-mist">·</span>}
                  </span>
                ))}
              </div>
              <div className="mt-1 text-[14px] text-mist">{t("intro.step.final.sub")}</div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setStep(done ? 0 : FINAL)}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-line px-3.5 text-[14px] font-medium text-ink transition-colors hover:border-sky hover:bg-tint"
        >
          {done ? t("intro.stage.replay") : t("intro.stage.skip")}
        </button>
      </div>
    </div>
  );
}
