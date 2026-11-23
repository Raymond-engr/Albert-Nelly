import { createClient } from "@/lib/supabase/client";
import { dbStore, sessionStore } from "./store";
import { toast } from "./toast";
import type { Activity, Role, Staff } from "./types";

let seq = 0;
export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;

export function logActivity(action: string, target = "") {
  const actorId = sessionStore.get().staffId ?? "unknown";
  const entry: Activity = { id: uid("act"), at: new Date().toISOString(), actorId, action, target };
  dbStore.set((db) => ({ ...db, activity: [entry, ...db.activity].slice(0, 200) }));
}

export const auth = {
  /**
   * Signs in via Supabase Auth in the browser or falls back to demo mode if unconfigured.
   */
  async signIn(emailOrRole: string, password?: string): Promise<Staff | null> {
    try {
      if (password) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrRole,
          password,
        });
        if (error || !data.user) {
          throw error || new Error("Sign in failed");
        }
        const { data: staff } = await supabase
          .from("staff")
          .select("id,name,email,role,status")
          .eq("id", data.user.id)
          .single();

        if (staff) {
          sessionStore.set(() => ({ staffId: staff.id }));
          return staff as Staff;
        }
      }
    } catch (e) {
      console.warn("[auth.signIn]", e);
    }

    // Demo fallback: by role or email matching demo db
    const role = emailOrRole as Role;
    const staff =
      dbStore.get().staff.find((s) => (s.role === role || s.email === emailOrRole) && s.status === "active") ?? null;
    if (!staff) return null;
    sessionStore.set(() => ({ staffId: staff.id }));
    logActivity("Signed in");
    return staff;
  },

  /** Prototype only: preview the Control Room as another role. */
  async switchRole(role: Role): Promise<void> {
    const staff = dbStore.get().staff.find((s) => s.role === role && s.status === "active");
    if (staff) sessionStore.set(() => ({ staffId: staff.id }));
  },

  async signOut(): Promise<void> {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignored if unconfigured
    }
    sessionStore.set(() => ({ staffId: null }));
  },
};

export const demo = {
  reset() {
    dbStore.reset();
    toast("Demo data restored.");
  },
};
