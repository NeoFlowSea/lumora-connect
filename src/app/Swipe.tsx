import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Heart, Info, MapPin, RotateCcw, Trophy, X } from "lucide-react";
import { companies, talents, type Company, type Talent } from "../data";
import { actions, useStore } from "../lib/store";
import { Modal, Pill, btn, ease, initials, useToast } from "../components/ui";
import { Shield } from "../components/Logo";

type Item =
  | { kind: "company"; id: string; data: Company }
  | { kind: "talent"; id: string; data: Talent };

type Handle = { fly: (dir: 1 | -1) => void };

const Card = forwardRef<Handle, { item: Item; top: boolean; depth: number; onDone: (dir: 1 | -1) => void; onInfo: () => void }>(
  function Card({ item, top, depth, onDone, onInfo }, ref) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 300], [-16, 16]);
    const likeOp = useTransform(x, [30, 130], [0, 1]);
    const nopeOp = useTransform(x, [-30, -130], [0, 1]);
    const controls = useAnimation();
    const busy = useRef(false);

    async function fly(dir: 1 | -1) {
      if (busy.current) return;
      busy.current = true;
      await controls.start({ x: dir * 700, rotate: dir * 24, opacity: 0, transition: { duration: 0.45, ease } });
      onDone(dir);
    }
    useImperativeHandle(ref, () => ({ fly }));

    function onDragEnd(_: unknown, info: PanInfo) {
      if (info.offset.x > 110 || info.velocity.x > 700) fly(1);
      else if (info.offset.x < -110 || info.velocity.x < -700) fly(-1);
      else controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    }

    const d = item.data;
    const title = item.kind === "company" ? d.name : (d as Talent).name;
    const sub = item.kind === "company" ? `${(d as Company).industry}, ${d.city}` : `${(d as Talent).cat}, ${d.city}`;
    const tags = item.kind === "company" ? (d as Company).tags : (d as Talent).skills;
    const hue = item.kind === "company" ? (d as Company).hue : "#1a4ba8";

    return (
      <motion.div
        drag={top ? "x" : false}
        dragElastic={0.9}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={onDragEnd}
        animate={controls}
        style={{ x, rotate, zIndex: 10 - depth }}
        initial={{ scale: 0.92, y: 30, opacity: 0 }}
        whileInView={{ scale: 1 - depth * 0.04, y: depth * 18, opacity: 1 }}
        transition={{ duration: 0.45, ease }}
        className={`absolute inset-0 select-none overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_30px_60px_-30px_rgba(11,31,58,0.4)] ${
          top ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <div className="h-[42%] p-5 text-white" style={{ background: `linear-gradient(135deg, ${hue}, #4f8be0)` }}>
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 font-display text-[15px] text-blue">{initials(title)}</div>
            {item.kind === "company" ? (
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-semibold">{(d as Company).size}</span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-semibold">
                <Shield size={9} /> verified
              </span>
            )}
          </div>
          <div className="mt-6 font-display text-[24px] leading-tight">{title}</div>
          <div className="mt-1 flex items-center gap-1 text-[13px] text-white/85">
            <MapPin size={13} /> {sub}
          </div>
        </div>
        <div className="flex h-[58%] flex-col p-5">
          {item.kind === "talent" && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-tint px-3 py-2 text-[13px]">
              <Trophy size={15} className="shrink-0 text-blue" />
              <span className="truncate">
                <b>{(d as Talent).place}</b>, {(d as Talent).event}
              </span>
            </div>
          )}
          <p className="text-[15px] leading-relaxed text-ink">{item.kind === "company" ? (d as Company).tagline : (d as Talent).bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-md bg-tint px-2 py-1 text-[12px] font-semibold text-blue">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 pt-3 text-[13px] text-mist">
            <span className="min-w-0 truncate">
              {item.kind === "company" ? `Hiring: ${(d as Company).roles.join(", ")}` : `Built ${(d as Talent).project}. ${(d as Talent).avail}.`}
            </span>
            {top && (
              <button onClick={onInfo} onPointerDown={(e) => e.stopPropagation()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-mist hover:bg-cloud" aria-label="Details">
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
  },
);

export function Swipe() {
  const { role, liked, passed } = useStore();
  const toast = useToast();
  const topRef = useRef<Handle>(null);
  const [info, setInfo] = useState<Item | null>(null);
  const [match, setMatch] = useState<Item | null>(null);

  const all: Item[] = useMemo(
    () =>
      role === "company"
        ? talents.map((t) => ({ kind: "talent" as const, id: t.id, data: t }))
        : companies.map((c) => ({ kind: "company" as const, id: c.id, data: c })),
    [role],
  );
  const seen = new Set([...liked, ...passed]);
  const deck = all.filter((i) => !seen.has(i.id));
  const likedItems = all.filter((i) => liked.includes(i.id));

  function done(item: Item, dir: 1 | -1) {
    if (dir === 1) {
      actions.like(item.id);
      // Preview rule: every second profile likes you back.
      if (item.id.charCodeAt(item.id.length - 1) % 2 === 0) setMatch(item);
      else toast("Saved. They will see your profile.");
    } else {
      actions.pass(item.id);
    }
  }

  const name = (i: Item) => (i.kind === "company" ? i.data.name : i.data.name);

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_320px] md:gap-14">
      <div>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[clamp(26px,3vw,36px)]">{role === "company" ? "Swipe verified talent" : "Swipe companies"}</h1>
            <p className="mt-1 text-[14px] text-mist">Drag the card, or use the buttons. Right means interested.</p>
          </div>
          <span className="hidden text-[13px] text-mist sm:block">{deck.length} left</span>
        </div>

        <div className="relative mx-auto h-[520px] w-full max-w-[360px]">
          <AnimatePresence>
            {deck.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 grid place-items-center rounded-[28px] border border-dashed border-line bg-white p-8 text-center"
              >
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-tint text-blue">
                    <Heart size={24} />
                  </div>
                  <h2 className="mt-5 text-[20px]">That's everyone for today</h2>
                  <p className="mt-2 text-[14px] text-mist">New {role === "company" ? "profiles" : "companies"} appear after each hackathon. Reset to swipe again.</p>
                  <button onClick={actions.resetDeck} className={`${btn.ghost} mt-6`}>
                    <RotateCcw size={16} /> Reset the deck
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {deck
            .slice(0, 3)
            .map((item, idx) => ({ item, idx }))
            .reverse()
            .map(({ item, idx }) => (
              <Card
                key={item.id}
                ref={idx === 0 ? topRef : undefined}
                item={item}
                top={idx === 0}
                depth={idx}
                onDone={(dir) => done(item, dir)}
                onInfo={() => setInfo(item)}
              />
            ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-5">
          <button
            onClick={() => topRef.current?.fly(-1)}
            disabled={!deck.length}
            className="grid h-16 w-16 place-items-center rounded-full border border-line bg-white text-bad shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
            aria-label="Not interested"
          >
            <X size={28} />
          </button>
          <button
            onClick={() => deck[0] && setInfo(deck[0])}
            disabled={!deck.length}
            className="grid h-12 w-12 place-items-center rounded-full border border-line bg-white text-mist shadow-sm transition-transform hover:scale-105 disabled:opacity-40"
            aria-label="Details"
          >
            <Info size={20} />
          </button>
          <button
            onClick={() => topRef.current?.fly(1)}
            disabled={!deck.length}
            className="grid h-16 w-16 place-items-center rounded-full bg-blue text-white shadow-[0_14px_30px_-10px_rgba(26,75,168,0.8)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
            aria-label="Interested"
          >
            <Heart size={28} />
          </button>
        </div>
      </div>

      {/* liked list */}
      <aside className="hidden md:block">
        <div className="rounded-3xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px]">Interested</h2>
            <Pill tone="tint">{likedItems.length}</Pill>
          </div>
          {likedItems.length === 0 ? (
            <p className="mt-3 text-[14px] text-mist">Swipe right and they appear here.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {likedItems.map((i) => (
                <li key={i.id}>
                  <button onClick={() => setInfo(i)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-cloud">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-blue text-[12px] font-bold text-white">{initials(name(i))}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold">{name(i)}</span>
                      <span className="block truncate text-[12px] text-mist">{i.kind === "company" ? i.data.industry : i.data.cat}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 rounded-3xl bg-tint p-5 text-[14px] text-ink">
          <b>How matching works.</b> Both sides swipe right, and the chat opens. Companies see your verified placements first, then your projects.
        </div>
      </aside>

      {/* details */}
      <Modal open={!!info} onClose={() => setInfo(null)}>
        {info && (
          <div>
            <h2 className="text-[24px]">{name(info)}</h2>
            <p className="mt-1 text-[14px] text-mist">
              {info.kind === "company" ? `${info.data.industry}, ${info.data.city}, ${info.data.size}` : `${info.data.cat}, ${info.data.city}, ${info.data.age}`}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed">{info.kind === "company" ? info.data.about : info.data.bio}</p>
            {info.kind === "company" ? (
              <>
                <h3 className="mt-5 text-[15px]">Open roles</h3>
                <ul className="mt-2 space-y-1 text-[14px] text-mist">
                  {info.data.roles.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-tint px-3 py-2 text-[13px]">
                  <Trophy size={15} className="text-blue" />
                  <b>{info.data.place}</b>, {info.data.event}
                </div>
                <p className="mt-3 text-[14px] text-mist">Built {info.data.project}. Available {info.data.avail.toLowerCase()}.</p>
              </>
            )}
            <div className="mt-6 flex gap-3">
              <button onClick={() => setInfo(null)} className={btn.ghost}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* match */}
      <Modal open={!!match} onClose={() => setMatch(null)}>
        {match && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-blue text-white"
            >
              <Heart size={36} fill="currentColor" />
            </motion.div>
            <h2 className="mt-6 text-[28px] text-blue">It's a match</h2>
            <p className="mt-2 text-[15px] text-mist">
              {name(match)} swiped right on you too. In the full version, a chat opens here.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setMatch(null)} className={btn.primary}>
                Keep swiping
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
