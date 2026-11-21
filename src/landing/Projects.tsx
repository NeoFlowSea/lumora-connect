import { Trophy } from "lucide-react";
import { locale, useLang } from "../i18n";
import { lumora, photo } from "../content/lumora";
import { Fade, Rise, Section, SectionHead } from "./parts";

/* Real winning projects from Lumora rounds, with photos from the event. Devpost style. */
export function Projects() {
  const { t, lang } = useLang();
  const date = (iso: string) => new Date(`${iso}T12:00`).toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" });
  return (
    <Section id="talent" className="border-t border-line">
      <Fade>
        <SectionHead title={t("landing.projects.title")} lead={t("landing.projects.lead")} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lumora.projects.map((p, i) => (
            <Rise key={p.project} i={i} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-sky">
              <img
                src={photo(p.photo, 800)}
                alt={`${p.team}, ${p.event}`}
                width={800}
                height={533}
                loading="lazy"
                decoding="async"
                className="aspect-[3/2] w-full bg-cloud object-cover"
              />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="inline-flex items-center gap-1 rounded-md bg-tint px-2 py-0.5 font-semibold text-sky">
                    <Trophy size={13} /> {t(`landing.place${p.place}`)}
                  </span>
                  <span className="text-mist">{p.event}</span>
                </div>
                <h3 className="mt-3 text-[19px] tracking-[-0.01em]">{p.project}</h3>
                <div className="mt-1 text-[14px] text-mist">{t("landing.projects.team", { team: p.team })}</div>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/90">{p.summary[lang]}</p>
                <div className="mt-auto pt-4">
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-line pt-3 text-[13px] text-mist">
                    <span>{date(p.date)}</span>
                    {p.prize && <span>{t("landing.projects.prize", { prize: p.prize })}</span>}
                  </div>
                </div>
              </div>
            </Rise>
          ))}
        </ul>
      </Fade>
    </Section>
  );
}
