import { useLang } from "../i18n";
import { Fade, Section, SectionHead, spotMove } from "./parts";
import { Stable } from "../i18n/Stable";

/* Three steps for each side, next to each other so both sides see the whole deal. */
export function HowItWorks() {
  const { t } = useLang();
  const sides = [
    { id: "for-students", title: t("landing.how.students"), key: "s", cta: { label: t("landing.how.studentsCta"), href: "#/register?type=talent" } },
    { id: "for-companies", title: t("landing.how.companies"), key: "c", cta: { label: t("landing.how.companiesCta"), href: "#/register?type=company" } },
  ];
  return (
    <Section id="how" className="border-t border-line">
      <Fade>
        <SectionHead title={<Stable k="landing.how.title" />} lead={<Stable k="landing.how.lead" />} />
        <div className="grid gap-4 md:grid-cols-2">
          {sides.map((s) => (
            <div key={s.id} id={s.id} onMouseMove={spotMove} className="spot scroll-mt-24 rounded-xl border border-line bg-surface p-6 transition-colors hover:border-sky md:p-8">
              <h3 className="text-[20px]">{s.title}</h3>
              <ol className="mt-6 grid gap-6">
                {[1, 2, 3].map((n) => (
                  <li key={n} className="grid grid-cols-[32px_1fr] gap-4">
                    <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full border border-sky/40 text-[14px] font-semibold text-sky">
                      {n}
                    </span>
                    <div>
                      <div className="text-[16px] font-semibold"><Stable k={`landing.how.${s.key}${n}`} /></div>
                      <p className="mt-1 text-[15px] leading-relaxed text-mist"><Stable k={`landing.how.${s.key}${n}d`} /></p>
                    </div>
                  </li>
                ))}
              </ol>
              <a href={s.cta.href} className="mt-7 inline-flex min-h-11 items-center text-[15px] font-semibold text-sky underline-offset-4 hover:underline">
                {s.cta.label}
              </a>
            </div>
          ))}
        </div>
      </Fade>
    </Section>
  );
}
