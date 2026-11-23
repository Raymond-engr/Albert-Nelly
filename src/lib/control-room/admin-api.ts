import { call } from "./http";
import { refreshDb } from "./store";
import type { Role, Settings } from "./types";

export const teamApi = {
  async invite(input: { name: string; email: string; role: Role }): Promise<void> {
    await call("POST", "/api/control-room/team", input);
    await refreshDb();
  },
  async setRole(id: string, role: Role): Promise<boolean> {
    try {
      await call("PATCH", `/api/control-room/team/${id}`, { role });
      await refreshDb();
      return true;
    } catch {
      return false;
    }
  },
  async remove(id: string): Promise<boolean> {
    try {
      await call("DELETE", `/api/control-room/team/${id}`);
      await refreshDb();
      return true;
    } catch {
      return false;
    }
  },
  async offboard(id: string): Promise<boolean> {
    try {
      await call("PATCH", `/api/control-room/team/${id}/offboard`);
      await refreshDb();
      return true;
    } catch {
      return false;
    }
  },
};

export const settingsApi = {
  async save(patch: Partial<Settings>): Promise<void> {
    await call("PATCH", "/api/control-room/settings", patch);
    await refreshDb();
  },
};

export const templatesApi = {
  async update(id: string, body: string): Promise<void> {
    await call("PATCH", `/api/control-room/templates/${id}`, { body });
    await refreshDb();
  },
};
