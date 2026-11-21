import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "../i18n";
import { Fade, Section } from "./parts";
import { Stable } from "../i18n/Stable";

const KEYS = ["what", "who", "verify", "free", "companies", "langs"];

/* Plain accordion: real buttons with aria-expanded, panels labelled by their question.
   `area` is the dictionary prefix: "<area>.title", "<area>.lead", "<area>.<key>.q" and ".a". */
export function Faq({ area = "landing.faq", keys = KEYS }: { area?: string; keys?: string[] }) {
  useLang();
  const [open, setOpen] = useState<string | null>(keys[0]);
  const base = useId();
  return (
    <Section id="faq" className="border-t border-line">
      <Fade className="grid gap-8 md:grid-cols-[1fr_1.8fr] md:gap-12">
        <div>
          <h2 className="text-[clamp(26px,3.2vw,40px)] tracking-[-0.025em]"><Stable k={`${area}.title`} /></h2>
          <p className="mt-3 max-w-[60ch] text-[16px] text-mist"><Stable k={`${area}.lead`} /></p>
        </div>
        <ul className="border-t border-line">
          {keys.map((k) => {
            const isOpen = open === k;
            const id = `${base}-${k}`;
            return (
              <li key={k} className="border-b border-line">
                <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
                  <button
                    type="button"
                    id={`${id}-q`}
                    aria-expanded={isOpen}
                    aria-controls={`${id}-a`}
                    onClick={() => setOpen(isOpen ? null : k)}
                    className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:text-sky"
                  >
                    <Stable k={`${area}.${k}.q`} />
                    <ChevronDown size={20} className={`shrink-0 text-mist transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </h3>
                <div id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} hidden={!isOpen} className="pb-5 pr-8">
                  <p className="max-w-[80ch] text-[15px] leading-relaxed text-mist"><Stable k={`${area}.${k}.a`} /></p>
                </div>
              </li>
            );
          })}
        </ul>
      </Fade>
    </Section>
  );
}
