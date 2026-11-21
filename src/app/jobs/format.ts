/* Formatting helpers for postings, shared by the jobs browser, job page, company page and dashboard. */
import { locale, t, tp } from "../../i18n";
import { localNow } from "../../api";
import type { Opportunity, OpportunityLevel, OpportunityType, Schedule, VerificationProof, WorkFormat } from "../../api/types";

export const TYPES: OpportunityType[] = ["Internship", "Work program", "Position", "Event"];
export const LEVELS: OpportunityLevel[] = ["intern", "junior", "middle", "any"];
export const FORMATS: WorkFormat[] = ["onsite", "hybrid", "remote"];
export const SCHEDULES: Schedule[] = ["full-time", "part-time", "project", "event"];

const typeKey: Record<OpportunityType, string> = {
  Internship: "internship",
  "Work program": "program",
  Position: "position",
  Event: "event",
};

export const typeLabel = (x: OpportunityType) => t(`jobs.type.${typeKey[x]}`);
export const levelLabel = (x: OpportunityLevel) => t(`jobs.level.${x}`);
export const formatLabel = (x: WorkFormat) => t(`common.format.${x}`);
export const scheduleLabel = (x: Schedule) => t(`jobs.schedule.${x}`);

/** "Remote" in the seed is a city value; show it translated */
export function cityLabel(city: string) {
  return city === "Remote" ? t("common.format.remote") : city;
}

export function money(n: number) {
  return new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 }).format(n);
}

/** "2 000 000–2 500 000 UZS / month", "Unpaid", or "Free" for events */
export function salaryText(o: Pick<Opportunity, "salaryMin" | "salaryMax" | "type">): string {
  const { salaryMin: min, salaryMax: max } = o;
  if (min == null && max == null) return o.type === "Event" ? t("jobs.salary.free") : t("jobs.salary.unpaid");
  let range: string;
  if (min != null && max != null) range = min === max ? money(min) : `${money(min)}–${money(max)}`;
  else if (min != null) range = t("jobs.salary.from", { n: money(min) });
  else range = t("jobs.salary.upTo", { n: money(max!) });
  return t("jobs.salary.month", { range });
}

export const isPaid = (o: Pick<Opportunity, "salaryMin" | "salaryMax">) => (o.salaryMax ?? o.salaryMin ?? 0) > 0;
export const salarySortValue = (o: Pick<Opportunity, "salaryMin" | "salaryMax">) => o.salaryMax ?? o.salaryMin ?? 0;

export const today = () => localNow().slice(0, 10);

/** days from today to a "YYYY-MM-DD" deadline; negative when it passed */
export function daysLeft(deadline: string): number | null {
  if (!deadline) return null;
  const a = new Date(`${today()}T00:00:00`).getTime();
  const b = new Date(`${deadline.slice(0, 10)}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

export type OpenState = "open" | "closed" | "expired" | "hidden";
export function openState(o: Pick<Opportunity, "closed" | "deadline" | "hidden">): OpenState {
  if (o.hidden) return "hidden";
  if (o.closed) return "closed";
  const d = daysLeft(o.deadline);
  if (d != null && d < 0) return "expired";
  return "open";
}

/** "Closes today", "3 days left"; null when the deadline is not close */
export function deadlineSoon(deadline: string, within = 7): string | null {
  const d = daysLeft(deadline);
  if (d == null || d < 0 || d > within) return null;
  if (d === 0) return t("jobs.deadline.today");
  return tp("jobs.deadline.left", d);
}

export function dateText(day: string) {
  if (!day) return "";
  return new Date(`${day.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" });
}

export function proofLabel(p: VerificationProof) {
  return p ? t(`jobs.proof.${p}`) : "";
}

/** turn "nova.uz" or "@nova_hr" into a link */
export function href(kind: "web" | "telegram" | "linkedin" | "github", v: string): string {
  const s = v.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (kind === "telegram") return `https://t.me/${s.replace(/^@/, "").replace(/^t\.me\//i, "")}`;
  return `https://${s.replace(/^\/+/, "")}`;
}

export const shortUrl = (v: string) => v.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");

/** absolute link to a hash route, for sharing */
export function linkTo(hash: string) {
  return `${window.location.origin}${window.location.pathname}${hash}`;
}

export async function share(hash: string, title: string): Promise<"shared" | "copied" | "failed"> {
  const url = linkTo(hash);
  try {
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title, url });
      return "shared";
    }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

export const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
