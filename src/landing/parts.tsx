import type { MouseEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import type Lenis from "lenis";
import { t } from "../i18n";
import { pageOf } from "../lib/router";

/* Small pieces shared by the landing sections, the site header and the footer. */

/* ---------- section anchors ---------- */

let lenis: Lenis | null = null;
export function setLenis(l: Lenis | null) {
  lenis = l;
}

const NAV_OFFSET = 76;

/** Scroll to a section on this page. Returns false when the section is not here (another page). */
export function scrollToId(id: string, smooth = true): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (lenis && smooth && !reduced) lenis.scrollTo(el, { offset: -NAV_OFFSET });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET, behavior: smooth && !reduced ? "smooth" : "auto" });
  return true;
}

/** onClick for section links ("#faq", "#/?to=about", "#/connect?to=faq", "#/"):
    when the section is on the page already open, scroll to it; otherwise let the browser open that page. */
export function onAnchor(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith("#")) return;
  if (!href.startsWith("#/")) {
    if (scrollToId(href.slice(1))) e.preventDefault();
    return;
  }
  if (pageOf(href) !== pageOf(window.location.hash)) return;
  const [path, q = ""] = href.slice(2).split("?");
  if (path.includes("/")) return; // deeper routes are real pages
  if (scrollToId(new URLSearchParams(q).get("to") ?? "top")) e.preventDefault();
}

/* ---------- layout ---------- */

export const wrap = "mx-auto w-full max-w-[1200px] px-5 md:px-8";

export function Section({ id, className = "", children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`py-16 md:py-24 ${className}`}>
      <div className={wrap}>{children}</div>
    </section>
  );
}

/** the one fade a section gets when it scrolls into view */
export function Fade({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** a list item that rises into view a beat after its neighbour */
export function Rise({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <motion.li
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (i % 3) * 0.08 }}
    >
      {children}
    </motion.li>
  );
}

/** spotlight that follows the cursor on cards with the "spot" class */
export function spotMove(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function SectionHead({ title, lead, aside }: { title: ReactNode; lead?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 md:mb-10">
      <div className="max-w-[880px]">
        <h2 className="text-[clamp(26px,3.2vw,40px)] tracking-[-0.025em]">{title}</h2>
        {lead && <p className="mt-3 text-[16px] text-mist">{lead}</p>}
      </div>
      {aside}
    </div>
  );
}

/* ---------- bits ---------- */

/** "Sample" tag for seeded postings and events */
export function SampleTag({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md border border-line px-1.5 py-0.5 text-[12px] font-medium leading-tight text-mist ${className}`}>
      {label ?? t("landing.sample")}
    </span>
  );
}

/** company logo, or a monogram tile in the company's own color */
export function Monogram({ name, hue, logo, size = 44 }: { name: string; hue?: string; logo?: string; size?: number }) {
  if (logo) return <img src={logo} alt="" width={size} height={size} className="shrink-0 rounded-lg bg-white object-contain" style={{ width: size, height: size }} />;
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-lg font-semibold text-white"
      style={{ width: size, height: size, background: hue || "#3d7bfa", fontSize: Math.round(size * 0.34) }}
    >
      {letters}
    </span>
  );
}

export const isExternal = (href: string) => /^https?:/.test(href);
