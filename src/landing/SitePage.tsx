import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { SiteTabs } from "./SiteTabs";
import { openApp } from "../pages/PublicFrame";
import { scrollToId, setLenis } from "./parts";

/* Frame of the two site pages, the Lumora home and Lumora Connect: background, header,
   smooth scroll on desktop, footer and the bottom tab bar on phones.
   `to` is the section to open at ("#/?to=about"), or a plain anchor ("#faq"). */
export function SitePage({ to, children }: { to?: string; children: ReactNode }) {
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
    return () => {
      cancelAnimationFrame(raf);
      setLenis(null);
      lenis?.destroy();
    };
  }, []);

  // open at the requested section, or at the top. Sections above it fill in from the API a moment
  // later and push it down, so the jump repeats twice while the page settles.
  useEffect(() => {
    const hash = window.location.hash;
    const id = to ?? (hash.length > 1 && !hash.startsWith("#/") ? hash.slice(1) : "");
    if (!id) {
      window.scrollTo({ top: 0 });
      return;
    }
    scrollToId(id, false);
    const timers = [150, 500].map((ms) => window.setTimeout(() => scrollToId(id, false), ms));
    return () => timers.forEach(window.clearTimeout);
  }, [to]);

  return (
    <>
      <div className="min-h-[100svh] pb-16 md:pb-0">
        <Nav onOpenApp={() => openApp()} />
        <main>{children}</main>
        <Footer />
      </div>
      <SiteTabs />
    </>
  );
}
