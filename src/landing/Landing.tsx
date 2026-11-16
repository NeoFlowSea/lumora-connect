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
import { RolePicker } from "../components/RolePicker";
import { GridBackground } from "../components/GridBackground";
import { TouchGlow } from "../components/TouchGlow";

const isTouch = () => window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

export function Landing() {
  const [picker, setPicker] = useState(false);
  const [touch] = useState(isTouch);
  const open = () => setPicker(true);

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
      <Nav onOpenApp={open} />
      <main>
        <Hero onOpenApp={open} />
        <Stats />
        <HowItWorks />
        <Categories />
        <Talent onOpenApp={open} />
        <Opportunities onOpenApp={open} />
        <Hackathons onOpenApp={open} />
        <Join />
      </main>
      <Footer />
      <RolePicker open={picker} onClose={() => setPicker(false)} />
    </>
  );
}
