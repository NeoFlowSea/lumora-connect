import { useEffect, useState } from "react";
import Lenis from "lenis";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Stats } from "./Stats";
import { HowItWorks } from "./HowItWorks";
import { Categories } from "./Categories";
import { Talent } from "./Talent";
import { Opportunities } from "./Opportunities";
import { Hackathons } from "./Hackathons";
import { Join } from "./Join";
import { Footer } from "./Footer";
import { currentUser } from "../api";
import { defaultTab } from "../app/AppShell";
import { go } from "../lib/router";
import { GridBackground } from "../components/GridBackground";
import { TouchGlow } from "../components/TouchGlow";

const isTouch = () => window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

export function Landing() {
  const [touch] = useState(isTouch);
  // signed in: straight into the app; otherwise to sign in, and back here after
  const open = (target?: string) => {
    const u = currentUser();
    if (u) go(u.kind === "admin" ? "#/admin" : target ?? `#/app/${defaultTab(u)}`);
    else go(`#/login${target ? `?next=${encodeURIComponent(target)}` : ""}`);
  };
  const openEvent = (id?: string) => open(id ? `#/app/hackathons/${id}` : "#/app/hackathons");

  useEffect(() => {
    // smooth scroll only on desktop; phones keep native scrolling
    if (touch || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [touch]);

  return (
    <>
      {touch ? <TouchGlow /> : <GridBackground />}
      <Nav onOpenApp={() => open()} />
      <main>
        <Hero onOpenApp={() => open()} />
        <Stats />
        <HowItWorks />
        <Categories />
        <Talent onOpenApp={() => open("#/app/swipe")} />
        <Opportunities onOpenApp={() => open("#/app/opportunities")} />
        <Hackathons onOpen={openEvent} />
        <Join />
      </main>
      <Footer />
    </>
  );
}
