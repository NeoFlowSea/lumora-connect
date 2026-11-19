import { useState, type KeyboardEvent } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { EventAccent, EventStatus, EventType, Hackathon, HackathonInput } from "../../api/types";
import { inputCls } from "../../components/form";

/* Helpers shared by the event list, editor and teams screens. */

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "hackathon", label: "Hackathon" },
  { value: "case", label: "IT case competition" },
  { value: "meetup", label: "Meetup" },
  { value: "workshop", label: "Workshop" },
];

export const typeLabel = (t: EventType) => EVENT_TYPES.find((x) => x.value === t)?.label ?? t;

export const STATUSES: { value: EventStatus; label: string; hint: string }[] = [
  { value: "draft", label: "Draft", hint: "Only admins can see it. Nothing is public yet." },
  { value: "published", label: "Published", hint: "Visible to everyone, registration not open yet." },
  { value: "registration_open", label: "Registration open", hint: "Participants can register teams now." },
  { value: "registration_closed", label: "Registration closed", hint: "Visible, but no new teams can join." },
  { value: "in_progress", label: "In progress", hint: "The event is running. Registered leads were notified." },
  { value: "finished", label: "Finished", hint: "Over. Assign results to award winner badges." },
  { value: "cancelled", label: "Cancelled", hint: "Shown as cancelled. Registered leads get a notification." },
];

export function statusTone(s: EventStatus): "tint" | "blue" | "line" | "good" {
  if (s === "registration_open") return "good";
  if (s === "in_progress") return "blue";
  if (s === "published" || s === "registration_closed") return "tint";
  return "line";
}

export const ACCENTS: { value: EventAccent; label: string; swatch: string; card: string; sub: string }[] = [
  { value: "blue", label: "Blue", swatch: "bg-blue", card: "bg-blue text-white", sub: "text-white/80" },
  { value: "yellow", label: "Yellow", swatch: "bg-accent", card: "bg-accent text-paper", sub: "text-paper/75" },
  { value: "sky", label: "Sky", swatch: "bg-sky", card: "bg-sky text-paper", sub: "text-paper/75" },
  { value: "navy", label: "Navy", swatch: "bg-paper ring-1 ring-line", card: "bg-paper text-ink ring-1 ring-line", sub: "text-mist" },
];

export const accentOf = (a: EventAccent) => ACCENTS.find((x) => x.value === a) ?? ACCENTS[0];

export const LANGUAGES = ["Uzbek", "Russian", "English", "Karakalpak"];

export function ordinal(n: number): string {
  const s = n % 100;
  if (s >= 11 && s <= 13) return `${n}th`;
  const r = n % 10;
  return `${n}${r === 1 ? "st" : r === 2 ? "nd" : r === 3 ? "rd" : "th"}`;
}

/** "YYYY-MM-DDTHH:MM" in local time */
export function toLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function defaultEvent(): HackathonInput {
  const start = new Date();
  start.setDate(start.getDate() + 14);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(18, 0, 0, 0);
  const regOpen = new Date();
  regOpen.setMinutes(0, 0, 0); // open from the current hour, so "registration open" works right away
  const regClose = new Date(start);
  regClose.setDate(regClose.getDate() - 3);
  regClose.setHours(23, 59, 0, 0);
  return {
    title: "",
    organizerId: "lumora",
    organizerName: "Lumora",
    eventType: "case",
    short: "",
    description: "",
    caseBrief: "",
    accent: "blue",
    city: "Tashkent",
    venue: "",
    address: "",
    mode: "offline",
    onlineLink: "",
    start: toLocal(start),
    end: toLocal(end),
    timezone: "Asia/Tashkent",
    regOpen: toLocal(regOpen),
    regClose: toLocal(regClose),
    tracks: ["Frontend", "Backend", "Product & Startup"],
    teamMin: 3,
    teamMax: 5,
    soloAllowed: false,
    maxTeams: 30,
    ageMin: 14,
    ageMax: 25,
    eligibility: "Students and young developers from Uzbekistan.",
    languages: ["Uzbek", "Russian", "English"],
    places: [1, 2, 3].map((p) => ({ place: p, title: `${ordinal(p)} place`, prize: "" })),
    nominations: [],
    finalists: 0,
    judges: [],
    mentors: [],
    sponsors: [],
    agenda: [],
    status: "draft",
    registrationFields: { github: true, portfolio: false, motivation: false, phone: false },
  };
}

export function toInput(h: Hackathon): HackathonInput {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, results, ...rest } = h;
  return JSON.parse(JSON.stringify(rest)) as HackathonInput;
}

/** number field with minus and plus buttons */
export function Stepper({ value, onChange, min = 0, max = 999, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, Number.isFinite(v) ? v : min)));
  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-paper/60">
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => set(value - 1)} disabled={value <= min} className="grid w-10 shrink-0 place-items-center text-mist hover:bg-tint hover:text-ink disabled:opacity-40">
        <Minus size={14} />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        value={value}
        onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
        className="w-full min-w-0 bg-transparent py-2.5 text-center text-[14px] text-ink outline-none"
      />
      <button type="button" aria-label={`Increase ${label}`} onClick={() => set(value + 1)} disabled={value >= max} className="grid w-10 shrink-0 place-items-center text-mist hover:bg-tint hover:text-ink disabled:opacity-40">
        <Plus size={14} />
      </button>
    </div>
  );
}

/** free tags: type and press Enter or comma to add, click x to remove */
export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().replace(/,$/, "");
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div className="grid gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-tint py-1 pl-3 pr-1.5 text-[12px] font-semibold text-sky">
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-tint-2">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} placeholder={placeholder} className={inputCls} />
        <button type="button" onClick={add} disabled={!draft.trim()} className="shrink-0 rounded-xl border border-line px-3 text-[13px] font-semibold text-mist hover:border-sky hover:text-ink disabled:opacity-40">
          Add
        </button>
      </div>
    </div>
  );
}
