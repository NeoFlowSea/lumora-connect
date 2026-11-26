import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Application, AuditEntry, DB, Hackathon, Message, Notification, Opportunity, Swipe, TeamRegistration, User } from "./types";

/* What this visitor is allowed to see, kept in memory and fresh.
   The screens read it synchronously (getDb), exactly like they read the old browser mock.
   It is filled from Supabase when the session changes and after every action, and Supabase
   Realtime pushes changes made by other people (a new match, a message, an approval). */

/** notification as stored: text codes and variables; the API translates them on display */
export type RawNotification = Notification & {
  raw: { kind: string; t: [string, Record<string, string>]; b: [string, Record<string, string>] | null; text: string | null; link: string };
};

export type Cache = DB & {
  /** applications per posting, counted by the database (a company cannot see other companies' applicants) */
  appCounts: Record<string, number>;
  /** registered teams per event, counted by the database */
  teamCounts: Record<string, number>;
  notifications: RawNotification[];
};

const empty = (): Cache => ({
  schema: 0,
  version: 0,
  users: [],
  creds: [],
  opportunities: [],
  applications: [],
  swipes: [],
  messages: [],
  notifications: [],
  hackathons: [],
  teams: [],
  audit: [],
  tokens: [],
  outbox: [],
  appCounts: {},
  teamCounts: {},
});

let db: Cache = empty();
let session: string | null = null;
let ready = false;
let recovery = false;
let tick = 0;
const listeners = new Set<() => void>();

function emit() {
  tick++;
  listeners.forEach((l) => l());
}

export function getDb(): Cache {
  return db;
}
export function getSessionId(): string | null {
  return session;
}
/** false until the first load after the page opens; route guards wait for it */
export function isReady(): boolean {
  return ready;
}
/** true after the visitor came back from a password reset email */
export function inRecovery(): boolean {
  return recovery;
}
export function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export function getTick() {
  return tick;
}

/* ---------- loading ---------- */

type Row = Record<string, unknown> & { data: Record<string, unknown> };

function toUser(p: Row, priv: Record<string, unknown> | undefined): User {
  const kind = p.kind as User["kind"];
  const base = { ...(p.data as object), ...(priv ?? {}), id: p.id as string, kind, email: (priv?.email as string) ?? "" } as Record<string, unknown>;
  if (kind === "company") Object.assign(base, { status: p.status, statusNote: (p.data.statusNote as string) ?? "", onboarded: p.onboarded, contact: (priv?.contact as string) ?? "" });
  if (kind === "talent") Object.assign(base, { onboarded: p.onboarded, contact: (priv?.contact as string) ?? "", cv: (priv?.cv as unknown) ?? null });
  if (kind === "admin") Object.assign(base, { level: p.level });
  return base as unknown as User;
}

async function all<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select("*").limit(5000);
  if (error) {
    console.warn(`[lumora] ${table}: ${error.message}`);
    return [];
  }
  return (data ?? []) as T[];
}

let loading: Promise<void> | null = null;
let again = false;

/** Fetch everything this visitor may read. Calls made while a load runs fold into one more load. */
export function reload(): Promise<void> {
  if (loading) {
    again = true;
    return loading;
  }
  loading = (async () => {
    do {
      again = false;
      const signedIn = !!session;
      const none = Promise.resolve([] as never[]);
      const [profiles, privs, opps, apps, swipes, msgs, notes, events, teams, audit] = await Promise.all([
        all<Row>("profiles"),
        signedIn ? all<{ id: string; data: Record<string, unknown> }>("profile_private") : none,
        all<Row>("opportunities"),
        signedIn ? all<Row>("applications") : none,
        signedIn ? all<{ from_id: string; to_id: string; dir: 1 | -1; at: string }>("swipes") : none,
        signedIn ? all<{ id: string; match_id: string; from_id: string; body: string; at: string }>("messages") : none,
        signedIn ? all<{ id: string; user_id: string; read: boolean; at: string; data: RawNotification["raw"] }>("notifications") : none,
        all<Row>("hackathons"),
        signedIn ? all<Row>("teams") : none,
        signedIn ? all<Row>("audit") : none,
      ]);
      const privById = new Map(privs.map((x) => [x.id, x.data]));
      const next = empty();
      next.users = profiles.map((p) => toUser(p, privById.get(p.id as string)));
      next.opportunities = opps.map((o) => ({ ...(o.data as object), id: o.id, companyId: o.company_id, hidden: o.hidden }) as Opportunity);
      next.appCounts = Object.fromEntries(opps.map((o) => [o.id as string, o.app_count as number]));
      next.applications = apps.map((a) => a.data as unknown as Application);
      next.swipes = swipes.map((s) => ({ fromId: s.from_id, toId: s.to_id, dir: s.dir, at: s.at }) as Swipe);
      next.messages = msgs
        .map((m) => ({ id: m.id, matchId: m.match_id, fromId: m.from_id, text: m.body, at: m.at }) as Message)
        .sort((a, b) => a.at.localeCompare(b.at));
      next.notifications = notes
        .map((n) => ({ id: n.id, userId: n.user_id, read: n.read, at: n.at, kind: n.data.kind, title: "", body: "", link: n.data.link, raw: n.data }) as RawNotification)
        .sort((a, b) => b.at.localeCompare(a.at));
      next.hackathons = events.map((h) => ({ ...(h.data as object), id: h.id, status: h.status }) as Hackathon);
      next.teamCounts = Object.fromEntries(events.map((h) => [h.id as string, h.team_count as number]));
      next.teams = teams.map((x) => x.data as unknown as TeamRegistration);
      next.audit = audit.map((x) => x.data as unknown as AuditEntry).sort((a, b) => b.at.localeCompare(a.at));
      next.version = db.version + 1;
      db = next;
    } while (again);
    ready = true;
    emit();
  })().finally(() => {
    loading = null;
  });
  return loading;
}

/* ---------- live updates ---------- */

let channel: RealtimeChannel | null = null;
let timer: number | undefined;

function listen() {
  if (channel) void supabase.removeChannel(channel);
  const soon = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void reload(), 250);
  };
  channel = supabase.channel(`lumora-live-${session ?? "guest"}`);
  for (const table of ["profiles", "profile_private", "opportunities", "applications", "swipes", "messages", "notifications", "hackathons", "teams", "audit"]) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, soon);
  }
  channel.subscribe();
}

/* ---------- session ---------- */

supabase.auth.onAuthStateChange((event, s) => {
  if (event === "PASSWORD_RECOVERY") recovery = true;
  const id = s?.user.id ?? null;
  const changed = id !== session;
  session = id;
  if (event === "INITIAL_SESSION" || changed) {
    // auth callbacks must not await other Supabase calls directly, so the load runs right after
    window.setTimeout(() => {
      void reload();
      listen();
    }, 0);
  }
  if (event === "PASSWORD_RECOVERY") window.location.hash = "#/reset?token=recovery";
});
