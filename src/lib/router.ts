import { useEffect, useState } from "react";

export type Tab = "swipe" | "opportunities" | "hackathons" | "profile";
export type Route = { page: "landing" } | { page: "app"; tab: Tab };

const TABS: Tab[] = ["swipe", "opportunities", "hackathons", "profile"];

function parse(hash: string): Route {
  const m = hash.match(/^#\/app\/?([a-z]+)?/);
  if (m) {
    const tab = TABS.includes(m[1] as Tab) ? (m[1] as Tab) : "swipe";
    return { page: "app", tab };
  }
  return { page: "landing" };
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
  window.location.hash = hash;
  window.scrollTo({ top: 0 });
}
