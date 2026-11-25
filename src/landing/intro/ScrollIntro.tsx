import { useEffect, useRef, useState } from "react";
import { useLang } from "../../i18n";
import { Stable } from "../../i18n/Stable";
import { lumora } from "../../content/lumora";
import { onAnchor, wrap } from "../parts";
import { LogoPath, STEPS } from "./LogoPath";
import type { LogoScene } from "./LogoScene";

const FINAL = STEPS.length; // 6

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

/** scroll progress through the section (0..1) to a step: a short pause on the sphere, six steps, then the logo */
function stepAt(p: number): number {
  if (p < 0.06) return 0;
  return Math.min(FINAL, 1 + Math.floor((p - 0.06) / 0.14));
}

/* Top of the Lumora home, above the hero: the logo assembles as the visitor scrolls,
   talent, learn, idea, build, demo, defend. The section is two screens tall and its content is
   sticky, so the page scrolls normally (no scroll-jacking); the scroll position picks the step.
   Text is HTML. Phones get the same light SVG; desktop loads three.js once the logo is complete
   and shows it in 3D behind the stage. Reduced motion shows the finished logo at once. */
export function ScrollIntro() {
  const { t } = useLang();
  const section = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<LogoScene | null>(null);
  const [reduced] = useState(reducedMotion);
  const [step, setStep] = useState(() => (reduced ? FINAL : 0));
  const [three, setThree] = useState(false);
  const done = step >= FINAL;

  // the step follows the scrollbar
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = section.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const range = el.offsetHeight - window.innerHeight;
      const p = range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 1;
      setStep(stepAt(p));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  // once the logo is complete, load three.js on desktop and show the logo in 3D behind the stage
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
    <section ref={section} id="intro" aria-labelledby="intro-title" className={reduced ? "" : "h-[210svh]"}>
      <div className={`${reduced ? "" : "sticky top-0"} flex min-h-[100svh] items-center overflow-hidden pb-20 pt-20 md:pb-10 md:pt-24`}>
        <div className={`${wrap} grid items-center gap-6 md:grid-cols-[1.1fr_0.9fr] md:gap-12`}>
          <div className="relative z-10">
            <p className="text-[15px] font-medium text-sky"><Stable k="intro.kicker" /></p>
            <h2 id="intro-title" className="mt-3 text-balance text-[clamp(28px,4.4vw,56px)] font-semibold leading-[1.05] tracking-[-0.035em]">
              <Stable texts={lumora.slogans.demo} />
            </h2>

            {/* the current step; screen readers get the whole path from the stage label instead */}
            <div aria-hidden="true" className="mt-4 min-h-[84px] md:mt-10">
              {key ? (
                <>
                  <div className="text-[13px] tabular-nums text-sky">
                    {step + 1} / {STEPS.length}
                  </div>
                  <div className="text-[clamp(24px,2.6vw,32px)] font-semibold leading-tight tracking-[-0.02em]">{t(`intro.step.${key}`)}</div>
                  <div className="text-[15px] text-mist">{t(`intro.step.${key}.sub`)}</div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-x-2 text-[15px] font-medium">
                    {STEPS.map((s, i) => (
                      <span key={s}>
                        {t(`intro.step.${s}`)}
                        {i < STEPS.length - 1 && <span className="pl-2 text-mist">·</span>}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-[15px] text-mist">{t("intro.step.final.sub")}</div>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href="#/?to=top"
                onClick={(e) => onAnchor(e, "#/?to=top")}
                className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-[15px] font-medium transition-colors hover:border-sky hover:bg-tint"
              >
                {t("intro.skip")}
              </a>
              {step === 0 && !reduced && <span className="text-[14px] text-mist">{t("intro.scrollHint")}</span>}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[min(190px,22svh)] sm:max-w-[260px] md:max-w-[340px] lg:max-w-[380px]">
            {/* 3D logo: bigger than the stage, behind it, 22% */}
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
        </div>
      </div>
    </section>
  );
}
