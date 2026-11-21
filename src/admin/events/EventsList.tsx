import { useMemo, useState } from "react";
import { CalendarPlus, Copy, Globe, MapPin, Pencil, Trash2, Trophy, Users } from "lucide-react";
import { api, localNow, statusLabel } from "../../api";
import { useAction, useApi, useSession } from "../../api/hooks";
import type { Hackathon } from "../../api/types";
import { Empty, ErrorNote, Skeleton, Spinner, when } from "../../components/form";
import { Modal, Pill, btn, useToast } from "../../components/ui";
import { go } from "../../lib/router";
import { t, tp } from "../../i18n";
import { FilterChip } from "../AdminShell";
import { statusTone, typeLabel } from "./shared";

type Filter = "all" | "drafts" | "open" | "upcoming" | "finished" | "cancelled";

const FILTERS: Filter[] = ["all", "drafts", "open", "upcoming", "finished", "cancelled"];

function matches(h: Hackathon, f: Filter, nowLocal: string): boolean {
  switch (f) {
    case "all":
      return true;
    case "drafts":
      return h.status === "draft";
    case "open":
      return h.status === "registration_open";
    case "upcoming":
      return ["published", "registration_open", "registration_closed", "in_progress"].includes(h.status) && h.end >= nowLocal;
    case "finished":
      return h.status === "finished";
    case "cancelled":
      return h.status === "cancelled";
  }
}

export function EventsList() {
  const me = useSession();
  const isSuper = me?.kind === "admin" && me.level === "super";
  const toast = useToast();
  const events = useApi(() => api.hackathons.list({ includeDrafts: true }), []);
  const counts = useApi(() => api.hackathons.teamCounts(), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [toDelete, setToDelete] = useState<Hackathon | null>(null);
  const del = useAction(async (id: string) => {
    await api.hackathons.remove(id);
    return true;
  });

  const nowLocal = localNow();
  const list = useMemo(() => {
    const all = events.data ?? [];
    // newest first for finished ones, soonest first for the rest
    return all.filter((h) => matches(h, filter, nowLocal)).sort((a, b) => (filter === "finished" ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start)));
  }, [events.data, filter, nowLocal]);

  const countFor = (f: Filter) => (events.data ?? []).filter((h) => matches(h, f, nowLocal)).length;

  async function confirmDelete() {
    if (!toDelete) return;
    if (await del.run(toDelete.id)) {
      toast(t("admin.events.deletedToast", { title: toDelete.title }));
      setToDelete(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(24px,3vw,32px)]">{t("admin.nav.events")}</h1>
          <p className="mt-1 text-[14px] text-mist">{t("admin.events.lead")}</p>
        </div>
        <button onClick={() => go("#/admin/events/new")} className={btn.primary}>
          <CalendarPlus size={16} /> {t("admin.events.create")}
        </button>
      </div>

      <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <FilterChip key={f} on={filter === f} onClick={() => setFilter(f)}>
            {t(`admin.events.filter.${f}`)}
            {events.data && <span className="text-mist">{countFor(f)}</span>}
          </FilterChip>
        ))}
      </div>

      <div className="mt-5">
        {events.error && <ErrorNote>{events.error}</ErrorNote>}
        {events.loading && !events.data ? (
          <Skeleton rows={4} className="h-28" />
        ) : list.length === 0 ? (
          <Empty
            icon={<CalendarPlus size={20} />}
            title={t(filter === "all" ? "admin.events.emptyTitle" : "admin.events.emptyGroup")}
            text={t(filter === "all" ? "admin.events.emptyText" : "admin.events.emptyGroupText")}
            action={
              <button onClick={() => go("#/admin/events/new")} className={btn.primary}>
                {t("admin.events.create")}
              </button>
            }
          />
        ) : (
          <ul className="grid gap-3">
            {list.map((h) => {
              const teams = counts.data?.[h.id] ?? 0;
              return (
                <li key={h.id} className="min-w-0 rounded-xl border border-line bg-surface p-4 md:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={statusTone(h.status)}>{statusLabel(h.status)}</Pill>
                        {h.demo && <Pill tone="line">{t("app.hack.demo")}</Pill>}
                        <span className="text-[12px] text-mist">{typeLabel(h.eventType)}</span>
                        <span className="text-[12px] text-mist">{t("app.hack.by", { name: h.organizerName })}</span>
                      </div>
                      <h2 className="mt-2 break-words text-[17px] md:text-[19px]">{h.title}</h2>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-mist">
                        <span>{when(h.start)}</span>
                        <span className="flex items-center gap-1">
                          {h.mode === "online" ? <Globe size={12} /> : <MapPin size={12} />}
                          {h.mode === "online" ? t("app.hack.mode.online") : h.city}
                          {h.mode === "hybrid" ? `, ${t("app.hack.mode.hybrid").toLowerCase()}` : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {h.maxTeams ? t("admin.events.teamsOf", { n: teams, max: h.maxTeams }) : `${teams} ${tp("app.hack.teamsN", teams)}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy size={12} /> {tp("admin.events.placesN", h.places.length)}
                          {h.results.length ? `, ${tp("admin.events.resultsN", h.results.length)}` : ""}
                          {h.participants ? `, ${h.participants} ${tp("app.hack.participantsN", h.participants)}` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => go(`#/admin/events/${h.id}`)} className={`${btn.sm} min-h-11 border border-line hover:border-sky hover:bg-tint md:min-h-9`}>
                        <Pencil size={13} /> {t("common.action.edit")}
                      </button>
                      <button onClick={() => go(`#/admin/events/${h.id}/teams`)} className={`${btn.sm} min-h-11 border border-line hover:border-sky hover:bg-tint md:min-h-9`}>
                        <Users size={13} /> {t("admin.events.teams")}
                      </button>
                      <button onClick={() => go(`#/admin/events/new?from=${h.id}`)} className={`${btn.sm} min-h-11 border border-line hover:border-sky hover:bg-tint md:min-h-9`}>
                        <Copy size={13} /> {t("admin.events.duplicate")}
                      </button>
                      {isSuper && (
                        <button
                          onClick={() => {
                            del.setError(null);
                            setToDelete(h);
                          }}
                          className={`${btn.sm} min-h-11 border border-bad/40 text-[#ffb3b3] hover:bg-bad/10 md:min-h-9`}
                        >
                          <Trash2 size={13} /> {t("common.action.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={!!toDelete} onClose={() => !del.pending && setToDelete(null)}>
        {toDelete && (
          <div>
            <h2 className="text-[22px]">{t("admin.events.deleteTitle")}</h2>
            <p className="mt-2 text-[14px] text-mist">{t("admin.events.deleteText", { title: toDelete.title, n: counts.data?.[toDelete.id] ?? 0 })}</p>
            <div className="mt-4">
              <ErrorNote>{del.error}</ErrorNote>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={confirmDelete} disabled={del.pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-bad px-5 text-[15px] font-semibold text-white hover:bg-bad/90 disabled:opacity-60">
                {del.pending && <Spinner />} {t("admin.events.deleteSubmit")}
              </button>
              <button onClick={() => setToDelete(null)} disabled={del.pending} className={btn.ghost}>
                {t("admin.events.keep")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
