import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getTick, isReady, subscribe } from "./db";
import { currentUser, unreadCount } from "./index";
import type { User } from "./types";

/** Re-render whenever the data in memory or the session changes. */
export function useDbTick(): number {
  return useSyncExternalStore(subscribe, getTick);
}

/** false until the first load from the database after the page opens */
export function useReady(): boolean {
  useDbTick();
  return isReady();
}

export function useSession(): User | null {
  useDbTick();
  return currentUser();
}

export function useUnread(): number {
  useDbTick();
  const u = currentUser();
  return u ? unreadCount(u.id) : 0;
}

export type Query<T> = { data: T | undefined; loading: boolean; error: string | null; reload: () => void };

/**
 * Run an async API call and keep it fresh: it re-runs when deps change and
 * whenever the DB changes. The first load shows loading; later refreshes keep
 * the old data on screen so nothing flickers.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []): Query<T> {
  const tick = useDbTick();
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: string | null }>({
    data: undefined,
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: s.data === undefined, error: null }));
    fnRef
      .current()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((e: unknown) => alive && setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : String(e) })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, nonce, ...deps]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

/** Wrap an async action with a pending flag and an error message. */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      setPending(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return { run, pending, error, setError };
}
