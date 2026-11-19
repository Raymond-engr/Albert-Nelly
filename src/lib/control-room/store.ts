import { useSyncExternalStore } from "react";
import { seedDb } from "./demo";
import type { Db, Staff } from "./types";

/**
 * The prototype's "database": one object kept in memory and in localStorage.
 * TODO(integration): delete this file. Replace useDb() with real data loading (server components or a client
 * cache such as SWR / React Query) and replace the functions in api.ts with fetch calls or Server Actions.
 */
type Store<T> = {
  get: () => T;
  getServer: () => T;
  set: (fn: (s: T) => T) => void;
  reset: () => void;
  subscribe: (l: () => void) => () => void;
};

function createStore<T>(key: string, init: () => T): Store<T> {
  const serverState = init();
  let state = serverState;
  let loaded = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = JSON.parse(raw) as T;
    } catch {
      /* storage blocked or corrupted: keep the seed */
    }
  };
  const save = () => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage full or blocked: the prototype keeps working in memory */
    }
  };
  return {
    get: () => {
      load();
      return state;
    },
    getServer: () => serverState,
    set: (fn) => {
      load();
      state = fn(state);
      save();
      emit();
    },
    reset: () => {
      state = init();
      loaded = true;
      save();
      emit();
    },
    subscribe: (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

export const dbStore = createStore<Db>("an-control-room-db-v1", seedDb);
export const sessionStore = createStore<{ staffId: string | null }>("an-control-room-session-v1", () => ({ staffId: null }));

export const useDb = (): Db => useSyncExternalStore(dbStore.subscribe, dbStore.get, dbStore.getServer);

/** The signed-in staff member, or null. */
export function useSession(): Staff | null {
  const s = useSyncExternalStore(sessionStore.subscribe, sessionStore.get, sessionStore.getServer);
  const db = useDb();
  return db.staff.find((x) => x.id === s.staffId) ?? null;
}

const noop = () => () => {};
/** False on the server and during hydration, true afterwards. Screens wait for it because the data lives in the browser. */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);
