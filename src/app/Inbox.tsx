import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ExternalLink, Heart, MessageCircle, Send } from "lucide-react";
import { api } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { Match, Message, User } from "../api/types";
import { Empty, ErrorNote, Skeleton, Spinner, ago } from "../components/form";
import { btn } from "../components/ui";
import { locale, t, useLang } from "../i18n";
import { go } from "../lib/router";
import { Avatar, Verified } from "./parts/common";

/* #/app/inbox and #/app/inbox/:matchId
   Phones show the list or the chat, never both. Long names and messages wrap. */

type MatchRow = Match & { other: User; last: Message | null };

function kindLine(u: User) {
  if (u.kind === "talent") return [u.headline || u.cat, u.city].filter(Boolean).join(", ");
  if (u.kind === "company") return [u.industry, u.city].filter(Boolean).join(", ");
  return t("app.inbox.lumoraTeam");
}

/** full page of the other side: talent pages are inside the app, company pages are public */
const pageOf = (u: User) => (u.kind === "company" ? `#/company/${u.id}` : u.kind === "talent" ? `#/app/talent/${u.id}` : "");

function stamp(iso: string) {
  const d = new Date(iso);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(locale(), { day: "numeric", month: "short" });
}

export function Inbox({ matchId }: { matchId?: string }) {
  useLang();
  const me = useSession();
  const matches = useApi(() => api.swipe.matches(), []);
  const list = matches.data ?? [];
  const current = matchId ? list.find((m) => m.id === matchId) : undefined;

  if (!me) return null;

  if (matches.loading) {
    return (
      <div className="grid gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
        <Skeleton rows={4} className="h-16" />
        <div className="hidden h-[420px] animate-pulse rounded-xl bg-surface/70 md:block" />
      </div>
    );
  }
  if (matches.error) return <ErrorNote>{matches.error}</ErrorNote>;

  if (!list.length) {
    return (
      <div className="mx-auto max-w-[620px]">
        <h1 className="mb-6 text-[clamp(26px,3vw,34px)]">{t("app.inbox.title")}</h1>
        <Empty
          icon={<Heart size={20} />}
          title={t("app.inbox.emptyTitle")}
          text={t(me.kind === "company" ? "app.inbox.emptyCompany" : "app.inbox.emptyTalent")}
          action={
            <button onClick={() => go("#/app/swipe")} className={btn.primary}>
              {t("app.inbox.goSwipe")}
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <h1 className={`mb-5 text-[clamp(26px,3vw,34px)] ${matchId ? "hidden md:block" : ""}`}>{t("app.inbox.title")}</h1>
      <div className="grid min-w-0 gap-4 md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={`min-w-0 ${matchId ? "hidden md:block" : ""}`} aria-label={t("app.inbox.listLabel")}>
          <ul className="grid min-w-0 gap-1 rounded-xl border border-line bg-surface p-1.5 md:max-h-[calc(100svh-14rem)] md:overflow-y-auto">
            {list.map((m) => {
              const on = m.id === matchId;
              const mine = m.last?.fromId === me.id;
              return (
                <li key={m.id} className="min-w-0">
                  <button
                    onClick={() => go(`#/app/inbox/${m.id}`)}
                    aria-current={on ? "true" : undefined}
                    className={`flex w-full min-w-0 items-center gap-3 rounded-lg px-2.5 py-3 text-left transition-colors ${on ? "bg-tint" : "hover:bg-tint/60"}`}
                  >
                    <Avatar name={m.other.name} size={44} tone={m.other.kind === "company" ? "paper" : "blue"} />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-baseline justify-between gap-2">
                        <span className={`min-w-0 truncate text-[15px] font-semibold ${on ? "text-accent" : ""}`}>{m.other.name}</span>
                        <span className="shrink-0 text-[12px] text-mist">{stamp(m.last?.at ?? m.at)}</span>
                      </span>
                      <span className="block min-w-0 truncate text-[13px] text-mist">
                        {m.last ? `${mine ? t("app.inbox.you") : ""}${m.last.text}` : t("app.inbox.newMatch")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        <div className={`min-w-0 ${matchId ? "" : "hidden md:block"}`}>
          {!matchId ? (
            <div className="grid h-full min-h-[420px] place-items-center rounded-xl border border-dashed border-line p-8 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-tint text-sky">
                  <MessageCircle size={20} />
                </div>
                <div className="font-semibold">{t("app.inbox.pickTitle")}</div>
                <p className="mt-1 text-[13px] text-mist">{t("app.inbox.pickText")}</p>
              </div>
            </div>
          ) : current ? (
            <Conversation key={current.id} match={current} meId={me.id} />
          ) : (
            <Empty
              title={t("app.inbox.notFoundTitle")}
              text={t("app.inbox.notFoundText")}
              action={
                <button onClick={() => go("#/app/inbox")} className={btn.ghost}>
                  {t("app.inbox.back")}
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
  const scroller = useRef<HTMLDivElement>(null);
  const count = msgs.data?.length ?? 0;

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  async function submit() {
    const v = text.trim();
    if (!v || send.pending) return;
    const sent = await send.run(match.id, v);
    if (sent) setText("");
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  const other = match.other;
  const page = pageOf(other);

  return (
    <section className="flex h-[calc(100svh-13.5rem)] min-h-[380px] min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface md:h-[calc(100svh-14rem)]">
      <header className="flex min-w-0 items-center gap-2 border-b border-line px-2 py-2 md:gap-3 md:px-4">
        <button onClick={() => go("#/app/inbox")} aria-label={t("app.inbox.back")} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-mist hover:bg-tint hover:text-ink md:hidden">
          <ArrowLeft size={19} />
        </button>
        <Avatar name={other.name} size={40} tone={other.kind === "company" ? "paper" : "blue"} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-[15px] font-semibold">{other.name}</span>
            {other.kind !== "admin" && (
              <span className="hidden shrink-0 sm:inline">
                <Verified on={other.verified} />
              </span>
            )}
          </div>
          <div className="truncate text-[13px] text-mist">{kindLine(other)}</div>
        </div>
        {page && (
          <a href={page} className={`${btn.sm} min-h-11 shrink-0 border border-line px-3 hover:border-sky hover:bg-tint md:min-h-9`} aria-label={t("app.inbox.viewPageOf", { name: other.name })}>
            <ExternalLink size={14} /> <span className="hidden sm:inline">{t(other.kind === "company" ? "app.inbox.companyPage" : "app.inbox.profilePage")}</span>
          </a>
        )}
      </header>

      <div ref={scroller} className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 md:px-5">
        {msgs.loading ? (
          <Skeleton rows={3} className="h-10" />
        ) : msgs.error ? (
          <ErrorNote>{msgs.error}</ErrorNote>
        ) : !count ? (
          <div className="grid h-full place-items-center text-center">
            <div className="px-2">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-tint text-sky">
                <Heart size={20} />
              </div>
              <div className="font-semibold">{t("app.inbox.matchedAgo", { when: ago(match.at) })}</div>
              <p className="mx-auto mt-1 max-w-[36ch] text-[13px] text-mist">{t(other.kind === "company" ? "app.inbox.hintToCompany" : "app.inbox.hintToTalent")}</p>
            </div>
          </div>
        ) : (
          <ul className="grid min-w-0 gap-1.5">
            {msgs.data!.map((m, i) => {
              const mine = m.fromId === meId;
              const prev = msgs.data![i - 1];
              const showTime = !prev || new Date(m.at).getTime() - new Date(prev.at).getTime() > 30 * 60000;
              return (
                <li key={m.id} className="grid min-w-0">
                  {showTime && <span className="my-2 text-center text-[12px] text-mist">{stamp(m.at)}</span>}
                  <div className={`flex min-w-0 ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2 text-[15px] leading-snug [overflow-wrap:anywhere] md:max-w-[75%] ${
                        mine ? "rounded-br-md bg-blue text-white" : "rounded-bl-md border border-line bg-paper/60 text-ink"
                      }`}
                      title={new Date(m.at).toLocaleString(locale())}
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

      <div className="border-t border-line p-2.5 md:p-3">
        {send.error && (
          <div className="mb-2">
            <ErrorNote>{send.error}</ErrorNote>
          </div>
        )}
        <div className="flex min-w-0 items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder={t("app.inbox.placeholder")}
            aria-label={t("app.inbox.messageTo", { name: other.name })}
            className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-lg border border-line bg-paper/60 px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-mist/70 focus:border-sky"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || send.pending}
            aria-label={t("app.inbox.send")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent text-paper transition-colors hover:bg-accent-deep disabled:opacity-50"
          >
            {send.pending ? <Spinner /> : <Send size={17} />}
          </button>
        </div>
        <p className="mt-1.5 hidden text-[12px] text-mist md:block">{t("app.inbox.enterHint")}</p>
      </div>
    </section>
  );
}
