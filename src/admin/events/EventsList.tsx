import { useMemo, useState } from "react";
import { CalendarPlus, Copy, Globe, MapPin, Pencil, Trash2, Trophy, Users } from "lucide-react";
import { api, statusLabel } from "../../api";
import { useAction, useApi, useSession } from "../../api/hooks";
import type { Hackathon } from "../../api/types";
import { Empty, ErrorNote, Skeleton, Spinner, when } from "../../components/form";
import { Modal, Pill, btn, useToast } from "../../components/ui";
import { go } from "../../lib/router";
import { statusTone, typeLabel } from "./shared";

type Filter = "all" | "drafts" | "open" | "upcoming" | "finished" | "cancelled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drafts", label: "Drafts" },
  { key: "open", label: "Registration open" },
  { key: "upcoming", label: "Upcoming" },
  { key: "finished", label: "Finished" },
  { key: "cancelled", label: "Cancelled" },
];

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

  const nowLocal = new Date().toISOString().slice(0, 16);
  const list = useMemo(() => {
    const all = events.data ?? [];
    // newest first for finished ones, soonest first for the rest
    return all.filter((h) => matches(h, filter, nowLocal)).sort((a, b) => (filter === "finished" ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start)));
  }, [events.data, filter, nowLocal]);

  const countFor = (f: Filter) => (events.data ?? []).filter((h) => matches(h, f, nowLocal)).length;

  async function confirmDelete() {
    if (!toDelete) return;
    if (await del.run(toDelete.id)) {
      toast(`Deleted ${toDelete.title}`);
      setToDelete(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(24px,3vw,32px)]">Events</h1>
          <p className="mt-1 text-[13px] text-mist">Hackathons, case competitions, meetups and workshops. Drafts are visible only to admins.</p>
        </div>
        <button onClick={() => go("#/admin/events/new")} className={btn.primary}>
          <CalendarPlus size={16} /> Create event
        </button>
      </div>

      <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              filter === f.key ? "border-accent bg-accent text-paper" : "border-line text-mist hover:border-sky hover:text-ink"
            }`}
          >
            {f.label}
            {events.data && <span className="ml-1.5 opacity-70">{countFor(f.key)}</span>}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {events.error && <ErrorNote>{events.error}</ErrorNote>}
        {events.loading && !events.data ? (
          <Skeleton rows={4} className="h-28" />
        ) : list.length === 0 ? (
          <Empty
            icon={<CalendarPlus size={20} />}
            title={filter === "all" ? "No events yet" : "Nothing in this group"}
            text={filter === "all" ? "Create the first event. It starts as a draft, so nobody sees it until you publish." : "Try another filter, or create a new event."}
            action={
              <button onClick={() => go("#/admin/events/new")} className={btn.primary}>
                Create event
              </button>
            }
          />
        ) : (
          <ul className="grid gap-3">
            {list.map((h) => {
              const teams = counts.data?.[h.id] ?? 0;
              return (
                <li key={h.id} className="rounded-3xl border border-line bg-surface p-4 md:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={statusTone(h.status)}>{statusLabel(h.status)}</Pill>
                        <span className="text-[12px] text-mist">{typeLabel(h.eventType)}</span>
                        <span className="text-[12px] text-mist">by {h.organizerName}</span>
                      </div>
                      <h2 className="mt-2 break-words text-[17px] md:text-[19px]">{h.title}</h2>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-mist">
                        <span>{when(h.start)}</span>
                        <span className="flex items-center gap-1">
                          {h.mode === "online" ? <Globe size={12} /> : <MapPin size={12} />}
                          {h.mode === "online" ? "Online" : h.city}
                          {h.mode === "hybrid" ? ", hybrid" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {teams}
                          {h.maxTeams ? ` / ${h.maxTeams}` : ""} teams
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy size={12} /> {h.places.length} places
                          {h.results.length ? `, ${h.results.length} results` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => go(`#/admin/events/${h.id}`)} className={`${btn.sm} border border-line hover:border-sky hover:bg-tint`}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button onClick={() => go(`#/admin/events/${h.id}/teams`)} className={`${btn.sm} border border-line hover:border-sky hover:bg-tint`}>
                        <Users size={13} /> Teams & results
                      </button>
                      <button onClick={() => go(`#/admin/events/new?from=${h.id}`)} className={`${btn.sm} border border-line hover:border-sky hover:bg-tint`}>
                        <Copy size={13} /> Duplicate
                      </button>
                      {isSuper && (
                        <button
                          onClick={() => {
                            del.setError(null);
                            setToDelete(h);
                          }}
                          className={`${btn.sm} border border-bad/40 text-[#ffb3b3] hover:bg-bad/10`}
                        >
                          <Trash2 size={13} /> Delete
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
            <h2 className="text-[22px]">Delete this event?</h2>
            <p className="mt-2 text-[14px] text-mist">
              {toDelete.title} and its {counts.data?.[toDelete.id] ?? 0} registered teams will be removed for everyone. Badges already awarded stay on profiles. This cannot be undone.
            </p>
            <div className="mt-4">
              <ErrorNote>{del.error}</ErrorNote>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={confirmDelete} disabled={del.pending} className={`${btn.sm} bg-bad px-5 py-2.5 text-[14px] text-white hover:bg-bad/85 disabled:opacity-60`}>
                {del.pending && <Spinner />} Delete event
              </button>
              <button onClick={() => setToDelete(null)} disabled={del.pending} className={btn.ghost}>
                Keep it
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
