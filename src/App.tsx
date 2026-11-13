import { useEffect } from "react";
import Lenis from "lenis";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Stats } from "./components/Stats";
import { HowItWorks } from "./components/HowItWorks";
import { Categories } from "./components/Categories";
import { Talent } from "./components/Talent";
import { Opportunities } from "./components/Opportunities";
import { Join } from "./components/Join";
import { Footer } from "./components/Footer";

export default function App() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
  }, []);

  return (
    <div className="grain">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <Categories />
        <Talent />
        <Opportunities />
        <Join />
      </main>
      <Footer />
    </div>
  );
}
