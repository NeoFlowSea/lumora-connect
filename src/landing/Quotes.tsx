import { useLang } from "../i18n";
import { lumora, photo } from "../content/lumora";
import { Fade, Section } from "./parts";
import { Stable } from "../i18n/Stable";

/* No invented testimonials: these are Lumora's own lines, as Lumora says them. */
export function Quotes() {
  useLang();
  return (
    <Section>
      <Fade className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <figure className="flex flex-col justify-between rounded-xl border border-line bg-surface p-7 md:p-10">
          <blockquote className="text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.2] tracking-[-0.02em]">
            <p><Stable texts={lumora.slogans.demo} /></p>
          </blockquote>
          <figcaption className="mt-8 text-[14px] text-mist"><Stable k="landing.quotes.demo" /></figcaption>
        </figure>
        <figure className="relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-xl bg-cloud p-7 md:p-10">
          <img
            src={photo("regional-winners", 800)}
            alt=""
            width={800}
            height={600}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/70 to-paper/10" aria-hidden />
          <blockquote className="relative text-[clamp(22px,2.4vw,28px)] font-semibold leading-[1.25] tracking-[-0.02em]">
            <p><Stable texts={lumora.slogans.postcode} /></p>
          </blockquote>
          <figcaption className="relative mt-6 text-[14px] text-ink/85"><Stable k="landing.quotes.postcode" /></figcaption>
        </figure>
      </Fade>
    </Section>
  );
}
