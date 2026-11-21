import { LANGS, t, useLang, type Lang } from "./index";

/* Text that keeps its size when the language changes.
   All three translations sit in the same grid cell; only the current one is visible, the others
   are hidden but still take space. The box is as tall and wide as the longest translation, so
   switching UZ / RU / EN never pushes the page up or down. Hidden copies are aria-hidden and
   invisible, so screen readers and find-in-page only see the current language. */
/** a track name ("Data & AI") in all three languages, for <Stable texts={...} /> */
export function trackTexts(name: string): Record<Lang, string> {
  const pick = (l: Lang) => {
    const v = t(`common.track.${name}`, undefined, l);
    return v === `common.track.${name}` ? name : v;
  };
  return { en: pick("en"), ru: pick("ru"), uz: pick("uz") };
}

export function Stable({ k, vars, texts }: { k?: string; vars?: Record<string, string | number>; texts?: Record<Lang, string> }) {
  const { lang } = useLang();
  return (
    <span style={{ display: "inline-grid" }}>
      {LANGS.map(({ code }) => (
        <span
          key={code}
          lang={code}
          aria-hidden={code === lang ? undefined : true}
          style={{ gridArea: "1 / 1", visibility: code === lang ? "visible" : "hidden" }}
        >
          {texts ? texts[code] : t(k ?? "", vars, code)}
        </span>
      ))}
    </span>
  );
}
