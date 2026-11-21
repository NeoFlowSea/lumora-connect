import { useEffect, useState } from "react";

/* Hash router. "#/app/inbox/t1__c1?x=1" -> { path: ["app","inbox","t1__c1"], query: { x: "1" } }.
   Plain anchors like "#about" count as the Lumora home page.

   Site pages (src/landing)
   #/                    Lumora home: a short version of every page below
   #/about               about Lumora, the core team with photos, cities
   #/hackathons          how a round works, the next round, every past round, winning projects, FAQ
   #/contacts            routes to Lumora, channels, what to write in a first message
   #/connect             Lumora Connect landing
   #/?to=about           a section on a page: the page scrolls to the element with that id
   #/connect?to=faq
   App, public and auth routes are listed in src/App.tsx. */

export type Route = { path: string[]; query: Record<string, string> };

function parse(hash: string): Route {
  if (!hash.startsWith("#/")) return { path: [], query: {} };
  const [p, q = ""] = hash.slice(2).split("?");
  const path = p.split("/").filter(Boolean).map(decodeURIComponent);
  const query = Object.fromEntries(new URLSearchParams(q));
  return { path, query };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parse(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

export function go(hash: string) {
  if (window.location.hash === hash) return;
  window.location.hash = hash;
  window.scrollTo({ top: 0 });
}

/** current hash, used to send people back where they were after signing in */
export function here() {
  return window.location.hash || "#/";
}

/** link to a section of a site page: sectionLink("connect", "faq") -> "#/connect?to=faq" */
export type SitePageKey = "" | "about" | "hackathons" | "contacts" | "connect";
export const SITE_PAGES: SitePageKey[] = ["", "about", "hackathons", "contacts", "connect"];

export function sectionLink(page: SitePageKey, id: string) {
  return `#/${page}?to=${encodeURIComponent(id)}`;
}

/** first path segment of a hash, "" for the home page and plain anchors */
export function pageOf(hash: string) {
  return parse(hash).path[0] ?? "";
}

/* Sections that lived on the old single landing and now sit on the Connect page.
   Old links such as "#talent" or "#for-companies" are sent there. */
const CONNECT_SECTIONS = ["jobs", "how", "for-students", "for-companies", "talent"];

/** "#for-companies" -> "#/connect?to=for-companies"; null when the anchor belongs to the home page */
export function legacyAnchor(hash: string): string | null {
  if (!hash.startsWith("#") || hash.startsWith("#/")) return null;
  const id = hash.slice(1);
  return CONNECT_SECTIONS.includes(id) ? sectionLink("connect", id) : null;
}
