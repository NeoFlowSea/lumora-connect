import { SCHEMA, seed } from "./seed";
import type { DB } from "./types";

/* Client-side "database" for the static preview. Lives in memory, persists to
   localStorage, and notifies subscribers on every write. Each visitor has their
   own copy; nothing is shared between browsers. */

const KEY = "lumora-db";
const SESSION_KEY = "lumora-session";

let db: DB = load();
let session: string | null = readSession();
let tick = 0;
const listeners = new Set<() => void>();

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.schema === SCHEMA) return parsed;
    }
  } catch {
    /* fall through to a fresh seed */
  }
  return seed();
}

function readSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
    if (session) localStorage.setItem(SESSION_KEY, session);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

function emit() {
  tick++;
  listeners.forEach((l) => l());
}

export function getDb(): DB {
  return db;
}

/** Apply a change and notify every subscriber. */
export function mutate(fn: (d: DB) => void) {
  fn(db);
  db = { ...db, version: db.version + 1 };
  persist();
  emit();
}

export function getSessionId(): string | null {
  return session;
}

export function setSessionId(id: string | null) {
  session = id;
  persist();
  emit();
}

export function resetDb() {
  db = seed();
  persist();
  emit();
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

// keep tabs in sync when the same browser has the site open twice
window.addEventListener("storage", (e) => {
  if (e.key === KEY || e.key === SESSION_KEY) {
    db = load();
    session = readSession();
    emit();
  }
});
