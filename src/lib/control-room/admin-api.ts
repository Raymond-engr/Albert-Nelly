import { logActivity, uid } from "./api";
import { dbStore } from "./store";
import type { Role, Settings, Staff } from "./types";

/**
 * Writes for the team, the settings and the message templates (Owner only).
 * TODO(integration):
 *   teamApi.invite  -> POST /api/control-room/team/invite  (supabase.auth.admin.inviteUserByEmail + a row in `staff`)
 *   teamApi.setRole -> PATCH /api/control-room/team/:id    (updates `staff.role`; the server refuses to demote the last Owner)
 *   teamApi.remove  -> DELETE /api/control-room/team/:id   (deletes the staff row and bans the auth user)
 *   settingsApi     -> PUT /api/control-room/settings;  templatesApi -> PATCH /api/control-room/templates/:id
 */
const owners = (staff: Staff[]) => staff.filter((s) => s.role === "owner" && s.status === "active");

export const teamApi = {
  async invite(input: { name: string; email: string; role: Role }): Promise<void> {
    const s: Staff = { id: uid("staff"), name: input.name, email: input.email.toLowerCase(), role: input.role, status: "invited", lastSeen: null };
    dbStore.set((db) => ({ ...db, staff: [...db.staff, s] }));
    logActivity("Invited a team member", s.email);
  },
  /** Returns false (and changes nothing) if it would leave the team without an active Owner. */
  async setRole(id: string, role: Role): Promise<boolean> {
    const db = dbStore.get();
    const who = db.staff.find((s) => s.id === id);
    if (!who) return false;
    if (who.role === "owner" && role !== "owner" && owners(db.staff).length <= 1) return false;
    dbStore.set((d) => ({ ...d, staff: d.staff.map((s) => (s.id === id ? { ...s, role } : s)) }));
    logActivity(`Changed a role to ${role}`, who.name);
    return true;
  },
  async remove(id: string): Promise<boolean> {
    const db = dbStore.get();
    const who = db.staff.find((s) => s.id === id);
    if (!who || (who.role === "owner" && who.status === "active" && owners(db.staff).length <= 1)) return false;
    dbStore.set((d) => ({ ...d, staff: d.staff.filter((s) => s.id !== id) }));
    logActivity("Removed a team member", who.name);
    return true;
  },
};

export const settingsApi = {
  async save(patch: Partial<Settings>): Promise<void> {
    dbStore.set((db) => ({ ...db, settings: { ...db.settings, ...patch } }));
    logActivity("Changed the settings");
  },
};

export const templatesApi = {
  async update(id: string, body: string): Promise<void> {
    dbStore.set((db) => ({ ...db, templates: db.templates.map((t) => (t.id === id ? { ...t, body } : t)) }));
    logActivity("Edited a message template", dbStore.get().templates.find((t) => t.id === id)?.label ?? "");
  },
};
