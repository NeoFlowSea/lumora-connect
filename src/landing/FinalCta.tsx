import { useLang } from "../i18n";
import { btn } from "../components/ui";
import { Section } from "./parts";

/* The two doors again, at the bottom of the page. */
export function FinalCta() {
  const { t } = useLang();
  return (
    <Section className="border-t border-line">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-xl bg-surface p-7 md:p-10">
          <h2 className="text-[clamp(24px,2.8vw,34px)] tracking-[-0.025em]">{t("landing.final.studentTitle")}</h2>
          <p className="mt-3 max-w-[42ch] text-[16px] text-mist">{t("landing.final.studentText")}</p>
          <div className="mt-auto pt-8">
            <a href="#/register?type=talent" className={btn.primary}>
              {t("landing.final.studentCta")}
            </a>
          </div>
        </div>
        <div className="flex flex-col rounded-xl border border-line p-7 md:p-10">
          <h2 className="text-[clamp(24px,2.8vw,34px)] tracking-[-0.025em]">{t("landing.final.companyTitle")}</h2>
          <p className="mt-3 max-w-[42ch] text-[16px] text-mist">{t("landing.final.companyText")}</p>
          <div className="mt-auto pt-8">
            <a href="#/register?type=company" className={btn.secondary}>
              {t("landing.final.companyCta")}
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
