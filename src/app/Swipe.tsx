import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { motion, useAnimation, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { BadgeCheck, Clock, Heart, Info, MapPin, MessageCircle, RotateCcw, Trophy, X } from "lucide-react";
import { api } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { CompanyProfile, Match, TalentProfile } from "../api/types";
import { Empty, ErrorNote, Skeleton, Spinner } from "../components/form";
import { Modal, Pill, btn, ease, initials, useToast } from "../components/ui";
import { go } from "../lib/router";

type Profile = TalentProfile | CompanyProfile;
type Handle = { fly: (dir: 1 | -1) => void };

const Card = forwardRef<
  Handle,
  { item: Profile; roles: string[]; top: boolean; depth: number; onDone: (dir: 1 | -1) => void; onInfo: () => void }
>(function Card({ item, roles, top, depth, onDone, onInfo }, ref) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-16, 16]);
  const likeOp = useTransform(x, [30, 130], [0, 1]);
  const nopeOp = useTransform(x, [-30, -130], [0, 1]);
  const controls = useAnimation();
  const busy = useRef(false);

  async function fly(dir: 1 | -1) {
    if (busy.current) return;
    busy.current = true;
    await controls.start({ x: dir * 700, rotate: dir * 24, opacity: 0, transition: { duration: 0.42, ease } });
    onDone(dir);
  }
  useImperativeHandle(ref, () => ({ fly }));

  useEffect(() => {
    controls.start({ scale: 1 - depth * 0.04, y: depth * 18, opacity: 1, transition: { duration: 0.45, ease } });
  }, [controls, depth]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 110 || info.velocity.x > 700) fly(1);
    else if (info.offset.x < -110 || info.velocity.x < -700) fly(-1);
    else controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
  }

  const isCo = item.kind === "company";
  const sub = isCo ? `${item.industry}, ${item.city}` : `${item.cat}, ${item.city}`;
  const tags = isCo ? item.tags : item.skills;
  const hue = isCo ? item.hue : "#1a4ba8";
  const badge = !isCo ? item.badges.slice().sort((a, b) => (a.place ?? 99) - (b.place ?? 99))[0] : undefined;

  return (
    <motion.div
      drag={top ? "x" : false}
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      animate={controls}
      style={{ x, rotate, zIndex: 10 - depth }}
      initial={{ scale: 0.92, y: 30, opacity: 0 }}
      className={`absolute inset-0 select-none overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] ${
        top ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="h-[42%] p-5 text-white" style={{ background: `linear-gradient(135deg, #3d7bfa, ${hue})` }}>
        <div className="flex items-start justify-between gap-2">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 font-display text-[15px] text-blue">{initials(item.name)}</div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {item.verified && (
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-semibold">
                <BadgeCheck size={13} /> verified
              </span>
            )}
            {isCo && item.partner && <span className="rounded-full bg-accent px-2.5 py-1 text-[12px] font-semibold text-paper">Partner</span>}
            {isCo && <span className="rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-semibold">{item.size}</span>}
          </div>
        </div>
        <div className="mt-6 font-display text-[24px] font-semibold leading-tight">{item.name}</div>
        <div className="mt-1 flex items-center gap-1 text-[13px] text-white/85">
          <MapPin size={13} /> {sub}
        </div>
      </div>
      <div className="flex h-[58%] flex-col p-5">
        {badge && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-accent/15 px-3 py-2 text-[13px] text-accent">
            <Trophy size={15} className="shrink-0" />
            <span className="truncate">
              <b>{badge.title}</b>, {badge.hackathonName}
            </span>
          </div>
        )}
        <p className="line-clamp-3 text-[14px] leading-relaxed text-ink">{isCo ? item.tagline || item.about : item.bio || "No bio yet."}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 5).map((t) => (
            <span key={t} className="rounded-md bg-tint px-2 py-1 text-[12px] font-semibold text-sky">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3 text-[13px] text-mist">
          <span className="min-w-0 truncate">
            {isCo ? (roles.length ? `Hiring: ${roles.join(", ")}` : "No open postings right now") : `${item.project ? `Built ${item.project}. ` : ""}${item.avail}.`}
          </span>
          {top && (
            <button
              onClick={onInfo}
              onPointerDown={(e) => e.stopPropagation()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-mist hover:bg-cloud"
              aria-label="Details"
            >
              <Info size={16} />
            </button>
          )}
        </div>
      </div>
      {top && (
        <>
          <motion.div style={{ opacity: likeOp }} className="absolute left-5 top-5 rotate-[-14deg] rounded-lg border-[3px] border-good px-3 py-1 font-display text-[22px] font-semibold text-good">
            LIKE
          </motion.div>
          <motion.div style={{ opacity: nopeOp }} className="absolute right-5 top-5 rotate-[14deg] rounded-lg border-[3px] border-bad px-3 py-1 font-display text-[22px] font-semibold text-bad">
            NOPE
          </motion.div>
        </>
      )}
    </motion.div>
  );
});

export function Swipe() {
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
    for (const o of opps.data ?? []) (map[o.companyId] ??= []).push(o.title);
    return map;
  }, [opps.data]);

  if (!user || user.kind === "admin") return null;
  const isCompany = user.kind === "company";
  const blocked = isCompany && user.status !== "approved";
  const cards = (deck.data ?? []).filter((p) => !gone.has(p.id));

  async function done(item: Profile, dir: 1 | -1) {
    setGone((s) => new Set(s).add(item.id));
    try {
      const { match: m } = await api.swipe.swipe(item.id, dir);
      if (m) setMatch({ m, other: item });
      else if (dir === 1) toast(isCompany ? "Saved. If they like you back, it's a match." : "Saved. If they like you back, it's a match.");
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
    <div className="grid gap-10 md:grid-cols-[1fr_320px] md:gap-14">
      <div>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[clamp(26px,3vw,36px)]">{isCompany ? "Swipe verified talent" : "Swipe companies"}</h1>
            <p className="mt-1 text-[13px] text-mist">Drag the card or use the buttons. Right means interested.</p>
          </div>
          {!blocked && deck.data && <span className="hidden text-[13px] text-mist sm:block">{cards.length} left</span>}
        </div>

        {blocked ? (
          <Empty
            icon={<Clock size={22} />}
            title={user.status === "pending" ? "Swiping unlocks after approval" : "Your company was not approved"}
            text={
              user.status === "pending"
                ? "A Lumora admin is reviewing your company. Meanwhile, prepare postings in your dashboard."
                : "Update your profile and contact the Lumora team to be reviewed again."
            }
            action={
              <button onClick={() => go("#/app/dashboard")} className={btn.ghost}>
                Open dashboard
              </button>
            }
          />
        ) : deck.loading ? (
          <div className="mx-auto w-full max-w-[360px]">
            <Skeleton rows={1} className="h-[520px]" />
          </div>
        ) : (
          <>
            <div className="relative mx-auto h-[520px] w-full max-w-[360px]">
              {cards.length === 0 && (
                <div className="absolute inset-0 grid place-items-center rounded-[28px] border border-dashed border-line bg-surface/50 p-8 text-center">
                  <div>
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-tint text-sky">
                      <Heart size={24} />
                    </div>
                    <h2 className="mt-5 text-[19px]">That's everyone for now</h2>
                    <p className="mt-2 text-[13px] text-mist">
                      New {isCompany ? "talent joins" : "companies join"} after every hackathon. Reset to see the ones you passed again.
                    </p>
                    <button onClick={resetDeck} disabled={reset.pending} className={`${btn.ghost} mt-6`}>
                      {reset.pending ? <Spinner /> : <RotateCcw size={16} />} Reset my swipes
                    </button>
                  </div>
                </div>
              )}
              {cards
                .slice(0, 3)
                .map((item, idx) => ({ item, idx }))
                .reverse()
                .map(({ item, idx }) => (
                  <Card
                    key={item.id}
                    ref={idx === 0 ? topRef : undefined}
                    item={item}
                    roles={rolesBy[item.id] ?? []}
                    top={idx === 0}
                    depth={idx}
                    onDone={(dir) => done(item, dir)}
                    onInfo={() => setInfo(item)}
                  />
                ))}
            </div>
            <div className="relative z-20 mt-8 flex items-center justify-center gap-5">
              <button
                onClick={() => topRef.current?.fly(-1)}
                disabled={!cards.length}
                className="grid h-16 w-16 place-items-center rounded-full border border-line bg-surface text-bad shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
                aria-label="Not interested"
              >
                <X size={28} />
              </button>
              <button
                onClick={() => cards[0] && setInfo(cards[0])}
                disabled={!cards.length}
                className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface text-mist shadow-sm transition-transform hover:scale-105 disabled:opacity-40"
                aria-label="Details"
              >
                <Info size={20} />
              </button>
              <button
                onClick={() => topRef.current?.fly(1)}
                disabled={!cards.length}
                className="grid h-16 w-16 place-items-center rounded-full bg-accent text-paper shadow-[0_14px_30px_-10px_rgba(255,201,60,0.7)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
                aria-label="Interested"
              >
                <Heart size={28} />
              </button>
            </div>
            <div className="mx-auto mt-4 max-w-[360px]">
              <ErrorNote>{error ?? deck.error}</ErrorNote>
            </div>
          </>
        )}
      </div>

      <aside className="hidden gap-4 md:grid md:content-start">
        <button
          onClick={() => go("#/app/inbox")}
          className="flex items-center justify-between rounded-3xl border border-line bg-surface p-5 text-left transition-colors hover:border-accent"
        >
          <span>
            <span className="block text-[16px] font-semibold">Matches</span>
            <span className="text-[12px] text-mist">{matches.data?.length ? "Open your conversations" : "Mutual right swipes show up here"}</span>
          </span>
          <span className="flex items-center gap-2">
            <Pill tone="blue">{matches.data?.length ?? 0}</Pill>
            <MessageCircle size={18} className="text-mist" />
          </span>
        </button>
        <div className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px]">Interested</h2>
            <Pill tone="tint">{liked.data?.length ?? 0}</Pill>
          </div>
          {!liked.data?.length ? (
            <p className="mt-3 text-[13px] text-mist">Swipe right and they appear here.</p>
          ) : (
            <ul className="mt-3 grid gap-1">
              {liked.data.slice(0, 8).map((i) => (
                <li key={i.id}>
                  <button
                    onClick={() => i.kind !== "admin" && setInfo(i)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-cloud"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue text-[12px] font-bold text-white">{initials(i.name)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">{i.name}</span>
                      <span className="block truncate text-[11px] text-mist">{i.kind === "company" ? i.industry : i.kind === "talent" ? i.cat : ""}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-3xl bg-tint p-5 text-[13px] leading-relaxed text-ink">
          <b>How matching works.</b> When both sides swipe right, a chat opens in Matches. Companies see verified badges first, then projects.
        </div>
      </aside>

      <Modal open={!!info} onClose={() => setInfo(null)}>
        {info && <ProfileDetails p={info} roles={rolesBy[info.id] ?? []} onClose={() => setInfo(null)} />}
      </Modal>

      <Modal open={!!match} onClose={() => setMatch(null)}>
        {match && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent text-paper"
            >
              <Heart size={36} fill="currentColor" />
            </motion.div>
            <h2 className="mt-6 text-[28px] text-accent">It's a match</h2>
            <p className="mt-2 text-[14px] text-mist">{match.other.name} swiped right on you too. Say hello while it's fresh.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => go(`#/app/inbox/${match.m.id}`)} className={btn.primary}>
                <MessageCircle size={16} /> Send a message
              </button>
              <button onClick={() => setMatch(null)} className={btn.ghost}>
                Keep swiping
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ProfileDetails({ p, roles, onClose }: { p: Profile; roles: string[]; onClose: () => void }) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue font-display text-[16px] text-white">{initials(p.name)}</div>
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[22px]">
            {p.name} {p.verified && <BadgeCheck size={18} className="shrink-0 text-sky" aria-label="Verified" />}
          </h2>
          <p className="text-[13px] text-mist">
            {p.kind === "company"
              ? `${p.orgKind === "organization" ? "Organization" : "Company"}, ${p.industry}, ${p.city}, ${p.size}`
              : `${p.cat}, ${p.city}${p.age ? `, ${p.age}` : ""}`}
          </p>
        </div>
      </div>
      <p className="mt-5 text-[14px] leading-relaxed">{p.kind === "company" ? p.about || p.tagline : p.bio || "No bio yet."}</p>
      {p.kind === "talent" && p.badges.length > 0 && (
        <ul className="mt-5 grid gap-2">
          {p.badges.map((b) => (
            <li key={b.id} className="flex items-center gap-2 rounded-xl bg-accent/15 px-3 py-2 text-[13px] text-accent">
              <Trophy size={15} /> <b>{b.title}</b>, {b.hackathonName}
              {b.teamName ? ` (team ${b.teamName})` : ""}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {(p.kind === "company" ? p.tags : p.skills).map((t) => (
          <span key={t} className="rounded-md bg-tint px-2 py-1 text-[12px] font-semibold text-sky">
            {t}
          </span>
        ))}
      </div>
      <dl className="mt-5 grid gap-2 text-[13px]">
        {p.kind === "company" ? (
          <>
            <Row k="Open roles" v={roles.length ? roles.join(", ") : "None right now"} />
            <Row k="Website" v={p.website} />
          </>
        ) : (
          <>
            <Row k="Project" v={p.project} />
            <Row k="Availability" v={p.avail} />
            <Row k="Portfolio" v={p.portfolio} />
          </>
        )}
      </dl>
      <p className="mt-4 text-[12px] text-mist">Contacts are shared once you match.</p>
      <button onClick={onClose} className={`${btn.ghost} mt-6`}>
        Close
      </button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <dt className="text-mist">{k}</dt>
      <dd className="min-w-0 break-words">{v}</dd>
    </div>
  );
}
