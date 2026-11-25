import { useSyncExternalStore } from "react";
import { common } from "./dict/common";
import { landing } from "./dict/landing";
import { auth } from "./dict/auth";
import { profile } from "./dict/profile";
import { jobs } from "./dict/jobs";
import { app } from "./dict/app";
import { admin } from "./dict/admin";
import { legal } from "./dict/legal";
import { api } from "./dict/api";
import { home } from "./dict/home";
import { intro } from "./dict/intro";

/* Three interface languages. Every screen reads its strings through t("area.key").
   Dictionaries live in src/i18n/dict/<area>.ts, one file per area, each with en, ru and uz.
   English is the fallback: a key missing in ru or uz shows the English text, and a key
   missing everywhere shows the key itself, so gaps are easy to spot. */

export type Lang = "en" | "ru" | "uz";
export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "uz", label: "O'zbekcha", short: "UZ" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "en", label: "English", short: "EN" },
];

type Dict = Record<string, string>;
type Area = { en: Dict; ru: Dict; uz: Dict };

const areas: Record<string, Area> = { common, landing, home, intro, auth, profile, jobs, app, admin, legal, api };

const KEY = "lumora-lang";
const listeners = new Set<() => void>();

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "ru" || saved === "uz") return saved;
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("uz")) return "uz";
  if (nav.startsWith("ru")) return "ru";
  return "en";
}

let current: Lang = detect();
document.documentElement.lang = current;

export function getLang(): Lang {
  return current;
}

export function setLang(l: Lang) {
  current = l;
  document.documentElement.lang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

/** "en-GB" style locale for dates and numbers */
export function locale(l: Lang = current): string {
  return l === "ru" ? "ru-RU" : l === "uz" ? "uz-Latn-UZ" : "en-GB";
}

/**
 * Translate "area.key". Variables: t("jobs.left", { n: 3 }) fills {n}.
 * Plurals: keys ending in "_one" / "_few" / "_many" / "_other" are picked by tp().
 */
export function t(key: string, vars?: Record<string, string | number>, l: Lang = current): string {
  const dot = key.indexOf(".");
  const area = areas[key.slice(0, dot)];
  const k = key.slice(dot + 1);
  let s = area?.[l]?.[k] ?? area?.en?.[k] ?? key;
  if (vars) for (const [name, v] of Object.entries(vars)) s = s.split(`{${name}}`).join(String(v));
  return s;
}

/** label for a track id such as "Data & AI"; the id itself is kept in data */
export function trackLabel(name: string): string {
  const k = `common.track.${name}`;
  const v = t(k);
  return v === k ? name : v;
}

/** plural-aware translate: tp("app.teams", 5) looks up app.teams_one / _few / _many / _other */
export function tp(key: string, n: number, vars?: Record<string, string | number>): string {
  const rule = new Intl.PluralRules(locale()).select(n);
  const dot = key.indexOf(".");
  const area = areas[key.slice(0, dot)];
  const base = key.slice(dot + 1);
  const pick = (l: Lang) => area?.[l]?.[`${base}_${rule}`] ?? area?.[l]?.[`${base}_other`];
  return fill(pick(current) ?? pick("en") ?? key, { n, ...vars });
}

function fill(s: string, vars: Record<string, string | number>) {
  for (const [name, v] of Object.entries(vars)) s = s.split(`{${name}}`).join(String(v));
  return s;
}

/** Re-render on language change. Returns the same t, tp and the current language. */
export function useLang() {
  const lang = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => current,
  );
  return { lang, setLang, t, tp };
}
