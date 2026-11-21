import { CalendarDays, Clock, Globe, MapPin, Trophy, Users } from "lucide-react";
import { statusLabel } from "../../api";
import type { HackathonInput } from "../../api/types";
import { when } from "../../components/form";
import { Pill } from "../../components/ui";
import { lumora, photo } from "../../content/lumora";
import { t, tp, trackLabel } from "../../i18n";
import { placeTitle } from "../../app/HackathonsTab";
import { typeLabel } from "./shared";

/* Participant-facing look of the event card, rendered live from the editor form.
   Mirrors the card on #/app/hackathons. */
export function EventPreview({ ev }: { ev: HackathonInput }) {
  const shown = ev.places.slice(0, 5);
  const more = ev.places.length - shown.length;
  const sameDay = ev.start.slice(0, 10) === ev.end.slice(0, 10);
  const where = ev.mode === "online" ? t("app.hack.mode.online") : ev.city || t("admin.preview.noCity");

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface">
      {ev.photo && <img src={photo(ev.photo, 800)} alt={lumora.photos[ev.photo] ?? ""} className="block aspect-[16/9] w-full object-cover" />}
      <div className="p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone="line">{typeLabel(ev.eventType)}</Pill>
          <Pill tone={ev.status === "registration_open" ? "good" : "tint"}>{statusLabel(ev.status)}</Pill>
          {ev.demo && <Pill tone="line">{t("app.hack.demo")}</Pill>}
        </div>
        <h3 className="mt-3 break-words text-[19px] leading-tight">{ev.title || t("admin.preview.untitled")}</h3>
        <div className="mt-1 text-[13px] text-mist">{t("app.hack.by", { name: ev.organizerName || "Lumora" })}</div>
        {ev.short && <p className="mt-3 break-words text-[14px] leading-relaxed text-mist">{ev.short}</p>}

        <div className="mt-4 grid gap-1.5 text-[13px] text-mist">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} className="shrink-0" />
            {ev.start ? when(ev.start, false) : t("admin.preview.noDate")}
            {!sameDay && ev.end ? ` – ${when(ev.end, false)}` : ""}
          </span>
          {ev.start && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="shrink-0" />
              {ev.start.slice(11, 16)}–{ev.end.slice(11, 16)}, {ev.timezone}
            </span>
          )}
          <span className="flex min-w-0 items-center gap-1.5">
            {ev.mode === "online" ? <Globe size={14} className="shrink-0" /> : <MapPin size={14} className="shrink-0" />}
            <span className="min-w-0 truncate">
              {where}
              {ev.mode !== "online" && ev.venue ? `, ${ev.venue}` : ""} · {t(`app.hack.mode.${ev.mode}`)}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} className="shrink-0" />
            {ev.teamMin === ev.teamMax ? tp("app.hack.teamOf", ev.teamMin) : t("app.hack.teamRange", { min: ev.teamMin, max: ev.teamMax })}
            {ev.soloAllowed ? `, ${t("app.hack.soloOk")}` : ""}
          </span>
        </div>

        {ev.tracks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {ev.tracks.map((x) => (
              <span key={x} className="rounded-md bg-tint px-2 py-0.5 text-[12px] text-sky">
                {trackLabel(x)}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-lg bg-paper/50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
            <Trophy size={14} className="text-accent" /> {t("app.hack.prizes")}
          </div>
          <ul className="grid gap-1 text-[13px]">
            {shown.map((p) => (
              <li key={p.place} className="flex justify-between gap-3">
                <span className="shrink-0 font-semibold">{placeTitle(p.title) || t("app.hack.placeN", { n: p.place })}</span>
                <span className="min-w-0 truncate text-right text-mist">{p.prize || t("app.hack.prizeTbd")}</span>
              </li>
            ))}
          </ul>
          {more > 0 && <div className="mt-1 text-[12px] text-mist">{t("admin.preview.more", { n: more })}</div>}
        </div>

        {ev.status === "finished" && (ev.podium?.length ?? 0) > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 text-[12px] text-mist">{t("app.hack.podium")}</div>
            <ol className="grid gap-1 text-[13px]">
              {ev.podium!.map((n, i) => (
                <li key={i} className="break-words">
                  {i + 1}. {n || "—"}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </article>
  );
}
