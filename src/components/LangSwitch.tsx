import { LANGS, useLang } from "../i18n";

/* UZ / RU / EN switch. Compact segmented control; every option is a 44px-tall target on phones. */
export function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div role="group" aria-label={t("common.lang.label")} className={`inline-flex rounded-lg border border-line p-0.5 ${className}`}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          title={l.label}
          aria-pressed={lang === l.code}
          onClick={() => setLang(l.code)}
          className={`min-h-9 min-w-9 rounded-md px-2 text-[12px] font-semibold transition-colors ${lang === l.code ? "bg-tint text-ink" : "text-mist hover:text-ink"}`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
