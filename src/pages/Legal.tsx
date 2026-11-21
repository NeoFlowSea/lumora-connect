import { useEffect } from "react";
import { Info } from "lucide-react";
import { locale, useLang } from "../i18n";

/* Privacy policy and terms of use. Text lives in src/i18n/dict/legal.ts as
   "<kind>.<n>.h" (heading) and "<kind>.<n>.b" (body). In a body, a blank line
   starts a new paragraph and lines starting with "- " form a list. */

const SECTIONS = { privacy: 10, terms: 12 } as const;
const UPDATED = new Date(2026, 10, 21);

function Body({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- ")))
          return (
            <ul key={i} className="mt-3 list-disc space-y-1.5 pl-5 marker:text-mist">
              {lines.map((l) => (
                <li key={l}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        return (
          <p key={i} className="mt-3">
            {block}
          </p>
        );
      })}
    </>
  );
}

export function Legal({ kind }: { kind: "privacy" | "terms" }) {
  const { t } = useLang();
  const other = kind === "privacy" ? "terms" : "privacy";
  const date = UPDATED.toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    const prev = document.title;
    document.title = `${t(`legal.${kind}.title`)} · Lumora Connect`;
    return () => {
      document.title = prev;
    };
  }, [kind, t]);

  return (
    <article className="mx-auto w-full max-w-[70ch] px-5 pb-20 pt-10 md:pb-24 md:pt-16">
      <h1 className="text-[clamp(30px,4vw,42px)] tracking-[-0.03em]">{t(`legal.${kind}.title`)}</h1>
      <p className="mt-3 text-[14px] text-mist">{t("legal.updated", { date })}</p>
      <p className="mt-6 text-[17px] leading-relaxed text-ink">{t(`legal.${kind}.lead`)}</p>

      <div className="mt-6 flex gap-3 rounded-xl border border-line bg-surface p-4 text-[15px] leading-relaxed">
        <Info size={18} className="mt-0.5 shrink-0 text-sky" aria-hidden />
        <p>{t("legal.preview")}</p>
      </div>

      <div className="text-[16px] leading-[1.7] text-ink/90">
        {Array.from({ length: SECTIONS[kind] }, (_, i) => i + 1).map((n) => (
          <section key={n} className="mt-10">
            <h2 className="text-[21px] tracking-[-0.015em] text-ink">
              {n}. {t(`legal.${kind}.${n}.h`)}
            </h2>
            <Body text={t(`legal.${kind}.${n}.b`)} />
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-line pt-6 text-[15px] text-mist">
        {t(`legal.see.${other}`)}{" "}
        <a href={`#/${other}`} className="font-semibold text-sky underline underline-offset-4">
          {t(`legal.${other}.title`)}
        </a>
      </p>
    </article>
  );
}
