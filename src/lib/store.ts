import { useSyncExternalStore } from "react";

export type Role = "talent" | "company";

export type State = {
  role: Role | null;
  liked: string[]; // ids swiped right
  passed: string[]; // ids swiped left
  applied: string[]; // opportunity ids
  registered: string[]; // hackathon ids
};

const KEY = "lumora-connect-v2";
const initial: State = { role: null, liked: [], passed: [], applied: [], registered: [] };

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return initial;
}

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export const actions = {
  setRole: (role: Role | null) => set({ role }),
  like: (id: string) => set({ liked: add(state.liked, id) }),
  pass: (id: string) => set({ passed: add(state.passed, id) }),
  resetDeck: () => set({ liked: [], passed: [] }),
  apply: (id: string) => set({ applied: add(state.applied, id) }),
  register: (id: string) => set({ registered: add(state.registered, id) }),
  signOut: () => set({ ...initial }),
};
