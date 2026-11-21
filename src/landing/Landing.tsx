import { useEffect, useState } from "react";
import Lenis from "lenis";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Proof } from "./Proof";
import { Featured } from "./Featured";
import { HowItWorks } from "./HowItWorks";
import { Projects } from "./Projects";
import { NextHackathon } from "./NextHackathon";
import { Quotes } from "./Quotes";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";
import { openApp } from "../pages/PublicFrame";
import { scrollToId, setLenis } from "./parts";
import { GridBackground } from "../components/GridBackground";
import { TouchGlow } from "../components/TouchGlow";

const isTouch = () => window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

/* Public landing page. Order: hero with two doors and job search, real numbers and partners,
   open postings, how it works, winning projects, the next round, Lumora's own lines, FAQ, the doors again. */
export function Landing() {
  const [touch] = useState(isTouch);
  useEffect(() => {
    // smooth scroll only on desktop with a fine pointer; phones keep native scrolling
    const desktop = window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let lenis: Lenis | null = null;
    if (desktop && !reduced) {
      lenis = new Lenis({ lerp: 0.12 });
      setLenis(lenis);
      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    // arriving from another page with "#faq" style links: jump to that section
    const hash = window.location.hash;
    if (hash.length > 1 && !hash.startsWith("#/")) requestAnimationFrame(() => scrollToId(hash.slice(1), false));
    else window.scrollTo({ top: 0 });
    return () => {
      cancelAnimationFrame(raf);
      setLenis(null);
      lenis?.destroy();
    };
  }, []);

  return (
    <>
      {/* interactive grid on desktop, a soft glow that follows the finger on phones */}
      {touch ? <TouchGlow /> : <GridBackground />}
      <div className="min-h-[100svh]">
        <Nav onOpenApp={() => openApp()} />
        <main>
          <Hero />
          <Proof />
          <Featured />
          <HowItWorks />
          <Projects />
          <NextHackathon />
          <Quotes />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
      </div>
    </>
  );
}
