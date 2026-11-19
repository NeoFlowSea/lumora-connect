import { useEffect, useState } from "react";

/* Hash router. "#/app/inbox/t1__c1?x=1" -> { path: ["app","inbox","t1__c1"], query: { x: "1" } }.
   Plain anchors like "#how" count as the landing page. */

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
