import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { locale, t } from "../i18n";

/* Shared form and state primitives. Use these in every screen so inputs,
   cards, empty and error states look the same everywhere. */

export const inputCls =
  "min-h-11 w-full rounded-lg border border-line bg-paper/60 px-3 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-mist/70 focus:border-sky disabled:opacity-60";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-[13px] font-medium text-mist">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-mist">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${inputCls} resize-y ${props.className ?? ""}`} />;
}

export function Select({ options, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { value: string; label: string })[] }) {
  return (
    <select {...props} className={`${inputCls} ${props.className ?? ""}`}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return (
          <option key={v} value={v} className="bg-surface">
            {l}
          </option>
        );
      })}
    </select>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-11 items-center gap-3 text-left text-[14px]">
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-paper/80 ring-1 ring-line"}`}>
        <motion.span
          className={`absolute top-1 h-4 w-4 rounded-full ${checked ? "bg-paper" : "bg-mist"}`}
          animate={{ left: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

/** multi-select as chips */
export function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`min-h-9 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              on ? "border-sky bg-tint text-ink" : "border-line text-mist hover:border-sky hover:text-ink"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-surface p-5 md:p-6 ${className}`}>{children}</section>;
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line p-8 text-center md:p-10">
      {icon && <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-tint text-sky">{icon}</div>}
      <div className="font-display text-[17px] font-semibold">{title}</div>
      {text && <p className="mt-1.5 max-w-[46ch] text-[13px] text-mist">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-mist" role="status">
      <Loader2 size={16} className="animate-spin" /> {label ?? t("common.state.loading")}
    </div>
  );
}

/** skeleton blocks for lists while the first load runs */
export function Skeleton({ rows = 3, className = "h-24" }: { rows?: number; className?: string }) {
  return (
    <div className="grid gap-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded-xl bg-surface/70 ${className}`} />
      ))}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2.5 text-[13px] text-[#ffb3b3]">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function Spinner() {
  return <Loader2 size={15} className="animate-spin" />;
}

/** "3 days ago" style relative time, in the interface language */
export function ago(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return t("common.time.justNow");
  if (s < 3600) return t("common.time.minAgo", { n: Math.floor(s / 60) });
  if (s < 86400) return t("common.time.hAgo", { n: Math.floor(s / 3600) });
  const d = Math.floor(s / 86400);
  if (d < 30) return t(d === 1 ? "common.time.dayAgo" : "common.time.daysAgo", { n: d });
  return new Date(iso).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });
}

/** "20 December 2026, 10:00" from "2026-12-20T10:00", in the interface language */
export function when(local: string, withTime = true): string {
  if (!local) return "";
  const d = new Date(local);
  const date = d.toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" });
  return withTime ? `${date}, ${local.slice(11, 16)}` : date;
}
