import { Calendar, Clock, Globe, MapPin, Trophy, Users } from "lucide-react";
import { statusLabel } from "../../api";
import type { HackathonInput } from "../../api/types";
import { when } from "../../components/form";
import { accentOf, typeLabel } from "./shared";

/* Participant-facing look of the event card, rendered live from the editor form. */
export function EventPreview({ ev }: { ev: HackathonInput }) {
  const a = accentOf(ev.accent);
  const shown = ev.places.slice(0, 5);
  const more = ev.places.length - shown.length;
  const sameDay = ev.start.slice(0, 10) === ev.end.slice(0, 10);
  const where = ev.mode === "online" ? "Online" : ev.city || "City not set";

  return (
    <article className={`overflow-hidden rounded-3xl p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] ${a.card}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-black/15 px-2.5 py-1 text-[11px] font-semibold">{statusLabel(ev.status)}</span>
        <span className="rounded-full bg-black/10 px-2.5 py-1 text-[11px] font-semibold">{typeLabel(ev.eventType)}</span>
        <span className="rounded-full bg-black/10 px-2.5 py-1 text-[11px] font-semibold capitalize">{ev.mode}</span>
      </div>
      <h3 className="mt-4 break-words text-[22px] leading-tight">{ev.title || "Untitled event"}</h3>
      <div className={`mt-1 text-[12px] ${a.sub}`}>by {ev.organizerName || "Lumora"}</div>
      {ev.short && <p className={`mt-3 text-[13px] leading-relaxed ${a.sub}`}>{ev.short}</p>}

      <div className={`mt-4 grid gap-1.5 text-[12px] ${a.sub}`}>
        <span className="flex items-center gap-1.5">
          <Calendar size={13} className="shrink-0" />
          {ev.start ? when(ev.start, false) : "Date not set"}
          {!sameDay && ev.end ? ` to ${when(ev.end, false)}` : ""}
        </span>
        {ev.start && (
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="shrink-0" />
            {ev.start.slice(11, 16)} to {ev.end.slice(11, 16)}, {ev.timezone}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          {ev.mode === "online" ? <Globe size={13} className="shrink-0" /> : <MapPin size={13} className="shrink-0" />}
          <span className="min-w-0 truncate">
            {where}
            {ev.mode !== "online" && ev.venue ? `, ${ev.venue}` : ""}
            {ev.mode === "hybrid" ? " and online" : ""}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={13} className="shrink-0" />
          Teams of {ev.teamMin === ev.teamMax ? ev.teamMin : `${ev.teamMin} to ${ev.teamMax}`}
          {ev.soloAllowed ? ", solo allowed" : ""}
          {ev.maxTeams ? `, up to ${ev.maxTeams} teams` : ""}
        </span>
      </div>

      {ev.tracks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {ev.tracks.map((t) => (
            <span key={t} className="rounded-md bg-black/15 px-2 py-0.5 text-[11px] font-semibold">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-black/15 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold">
          <Trophy size={13} /> {ev.places.length} winning place{ev.places.length === 1 ? "" : "s"}
        </div>
        <ul className="grid gap-1 text-[12px]">
          {shown.map((p) => (
            <li key={p.place} className="flex justify-between gap-3">
              <span className="shrink-0 font-semibold">{p.title || `Place ${p.place}`}</span>
              <span className={`min-w-0 truncate text-right ${a.sub}`}>{p.prize || "Prize not set"}</span>
            </li>
          ))}
        </ul>
        {more > 0 && <div className={`mt-1 text-[11px] ${a.sub}`}>+{more} more</div>}
        {(ev.nominations.length > 0 || ev.finalists > 0) && (
          <div className={`mt-2 text-[11px] ${a.sub}`}>
            {ev.nominations.length > 0 && `${ev.nominations.length} special nomination${ev.nominations.length === 1 ? "" : "s"}`}
            {ev.nominations.length > 0 && ev.finalists > 0 && ", "}
            {ev.finalists > 0 && `${ev.finalists} finalists`}
          </div>
        )}
      </div>
    </article>
  );
}
