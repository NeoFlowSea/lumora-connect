import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { motion, useAnimation, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "framer-motion";
import { Briefcase, Clock, GraduationCap, Handshake, Info, Layers, MapPin, MessageCircle, RotateCcw, ThumbsUp, Trophy, X } from "lucide-react";
import { api } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { CompanyProfile, Match, TalentProfile, User } from "../api/types";
import { Empty, ErrorNote, Spinner } from "../components/form";
import { Modal, Pill, btn, ease, useToast } from "../components/ui";
import { trackLabel, useLang } from "../i18n";
import { go } from "../lib/router";
import { Avatar, DemoTag, UserInfoModal, Verified } from "./parts/common";
import { openState } from "./jobs/format";

type Profile = TalentProfile | CompanyProfile;
type Handle = { fly: (dir: 1 | -1) => void };

/* Card height: the viewport minus the app header and top padding (96px), the title row (~40px),
   the buttons (~68px), a gap, and on phones the bottom tab bar (57px + safe area).
   That keeps the like and pass buttons above the tab bar at 375x667 and 390x844 without scrolling. */
const DECK_H =
  "h-[calc(100svh-282px-env(safe-area-inset-bottom))] min-h-[300px] max-h-[600px] md:h-[min(580px,calc(100svh-250px))] md:min-h-[440px]";

/* sections that only show when there is room: tall phones and everything from tablet up */
const ROOMY = "hidden [@media(min-height:760px)]:block md:block";

const linkFor = (p: Profile | User) => (p.kind === "talent" ? `#/app/talent/${p.id}` : `#/company/${p.id}`);

const Card = forwardRef<Handle, { item: Profile; roles: string[]; top: boolean; depth: number; onDone: (dir: 1 | -1) => void }>(function Card(
  { item, roles, top, depth, onDone },
  ref,
) {
  const { t, tp } = useLang();
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], reduce ? [0, 0] : [-14, 14]);
  const likeOp = useTransform(x, [30, 130], [0, 1]);
  const nopeOp = useTransform(x, [-30, -130], [0, 1]);
  const controls = useAnimation();
  const busy = useRef(false);

  async function fly(dir: 1 | -1) {
    if (busy.current) return;
    busy.current = true;
    if (reduce) await controls.start({ opacity: 0, transition: { duration: 0.12 } });
    else await controls.start({ x: dir * 640, rotate: dir * 20, opacity: 0, transition: { duration: 0.38, ease } });
    onDone(dir);
  }
  useImperativeHandle(ref, () => ({ fly }));

  useEffect(() => {
    controls.start({ scale: 1 - depth * 0.04, y: depth * 12, opacity: depth > 1 ? 0 : 1, transition: { duration: reduce ? 0 : 0.4, ease } });
  }, [controls, depth, reduce]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 110 || info.velocity.x > 700) fly(1);
    else if (info.offset.x < -110 || info.velocity.x < -700) fly(-1);
    else controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
  }

  return (
    <motion.div
      drag={top ? "x" : false}
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      animate={controls}
      style={{ x, rotate, zIndex: 10 - depth }}
      initial={reduce ? false : { scale: 0.94, y: 20, opacity: 0 }}
      aria-hidden={!top}
      className={`absolute inset-0 flex select-none flex-col overflow-hidden rounded-2xl border border-line bg-surface ${top ? "cursor-grab touch-pan-y active:cursor-grabbing" : ""}`}
    >
      {item.kind === "talent" ? <TalentFace p={item} /> : <CompanyFace c={item} roles={roles} />}

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-2.5">
        <span className="min-w-0 truncate text-[13px] text-mist">
          {item.kind === "talent" ? trackLabel(item.cat) : roles.length ? tp("jobs.swipe.openRoles", roles.length) : t("jobs.swipe.noRoles")}
        </span>
        {top && (
          <a
            href={linkFor(item)}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-[13px] font-semibold text-sky hover:underline"
          >
            {t("jobs.fullProfile")}
          </a>
        )}
      </div>

      {top && (
        <>
          <motion.div style={{ opacity: likeOp }} className="pointer-events-none absolute left-4 top-4 -rotate-6 rounded-lg border-2 border-good bg-paper/80 px-3 py-1 text-[18px] font-semibold text-good">
            {t("jobs.swipe.like")}
          </motion.div>
          <motion.div style={{ opacity: nopeOp }} className="pointer-events-none absolute right-4 top-4 rotate-6 rounded-lg border-2 border-bad bg-paper/80 px-3 py-1 text-[18px] font-semibold text-bad">
            {t("jobs.swipe.pass")}
          </motion.div>
        </>
      )}
    </motion.div>
  );
});

function TalentFace({ p }: { p: TalentProfile }) {
  const { t } = useLang();
  const badge = p.badges.slice().sort((a, b) => (a.place ?? 99) - (b.place ?? 99))[0];
  const project = p.projects[0];
  const edu = [p.education.institution, p.education.program || p.education.year].filter(Boolean).join(", ");
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-5">
      <div className="flex items-start gap-4">
        <Avatar name={p.name} src={p.photo} size={64} />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[20px] font-semibold leading-tight">{p.name}</div>
          {p.headline && <div className="mt-1 line-clamp-2 text-[14px] text-ink/85">{p.headline}</div>}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-mist">
            <Verified on={p.verified} />
            {p.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {p.city}
              </span>
            )}
            {p.demo && <DemoTag />}
          </div>
        </div>
      </div>

      {badge && (
        <div className="flex items-start gap-2 rounded-lg bg-accent/15 px-3 py-2 text-[13px] text-accent">
          <Trophy size={15} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">
            <b>{badge.title}</b>, {badge.hackathonName}
          </span>
        </div>
      )}

      {edu && (
        <div className="flex items-start gap-2 text-[13px] text-mist">
          <GraduationCap size={15} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{edu}</span>
        </div>
      )}

      {p.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {p.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-md bg-tint px-2 py-0.5 text-[12px] font-semibold text-sky">
              {s}
            </span>
          ))}
          {p.skills.length > 4 && <span className="self-center text-[12px] text-mist">{t("jobs.more", { n: p.skills.length - 4 })}</span>}
        </div>
      )}

      {p.roles.length > 0 && (
        <div className={ROOMY}>
          <p className="line-clamp-2 text-[13px]">
            <span className="text-mist">{t("jobs.swipe.wants")} </span>
            {p.roles.join(", ")}
          </p>
        </div>
      )}

      {project && (
        <div className={`${ROOMY} min-h-0 rounded-lg border border-line px-3 py-2`}>
          <div className="text-[12px] text-mist">{project.event ? t("jobs.swipe.builtAt", { event: project.event }) : t("jobs.swipe.project")}</div>
          <div className="mt-0.5 text-[14px] font-semibold">{project.name}</div>
          {project.desc && <p className="line-clamp-2 text-[13px] text-mist">{project.desc}</p>}
        </div>
      )}
    </div>
  );
}

function CompanyFace({ c, roles }: { c: CompanyProfile; roles: string[] }) {
  const { t } = useLang();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-5">
      <div className="flex items-start gap-4">
        <Avatar name={c.name} src={c.logo} size={64} shape="square" />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[20px] font-semibold leading-tight">{c.name}</div>
          <div className="mt-1 text-[13px] text-mist">{[c.industry, c.size].filter(Boolean).join(", ")}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-mist">
            <Verified on={c.verified} />
            {c.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {c.city}
              </span>
            )}
            {c.partner && <Pill tone="blue">{t("jobs.company.partner")}</Pill>}
            {c.demo && <DemoTag />}
          </div>
        </div>
      </div>

      {c.tagline && <p className="line-clamp-3 text-[15px] leading-snug">{c.tagline}</p>}

      {roles.length > 0 && (
        <div className="rounded-lg bg-tint px-3 py-2">
          <div className="flex items-center gap-1.5 text-[12px] text-sky">
            <Briefcase size={13} /> {t("jobs.swipe.hiring")}
          </div>
          <ul className="mt-1 grid gap-0.5 text-[13px]">
            {roles.slice(0, 2).map((r) => (
              <li key={r} className="truncate">
                {r}
              </li>
            ))}
            {roles.length > 2 && <li className="text-mist">{t("jobs.more", { n: roles.length - 2 })}</li>}
          </ul>
        </div>
      )}

      {c.benefits.length > 0 && (
        <ul className={`${ROOMY} grid gap-1 text-[13px] text-mist`}>
          {c.benefits.slice(0, 3).map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-sky" aria-hidden />
              <span className="line-clamp-1">{b}</span>
            </li>
          ))}
        </ul>
      )}

      {c.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {c.tags.slice(0, 4).map((s) => (
            <span key={s} className="rounded-md bg-tint px-2 py-0.5 text-[12px] font-semibold text-sky">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Swipe() {
  const { t, tp } = useLang();
  const user = useSession();
  const toast = useToast();
  const topRef = useRef<Handle>(null);
  const deck = useApi(() => api.swipe.deck(), [user?.id]);
  const opps = useApi(() => api.opportunities.list(), []);
  const liked = useApi(() => api.swipe.liked(), [user?.id]);
  const matches = useApi(() => api.swipe.matches(), [user?.id]);
  const reset = useAction(api.swipe.resetDeck);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [info, setInfo] = useState<Profile | null>(null);
  const [match, setMatch] = useState<{ m: Match; other: Profile } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rolesBy = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const o of opps.data ?? []) if (openState(o) === "open") (map[o.companyId] ??= []).push(o.title);
    return map;
  }, [opps.data]);

  const isCompany = user?.kind === "company";
  const blocked = user?.kind === "company" && user.status !== "approved";
  const cards = (deck.data ?? []).filter((p) => !gone.has(p.id));
  const modalOpen = !!info || !!match;

  // left and right arrows swipe the top card
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (modalOpen || blocked || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        topRef.current?.fly(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        topRef.current?.fly(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, blocked]);

  if (!user || user.kind === "admin") return null;

  async function done(item: Profile, dir: 1 | -1) {
    setGone((s) => new Set(s).add(item.id));
    setError(null);
    try {
      const { match: m } = await api.swipe.swipe(item.id, dir);
      if (m) setMatch({ m, other: item });
      else if (dir === 1) toast(t("jobs.swipe.saved"));
    } catch (e) {
      setGone((s) => {
        const n = new Set(s);
        n.delete(item.id);
        return n;
      });
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function resetDeck() {
    await reset.run();
    setGone(new Set());
  }

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_300px] md:gap-12">
      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-4 md:mb-5 md:items-end">
          <div className="min-w-0">
            <h1 className="truncate text-[22px] md:text-[clamp(26px,3vw,34px)]">{isCompany ? t("jobs.swipe.titleCompany") : t("jobs.swipe.titleTalent")}</h1>
            <p className="mt-1 hidden text-[14px] text-mist md:block">{t("jobs.swipe.lead")}</p>
          </div>
          {!blocked && deck.data && <span className="shrink-0 text-[13px] tabular-nums text-mist">{tp("jobs.swipe.left", cards.length)}</span>}
        </div>

        {blocked ? (
          <Empty
            icon={<Clock size={22} />}
            title={user.status === "pending" ? t("jobs.swipe.lockedTitle") : t("jobs.swipe.rejectedTitle")}
            text={user.status === "pending" ? t("jobs.swipe.lockedText") : t("jobs.swipe.rejectedText")}
            action={
              <a href="#/app/dashboard" className={btn.secondary}>
                {t("jobs.swipe.openDashboard")}
              </a>
            }
          />
        ) : deck.loading && !deck.data ? (
          <div className={`mx-auto w-full max-w-[380px] ${DECK_H}`}>
            <div className="h-full animate-pulse rounded-2xl bg-surface/70" />
          </div>
        ) : (
          <>
            <div className={`relative mx-auto w-full max-w-[380px] ${DECK_H}`} role="region" aria-label={t("jobs.swipe.deck")}>
              {cards.length === 0 && (
                <div className="absolute inset-0 grid place-items-center rounded-2xl border border-dashed border-line p-6 text-center">
                  <div>
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-tint text-sky">
                      <Layers size={22} />
                    </div>
                    <h2 className="mt-4 text-[19px]">{t("jobs.swipe.emptyTitle")}</h2>
                    <p className="mt-2 text-[14px] text-mist">{isCompany ? t("jobs.swipe.emptyTextCompany") : t("jobs.swipe.emptyTextTalent")}</p>
                    <button onClick={resetDeck} disabled={reset.pending} className={`${btn.ghost} mt-5`}>
                      {reset.pending ? <Spinner /> : <RotateCcw size={16} />} {t("jobs.swipe.reset")}
                    </button>
                  </div>
                </div>
              )}
              {cards
                .slice(0, 3)
                .map((item, idx) => ({ item, idx }))
                .reverse()
                .map(({ item, idx }) => (
                  <Card key={item.id} ref={idx === 0 ? topRef : undefined} item={item} roles={rolesBy[item.id] ?? []} top={idx === 0} depth={idx} onDone={(dir) => done(item, dir)} />
                ))}
            </div>
            <div className="relative z-20 mt-3 flex items-center justify-center gap-5 md:mt-5">
              <button
                onClick={() => topRef.current?.fly(-1)}
                disabled={!cards.length}
                className="grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-bad transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 md:h-16 md:w-16"
                aria-label={t("jobs.swipe.passLabel")}
                title={t("jobs.swipe.passKey")}
              >
                <X size={26} />
              </button>
              <button
                onClick={() => cards[0] && setInfo(cards[0])}
                disabled={!cards.length}
                className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface text-mist transition-transform hover:scale-105 disabled:opacity-40"
                aria-label={t("jobs.swipe.details")}
              >
                <Info size={20} />
              </button>
              <button
                onClick={() => topRef.current?.fly(1)}
                disabled={!cards.length}
                className="grid h-14 w-14 place-items-center rounded-full bg-accent text-paper transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 md:h-16 md:w-16"
                aria-label={t("jobs.swipe.likeLabel")}
                title={t("jobs.swipe.likeKey")}
              >
                <ThumbsUp size={26} />
              </button>
            </div>
            {(error ?? deck.error) && (
              <div className="mx-auto mt-3 max-w-[380px]">
                <ErrorNote>{error ?? deck.error}</ErrorNote>
              </div>
            )}
          </>
        )}
      </div>

      <aside className="hidden gap-4 md:grid md:content-start">
        <a href="#/app/inbox" className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-sky">
          <span className="min-w-0">
            <span className="block text-[16px] font-semibold">{t("jobs.swipe.matches")}</span>
            <span className="text-[13px] text-mist">{matches.data?.length ? t("jobs.swipe.matchesOpen") : t("jobs.swipe.matchesEmpty")}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-[20px] font-semibold tabular-nums text-accent">{matches.data?.length ?? 0}</span>
            <MessageCircle size={18} className="text-mist" />
          </span>
        </a>
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px]">{t("jobs.swipe.interested")}</h2>
            <span className="text-[14px] font-semibold tabular-nums text-mist">{liked.data?.length ?? 0}</span>
          </div>
          {!liked.data?.length ? (
            <p className="mt-3 text-[13px] text-mist">{t("jobs.swipe.interestedEmpty")}</p>
          ) : (
            <ul className="mt-3 grid gap-1">
              {liked.data.slice(0, 8).map((i) => (
                <li key={i.id}>
                  <a href={linkFor(i)} className="flex min-h-11 w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-tint">
                    <Avatar name={i.name} size={36} src={i.kind === "talent" ? i.photo : i.kind === "company" ? i.logo : undefined} shape={i.kind === "company" ? "square" : "circle"} />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold">{i.name}</span>
                      <span className="block truncate text-[12px] text-mist">{i.kind === "company" ? i.industry : i.kind === "talent" ? i.headline || trackLabel(i.cat) : ""}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl bg-tint p-5 text-[13px] leading-relaxed">
          <b>{t("jobs.swipe.howTitle")}</b> {isCompany ? t("jobs.swipe.howCompany") : t("jobs.swipe.howTalent")}
          <p className="mt-2 text-mist">{t("jobs.swipe.keys")}</p>
        </div>
      </aside>

      <UserInfoModal user={info} onClose={() => setInfo(null)} />

      <Modal open={!!match} onClose={() => setMatch(null)}>
        {match && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent text-paper"
            >
              <Handshake size={36} />
            </motion.div>
            <h2 className="mt-6 text-[28px]">{t("jobs.swipe.matchTitle")}</h2>
            <p className="mt-2 text-[14px] text-mist">{t("jobs.swipe.matchText", { name: match.other.name })}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => go(`#/app/inbox/${match.m.id}`)} className={btn.primary}>
                <MessageCircle size={16} /> {t("jobs.swipe.sendMessage")}
              </button>
              <button onClick={() => setMatch(null)} className={btn.ghost}>
                {t("jobs.swipe.keepSwiping")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
