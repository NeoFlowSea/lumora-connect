import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, Heart, Info, MessageCircle, Send } from "lucide-react";
import { api } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { Match, Message, User } from "../api/types";
import { Empty, ErrorNote, Skeleton, Spinner, ago } from "../components/form";
import { btn } from "../components/ui";
import { go } from "../lib/router";
import { Avatar, UserInfoModal, Verified } from "./parts/common";

type MatchRow = Match & { other: User; last: Message | null };

function kindLine(u: User) {
  if (u.kind === "talent") return `${u.cat}, ${u.city}`;
  if (u.kind === "company") return `${u.industry}, ${u.city}`;
  return "Lumora team";
}

function time(iso: string) {
  const d = new Date(iso);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function Inbox({ matchId }: { matchId?: string }) {
  const me = useSession();
  const matches = useApi(() => api.swipe.matches(), []);
  const list = matches.data ?? [];
  const current = matchId ? list.find((m) => m.id === matchId) : undefined;

  if (!me) return null;

  if (matches.loading) {
    return (
      <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton rows={4} className="h-16" />
        <div className="hidden h-[420px] animate-pulse rounded-3xl bg-surface/70 md:block" />
      </div>
    );
  }
  if (matches.error) return <ErrorNote>{matches.error}</ErrorNote>;

  if (!list.length) {
    return (
      <div className="mx-auto max-w-[620px]">
        <h1 className="mb-6 text-[clamp(26px,3vw,36px)]">Messages</h1>
        <Empty
          icon={<Heart size={20} />}
          title="No matches yet"
          text={
            me.kind === "company"
              ? "A match happens when you swipe right on a talent who already liked your company. Then you can message each other here."
              : "A match happens when you swipe right on a company that already liked your profile. Then you can message each other here."
          }
          action={
            <button onClick={() => go("#/app/swipe")} className={btn.primary}>
              Start swiping
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className={`mb-5 text-[clamp(26px,3vw,36px)] ${matchId ? "hidden md:block" : ""}`}>Messages</h1>
      <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${matchId ? "hidden md:block" : ""}`}>
          <ul className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1 overflow-x-hidden rounded-3xl border border-line bg-surface p-2 md:max-h-[calc(100svh-13rem)] md:overflow-y-auto">
            {list.map((m) => {
              const on = m.id === matchId;
              const mine = m.last?.fromId === me.id;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => go(`#/app/inbox/${m.id}`)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${on ? "bg-tint" : "hover:bg-tint/60"}`}
                  >
                    <Avatar name={m.other.name} size={42} tone={m.other.kind === "company" ? "paper" : "blue"} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-[14px] font-semibold ${on ? "text-accent" : ""}`}>{m.other.name}</span>
                        <span className="shrink-0 text-[11px] text-mist">{time(m.last?.at ?? m.at)}</span>
                      </span>
                      <span className="block truncate text-[12px] text-mist">{m.last ? `${mine ? "You: " : ""}${m.last.text}` : "New match. Say hello"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        <div className={`${matchId ? "" : "hidden md:block"}`}>
          {!matchId ? (
            <div className="grid h-full min-h-[420px] place-items-center rounded-3xl border border-dashed border-line p-8 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-tint text-sky">
                  <MessageCircle size={20} />
                </div>
                <div className="font-semibold">Pick a conversation</div>
                <p className="mt-1 text-[13px] text-mist">Your matches are on the left.</p>
              </div>
            </div>
          ) : current ? (
            <Conversation key={current.id} match={current} meId={me.id} />
          ) : (
            <Empty
              title="Conversation not found"
              text="This match may have been removed, or the link belongs to another account."
              action={
                <button onClick={() => go("#/app/inbox")} className={btn.ghost}>
                  Back to messages
                </button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Conversation({ match, meId }: { match: MatchRow; meId: string }) {
  const msgs = useApi(() => api.swipe.messages(match.id), [match.id]);
  const send = useAction(api.swipe.send);
  const [text, setText] = useState("");
  const [info, setInfo] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const count = msgs.data?.length ?? 0;

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  async function submit() {
    const t = text.trim();
    if (!t || send.pending) return;
    const sent = await send.run(match.id, t);
    if (sent) setText("");
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const other = match.other;

  return (
    <section className="flex h-[calc(100svh-12.5rem)] min-h-[420px] flex-col overflow-hidden rounded-3xl border border-line bg-surface md:h-[calc(100svh-13rem)]">
      <header className="flex items-center gap-3 border-b border-line px-3 py-3 md:px-5">
        <button onClick={() => go("#/app/inbox")} aria-label="Back to messages" className="grid h-9 w-9 place-items-center rounded-full text-mist hover:bg-tint hover:text-ink md:hidden">
          <ArrowLeft size={18} />
        </button>
        <Avatar name={other.name} size={40} tone={other.kind === "company" ? "paper" : "blue"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="truncate font-semibold">{other.name}</span>
            {other.kind !== "admin" && <Verified on={other.verified} />}
          </div>
          <div className="truncate text-[12px] text-mist">{kindLine(other)}</div>
        </div>
        <button onClick={() => setInfo(true)} className={`${btn.sm} border border-line hover:bg-tint`}>
          <Info size={14} /> <span className="hidden sm:inline">Profile</span>
        </button>
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto px-3 py-4 md:px-5">
        {msgs.loading ? (
          <Skeleton rows={3} className="h-10" />
        ) : msgs.error ? (
          <ErrorNote>{msgs.error}</ErrorNote>
        ) : !count ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-paper">
                <Heart size={20} fill="currentColor" />
              </div>
              <div className="font-semibold">You matched {ago(match.at)}</div>
              <p className="mt-1 max-w-[36ch] text-[13px] text-mist">
                {other.kind === "company" ? "Introduce yourself and mention the role you are interested in." : "Say hello and suggest a time for a short call."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="grid gap-2">
            {msgs.data!.map((m, i) => {
              const mine = m.fromId === meId;
              const prev = msgs.data![i - 1];
              const showTime = !prev || new Date(m.at).getTime() - new Date(prev.at).getTime() > 30 * 60000;
              return (
                <li key={m.id} className="grid">
                  {showTime && <span className="my-2 text-center text-[11px] text-mist">{time(m.at)}</span>}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-snug ${
                        mine ? "rounded-br-md bg-accent text-paper" : "rounded-bl-md border border-line bg-paper/60 text-ink"
                      }`}
                      title={new Date(m.at).toLocaleString("en-GB")}
                    >
                      {m.text}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-line p-3">
        {send.error && (
          <div className="mb-2">
            <ErrorNote>{send.error}</ErrorNote>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder={`Message ${other.name}`}
            aria-label="Message"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-mist/70 focus:border-sky"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || send.pending}
            aria-label="Send message"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-paper transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {send.pending ? <Spinner /> : <Send size={17} />}
          </button>
        </div>
        <p className="mt-1.5 hidden text-[11px] text-mist md:block">Enter to send, Shift and Enter for a new line.</p>
      </div>
      <UserInfoModal user={info ? other : null} onClose={() => setInfo(false)} />
    </section>
  );
}
