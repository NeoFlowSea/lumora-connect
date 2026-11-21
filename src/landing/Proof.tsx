import { locale, useLang } from "../i18n";
import { lumora } from "../content/lumora";
import { wrap } from "./parts";

/* Real Lumora numbers, set in type on the first frame, then the partner names. */
export function Proof() {
  const { t } = useLang();
  const n = (v: number) => v.toLocaleString(locale());
  const stats = [
    { v: `${n(lumora.numbers.hackathons)}+`, l: t("landing.proof.hackathons") },
    { v: `${n(lumora.numbers.students)}+`, l: t("landing.proof.students") },
    { v: n(lumora.numbers.regions), l: t("landing.proof.regions") },
    { v: `${n(lumora.numbers.partners)}+`, l: t("landing.proof.partners") },
  ];
  const more = Math.max(0, lumora.numbers.partners - lumora.partners.length);

  return (
    <section aria-label={t("landing.proof.label")} className="mt-16 border-y border-line bg-cloud md:mt-24">
      <div className={`${wrap} grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4 md:py-12`}>
        {stats.map((s) => (
          <div key={s.l} className="pr-4">
            <div className="text-[clamp(34px,4vw,48px)] font-semibold leading-none tracking-[-0.03em] text-accent">{s.v}</div>
            <div className="mt-2 max-w-[22ch] text-[14px] text-mist">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className={`${wrap} py-8 md:py-10`}>
          <h2 className="text-[15px] font-medium tracking-normal text-mist">{t("landing.proof.partnersTitle")}</h2>
          <ul className="mt-4 flex flex-wrap gap-x-7 gap-y-3">
            {lumora.partners.map((p) => (
              <li key={p} className="text-[17px] font-semibold tracking-[-0.01em] text-ink/85 md:text-[19px]">
                {p}
              </li>
            ))}
            {more > 0 && <li className="text-[17px] font-medium text-sky md:text-[19px]">{t("landing.proof.more", { n: more })}</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
