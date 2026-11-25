import { lumora } from "../../content/lumora";

/* Facts for the intro home (#/) from the team's brief of 25 Nov 2026.
   The next round was announced by the team: 6 December 2026, Holiday Inn Tashkent City.
   The same event is seeded in src/api/seed.ts with this id, so "Register your team" opens it in the app. */
export const NEXT_ROUND = {
  id: "r-tashkent-2026-12",
  start: "2026-12-06T10:00",
  venue: "Holiday Inn Tashkent City",
};

/** headline numbers, November 2026 */
export const NUMBERS = [
  { key: "hackathons", value: `${lumora.numbers.hackathons}` },
  { key: "regions", value: `${lumora.numbers.regions}/14` },
  { key: "participants", value: `${lumora.numbers.students.toLocaleString("en-US")}+` },
  { key: "partners", value: `${lumora.numbers.partners}+` },
] as const;

/** the 14 regions of Uzbekistan, and the words that find a past round there in lumora.rounds[].city */
export const REGIONS: { key: string; match: string[] }[] = [
  { key: "tashkentCity", match: ["Tashkent"] },
  { key: "tashkent", match: [] },
  { key: "andijan", match: ["Andijan"] },
  { key: "bukhara", match: ["Bukhara"] },
  { key: "fergana", match: ["Fergana"] },
  { key: "jizzakh", match: ["Jizzakh"] },
  { key: "kashkadarya", match: ["Karshi", "Qarshi"] },
  { key: "khorezm", match: [] },
  { key: "namangan", match: ["Namangan"] },
  { key: "navoiy", match: [] },
  { key: "samarkand", match: ["Samarkand"] },
  { key: "surkhandarya", match: [] },
  { key: "sirdaryo", match: ["Guliston"] },
  { key: "karakalpakstan", match: ["Nukus"] },
];

/** date of the latest past round in a region, or "" when lumora.rounds has none */
export function latestRound(match: string[]): string {
  if (!match.length) return "";
  return lumora.rounds.find((r) => match.some((m) => r.city.includes(m)))?.date ?? "";
}

/** companies whose cases are named in the brief */
export const CASE_PARTNERS = ["M-Faktor", "Aisha AI", "Capitalist", "AICA and AI Alliance"];

/** winning prototypes named in the brief, in this order */
export const WINNERS = ["RoboAI Mentor 2.0", "Capitalist Dealfeed", "ClassPilot", "InvestorOS"];

/** partners named first in the brief, then the rest from lumora.partners */
const FIRST = ["IT Park Uzbekistan", "StartUp Garage", "Najot Ta'lim", "RoboContest", "AICA", "AI Alliance", "UzCombinator"];
export const PARTNERS = [...FIRST, ...lumora.partners.filter((p) => !FIRST.includes(p))];
