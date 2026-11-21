import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { trackLabel, useLang } from "../i18n";
import { statsNow } from "../api";
import { useDbTick } from "../api/hooks";
import { lumora } from "../content/lumora";
import { Input } from "../components/form";
import { btn } from "../components/ui";
import { go } from "../lib/router";
import { Deck } from "./Deck";
import { wrap } from "./parts";

/* Two doors, like Handshake: students on the left, companies on the right.
   Under them a job search like hh.uz, with the real tracks and live counts. */
export function Hero() {
  const { t, lang } = useLang();
  useDbTick();
  const [q, setQ] = useState("");
  const byCat = Object.entries(statsNow().opportunitiesByCat).sort((a, b) => b[1] - a[1]);

  const search = (e: FormEvent) => {
    e.preventDefault();
    const s = q.trim();
    go(s ? `#/jobs?q=${encodeURIComponent(s)}` : "#/jobs");
  };

  return (
    <section id="top" className="pt-24 md:pt-32">
      <div className={`${wrap} grid items-center gap-12 md:grid-cols-[1.15fr_0.85fr] md:gap-10`}>
        <div>
          <p className="text-[15px] font-medium text-sky">{t("landing.hero.kicker")}</p>
          <h1 className="mt-4 max-w-[15ch] text-[clamp(38px,5.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.035em]">{lumora.slogans.hero[lang]}</h1>
          <p className="mt-5 max-w-[50ch] text-[17px] leading-relaxed text-mist md:text-[18px]">{t("landing.hero.text")}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:max-w-[560px]">
            <a href="#/register?type=talent" className="group flex min-h-16 flex-col justify-center rounded-lg bg-accent px-5 py-3 text-paper transition-colors hover:bg-accent-deep">
              <span className="text-[17px] font-semibold">{t("landing.hero.student")}</span>
              <span className="text-[13px] text-paper/75">{t("landing.hero.studentSub")}</span>
            </a>
            <a href="#/register?type=company" className="group flex min-h-16 flex-col justify-center rounded-lg border border-line px-5 py-3 transition-colors hover:border-sky hover:bg-tint">
              <span className="text-[17px] font-semibold">{t("landing.hero.company")}</span>
              <span className="text-[13px] text-mist">{t("landing.hero.companySub")}</span>
            </a>
          </div>
        </div>

        <Deck />
      </div>

      <div className={`${wrap} mt-12 md:mt-16`}>
        <div className="rounded-xl border border-line bg-surface p-3 md:p-4">
          <form role="search" onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">{t("landing.search.label")}</span>
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("landing.search.placeholder")} className="!pl-10" enterKeyHint="search" />
            </label>
            <button type="submit" className={btn.secondary}>
              {t("common.action.search")}
            </button>
          </form>
          {byCat.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[13px] text-mist">{t("landing.search.tracks")}</span>
              {byCat.map(([cat, n]) => (
                <a
                  key={cat}
                  href={`#/jobs?track=${encodeURIComponent(cat)}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line px-2.5 text-[14px] text-ink transition-colors hover:border-sky hover:bg-tint md:min-h-9"
                >
                  {trackLabel(cat)}
                  <span className="text-[13px] font-semibold text-sky">{n}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
