import { useSyncExternalStore } from "react";
import type { Db, Staff } from "./types";
import { useStaff } from "@/components/control-room/shell/StaffProvider";

export const initialDb: Db = {
  staff: [],
  leads: [],
  deals: [],
  payments: [],
  campaigns: [],
  services: [],
  packages: [],
  runningCosts: [],
  work: [],
  partners: [],
  referrers: [],
  templates: [],
  settings: {
    whatsappNumber: "",
    birthdayDiscount: 10,
    commissionMin: 5,
    commissionMax: 10,
  },
  activity: [],
};

/**
 * The Control Room client cache: kept in memory and synchronized with localStorage.
 * Hydrated from the backend snapshot via refreshDb().
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
      /* storage blocked or corrupted: keep initial */
    }
  };
  const save = () => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage full or blocked: keep working in memory */
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

export const dbStore = createStore<Db>("an-control-room-db-v1", () => initialDb);
export const sessionStore = createStore<{ staffId: string | null }>("an-control-room-session-v1", () => ({ staffId: null }));

export type DbStatus = "loading" | "ready" | "error";

type StatusState = {
  status: DbStatus;
  error: string | null;
};

let statusState: StatusState = { status: "loading", error: null };
const statusListeners = new Set<() => void>();
const emitStatus = () => statusListeners.forEach((l) => l());

export function useDbStatus(): StatusState {
  return useSyncExternalStore(
    (listener) => {
      statusListeners.add(listener);
      return () => {
        statusListeners.delete(listener);
      };
    },
    () => statusState,
    () => ({ status: "loading", error: null })
  );
}

export async function refreshDb(): Promise<void> {
  statusState = { status: "loading", error: null };
  emitStatus();
  try {
    const res = await fetch("/api/control-room/snapshot", { cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!json.ok || !json.data) {
      throw new Error(json.error || "Failed to load snapshot data.");
    }
    dbStore.set(() => json.data);
    statusState = { status: "ready", error: null };
    emitStatus();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load snapshot";
    statusState = { status: "error", error: msg };
    emitStatus();
  }
}

export function useDbRefresh(): () => Promise<void> {
  return refreshDb;
}

export const useDb = (): Db => useSyncExternalStore(dbStore.subscribe, dbStore.get, dbStore.getServer);

/** The signed-in staff member, or null. Reads from StaffProvider when available. */
export function useSession(): Staff | null {
  const staff = useStaff();
  const s = useSyncExternalStore(sessionStore.subscribe, sessionStore.get, sessionStore.getServer);
  const db = useDb();
  return staff ?? db.staff.find((x) => x.id === s.staffId) ?? null;
}

const noop = () => () => {};
/** False on the server and during hydration, true afterwards. Screens wait for it because the data lives in the browser. */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);
