import { LANGS, useLang, type Lang } from "../i18n";

/* UZ / RU / EN switch. Segmented on wider screens; `compact` is a small native select
   for tight headers on phones (one 44px target instead of three). */
export function LangSwitch({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { lang, setLang, t } = useLang();
  if (compact) {
    return (
      <select
        aria-label={t("common.lang.label")}
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className={`h-11 appearance-none rounded-lg border border-line bg-transparent px-2.5 text-center text-[13px] font-semibold text-ink ${className}`}
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code} className="bg-surface">
            {l.short}
          </option>
        ))}
      </select>
    );
  }
  return (
    <div role="group" aria-label={t("common.lang.label")} className={`rounded-lg border border-line p-0.5 ${className.includes("hidden") ? "" : "inline-flex"} ${className}`}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          title={l.label}
          aria-pressed={lang === l.code}
          onClick={() => setLang(l.code)}
          className={`min-h-11 min-w-11 rounded-md px-2 text-[12px] font-semibold transition-colors sm:min-h-9 sm:min-w-9 ${lang === l.code ? "bg-tint text-ink" : "text-mist hover:text-ink"}`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
