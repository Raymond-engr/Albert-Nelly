import { dbStore, sessionStore } from "./store";
import { toast } from "./toast";
import type { Activity, Role, Staff } from "./types";

/**
 * THE SEAM BETWEEN THE SCREENS AND THE BACKEND.
 * Screens never touch the store directly for writing: they call functions from this file.
 * TODO(integration): replace each function body with a fetch to a Route Handler or a Server Action, keep the
 * signatures, and keep returning Promises. See docs/CONTROL_ROOM_HANDOVER.md for the matching endpoints.
 */
let seq = 0;
export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;

/** TODO(integration): the server writes activity rows itself (inside the same transaction as the change). */
export function logActivity(action: string, target = "") {
  const actorId = sessionStore.get().staffId ?? "unknown";
  const entry: Activity = { id: uid("act"), at: new Date().toISOString(), actorId, action, target };
  dbStore.set((db) => ({ ...db, activity: [entry, ...db.activity].slice(0, 200) }));
}

export const auth = {
  /**
   * Prototype: any email, any password, any 6-digit code. The chosen role picks a demo staff member.
   * TODO(integration): supabase.auth.signInWithPassword(), then supabase.auth.mfa.challengeAndVerify() with the
   * 6-digit code. After that, load the matching row of the `staff` table to get the role.
   */
  async signIn(role: Role): Promise<Staff | null> {
    const staff = dbStore.get().staff.find((s) => s.role === role && s.status === "active") ?? null;
    if (!staff) return null;
    sessionStore.set(() => ({ staffId: staff.id }));
    logActivity("Signed in");
    return staff;
  },
  /** Prototype only: preview the Control Room as another role. Remove when real auth lands. */
  async switchRole(role: Role): Promise<void> {
    const staff = dbStore.get().staff.find((s) => s.role === role && s.status === "active");
    if (staff) sessionStore.set(() => ({ staffId: staff.id }));
  },
  /** TODO(integration): supabase.auth.signOut() */
  async signOut(): Promise<void> {
    sessionStore.set(() => ({ staffId: null }));
  },
};

export const demo = {
  /** Prototype only: restores the invented data. */
  reset() {
    dbStore.reset();
    toast("Demo data restored.");
  },
};
