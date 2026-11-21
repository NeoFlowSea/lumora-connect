import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Camera, Plus, Trash2, X } from "lucide-react";
import { useLang } from "../i18n";
import { initials } from "../components/ui";
import { ErrorNote, Input, Select, Spinner } from "../components/form";
import { CITIES, cityLabel } from "./options";
import { imageToDataUrl } from "./media";

/* Small inputs shared by onboarding and the profile editor. */

type Opt = { value: string; label: string };

/** multi-select chips with translated labels */
export function OptionChips({ options, value, onChange, label }: { options: Opt[]; value: string[]; onChange: (v: string[]) => void; label?: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}
            className={`min-h-10 rounded-lg border px-3 py-1.5 text-[14px] font-medium transition-colors ${
              on ? "border-sky bg-tint text-ink" : "border-line text-mist hover:border-sky hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** two or three options in one row, one selected */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border border-line p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-10 rounded-md px-3 text-[14px] font-semibold transition-colors ${value === o.value ? "bg-blue text-white" : "text-mist hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Chosen values as removable tags, suggestions to tap, and a field for custom entries.
 * `labelFor` translates known values; custom entries show as typed.
 */
export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  labelFor = (v) => v,
  max = 20,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  labelFor?: (v: string) => string;
  max?: number;
}) {
  const { t } = useLang();
  const [text, setText] = useState("");
  const left = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));

  function add(raw: string) {
    const v = raw.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!v || value.length >= max || value.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onChange([...value, v]);
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
      setText("");
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="grid gap-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((v) => (
            <li key={v} className="inline-flex min-h-9 items-center gap-1 rounded-md bg-tint py-1 pl-3 pr-1 text-[14px] font-medium text-ink">
              {labelFor(v)}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== v))}
                aria-label={t("profile.tags.remove", { v: labelFor(v) })}
                className="grid h-7 w-7 place-items-center rounded-md text-mist hover:bg-tint-2 hover:text-ink"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} placeholder={placeholder ?? t("profile.tags.placeholder")} maxLength={40} />
        <button
          type="button"
          onClick={() => {
            add(text);
            setText("");
          }}
          disabled={!text.trim()}
          aria-label={t("common.action.add")}
          className="grid min-h-11 w-11 shrink-0 place-items-center rounded-lg border border-line text-mist transition-colors hover:border-sky hover:text-ink disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </div>
      {left.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-mist">{t("profile.tags.suggested")}</span>
          {left.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex min-h-9 items-center gap-1 rounded-md border border-dashed border-line px-2.5 text-[13px] text-mist transition-colors hover:border-sky hover:text-ink"
            >
              <Plus size={12} /> {labelFor(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** city select with the main Uzbek cities and an "Other" option that opens a text field */
export function CitySelect({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  const { t } = useLang();
  const known = !value || CITIES.includes(value);
  const [other, setOther] = useState(!known);
  const sel = other ? "__other" : value;
  return (
    <div className="grid gap-2">
      <Select
        id={id}
        value={sel}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__other") {
            setOther(true);
            onChange("");
          } else {
            setOther(false);
            onChange(v);
          }
        }}
        options={[{ value: "", label: t("profile.city.choose") }, ...CITIES.map((c) => ({ value: c, label: cityLabel(c) })), { value: "__other", label: t("profile.city.other") }]}
      />
      {other && <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={t("profile.city.otherPlaceholder")} aria-label={t("profile.city.otherPlaceholder")} maxLength={60} />}
    </div>
  );
}

/** photo or initials */
export function Face({ src, name, size = 48, square = false }: { src?: string; name: string; size?: number; square?: boolean }) {
  const shape = square ? "rounded-xl" : "rounded-full";
  if (src) return <img src={src} alt="" width={size} height={size} className={`${shape} shrink-0 bg-white object-cover`} style={{ width: size, height: size }} />;
  return (
    <span
      aria-hidden
      className={`${shape} inline-grid shrink-0 place-items-center bg-blue font-semibold text-white`}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.32)) }}
    >
      {initials(name || "?").toUpperCase()}
    </span>
  );
}

/** upload, preview and remove a photo or logo; the image is downscaled before it is stored */
export function PhotoPicker({ value, onChange, name, square = false }: { value: string; onChange: (v: string) => void; name: string; square?: boolean }) {
  const { t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await imageToDataUrl(file, 512));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-4">
        <Face src={value} name={name} size={80} square={square} />
        <div className="flex flex-wrap gap-2">
          <input ref={input} id={id} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-[14px] font-semibold transition-colors hover:border-sky hover:bg-tint">
            {busy ? <Spinner /> : <Camera size={16} />}
            {value ? t("common.action.replace") : t(square ? "profile.photo.addLogo" : "profile.photo.add")}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-[14px] font-semibold text-mist transition-colors hover:text-ink">
              <Trash2 size={15} /> {t("common.action.remove")}
            </button>
          )}
        </div>
      </div>
      <p className="text-[12px] text-mist">{t("profile.photo.hint")}</p>
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}

/** horizontal progress bar */
export function Meter({ percent, label }: { percent: number; label: string }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} className="h-2 w-full overflow-hidden rounded-full bg-paper/70">
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${p}%` }} />
    </div>
  );
}
