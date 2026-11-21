import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Heart, MapPin, Pause, Play, X } from "lucide-react";
import { trackLabel, useLang } from "../i18n";
import { api, listNow } from "../api";
import { useApi, useDbTick } from "../api/hooks";
import type { CompanyProfile, TalentProfile } from "../api/types";
import { initials } from "../components/ui";
import { Monogram } from "./parts";

/* The product, previewed: a stack of sample companies and sample students that
   swipes itself every few seconds. It stops on hover, on focus, when the visitor
   presses pause, when it is off screen, and never moves with reduced motion. */

type Item = { kind: "company"; c: CompanyProfile; role: string } | { kind: "talent"; p: TalentProfile };

const STEP = 4200;

export function Deck() {
  const { t } = useLang();
  useDbTick();
  const talents = useApi(() => api.users.talents(), []).data;

  const items = useMemo<Item[]>(() => {
    const seen = new Set<string>();
    const cos: Item[] = [];
    for (const o of listNow()) {
      if (!o.company || seen.has(o.companyId) || o.closed) continue;
      seen.add(o.companyId);
      cos.push({ kind: "company", c: o.company, role: o.title });
      if (cos.length === 6) break;
    }
    const ppl: Item[] = (talents ?? [])
      .filter((p) => p.verified && p.onboarded && p.skills.length > 0 && p.project)
      .slice(0, 6)
      .map((p) => ({ kind: "talent", p }));
    const out: Item[] = [];
    for (let i = 0; i < Math.max(cos.length, ppl.length); i++) {
      if (cos[i]) out.push(cos[i]);
      if (ppl[i]) out.push(ppl[i]);
    }
    return out;
  }, [talents]);

  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [stamp, setStamp] = useState<0 | 1 | -1>(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const ref = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const decide = (d: 1 | -1) => {
    if (busy.current || items.length < 2) return;
    busy.current = true;
    setDir(d);
    setStamp(d);
    window.setTimeout(
      () => {
        setStamp(0);
        setI((x) => x + 1);
        busy.current = false;
      },
      reduced ? 0 : 650,
    );
  };

  const running = !paused && !hold && visible && !reduced && items.length > 1;
  useEffect(() => {
    if (!running) return;
    let n = 0;
    const id = window.setInterval(() => decide(n++ % 3 === 2 ? -1 : 1), STEP);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, items.length]);

  if (!items.length) return <div className="mx-auto h-[400px] w-full max-w-[340px] rounded-xl border border-line bg-surface" aria-hidden />;

  const stack = [0, 1, 2].map((k) => ({ item: items[(i + k) % items.length], key: i + k })).filter((_, k) => k < items.length);

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[340px]"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <div role="img" aria-label={t("landing.deck.label")} className="relative h-[400px]">
        <AnimatePresence initial={false}>
          {stack
            .slice()
            .reverse()
            .map(({ item, key }) => {
              const depth = key - i; // 0 is the top card
              const top = depth === 0;
              return (
                <motion.div
                  key={key}
                  className="absolute inset-0 overflow-hidden rounded-xl border border-line bg-surface"
                  initial={{ scale: 0.92, y: 20, opacity: 0 }}
                  animate={{ scale: 1 - depth * 0.04, y: depth * 12, opacity: depth > 1 ? 0.6 : 1, rotate: 0 }}
                  exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { x: dir * 300, rotate: dir * 9, opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
                  transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ zIndex: 10 - depth }}
                  aria-hidden={!top}
                >
                  {item.kind === "company" ? <CompanyCard c={item.c} role={item.role} /> : <TalentCard p={item.p} />}
                  {top && (
                    <>
                      <Stamp show={stamp === 1} className="left-4 -rotate-6 border-good text-good">
                        {t("landing.deck.yes")}
                      </Stamp>
                      <Stamp show={stamp === -1} className="right-4 rotate-6 border-mist text-mist">
                        {t("landing.deck.no")}
                      </Stamp>
                    </>
                  )}
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button type="button" onClick={() => decide(-1)} aria-label={t("landing.deck.no")} className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface text-mist transition-colors hover:text-ink">
          <X size={22} />
        </button>
        {!reduced && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? t("landing.deck.play") : t("landing.deck.pause")}
            className="grid h-11 w-11 place-items-center rounded-full text-mist transition-colors hover:bg-tint hover:text-ink"
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        )}
        <button type="button" onClick={() => decide(1)} aria-label={t("landing.deck.yes")} className="grid h-12 w-12 place-items-center rounded-full bg-blue text-white transition-colors hover:bg-blue-deep">
          <Heart size={22} />
        </button>
      </div>
    </div>
  );
}

function Stamp({ show, className, children }: { show: boolean; className: string; children: string }) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute top-4 rounded-md border-2 bg-paper/80 px-2.5 py-1 text-[15px] font-semibold ${className}`}
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

function CompanyCard({ c, role }: { c: CompanyProfile; role: string }) {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-14" style={{ background: c.hue || "#3d7bfa" }}>
        <div className="flex items-end justify-between gap-3">
          <span className="rounded-lg bg-white p-0.5">
            <Monogram name={c.name} hue={c.hue} logo={c.logo} size={48} />
          </span>
          <span className="rounded-md bg-paper/40 px-1.5 py-0.5 text-[12px] font-medium text-white">{t("common.status.demo")}</span>
        </div>
        <div className="mt-3 text-[21px] font-semibold leading-tight text-white">{c.name}</div>
        <div className="mt-1 flex items-center gap-1 text-[13px] text-white/85">
          <MapPin size={13} /> {c.city}, {c.industry}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-[15px] text-ink">{c.tagline}</p>
        <div className="mt-4 text-[12px] text-mist">{t("landing.deck.hiring")}</div>
        <div className="mt-0.5 line-clamp-1 text-[15px] font-semibold">{role}</div>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {c.tags.slice(0, 3).map((x) => (
            <span key={x} className="rounded-md bg-tint px-2 py-0.5 text-[12px] font-medium text-sky">
              {x}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TalentCard({ p }: { p: TalentProfile }) {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col">
      <div className="bg-tint-2 px-5 pb-4 pt-14">
        <div className="flex items-end justify-between gap-3">
          {p.photo ? (
            <img src={p.photo} alt="" width={52} height={52} className="h-13 w-13 rounded-full object-cover" />
          ) : (
            <span aria-hidden className="grid h-13 w-13 place-items-center rounded-full bg-blue text-[17px] font-semibold text-white">
              {initials(p.name)}
            </span>
          )}
          <span className="rounded-md bg-paper/40 px-1.5 py-0.5 text-[12px] font-medium text-ink">{t("common.status.demo")}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[21px] font-semibold leading-tight">
          {p.name}
          {p.verified && <BadgeCheck size={18} className="shrink-0 text-sky" aria-label={t("common.status.verified")} />}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[13px] text-mist">
          <MapPin size={13} /> {p.city}, {trackLabel(p.cat)}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="text-[12px] text-mist">{t("landing.deck.built")}</div>
        <div className="mt-0.5 line-clamp-1 text-[15px] font-semibold">{p.project}</div>
        <p className="mt-2 line-clamp-2 text-[14px] text-mist">{p.headline}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {p.skills.slice(0, 4).map((x) => (
            <span key={x} className="rounded-md bg-tint px-2 py-0.5 text-[12px] font-medium text-sky">
              {x}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
