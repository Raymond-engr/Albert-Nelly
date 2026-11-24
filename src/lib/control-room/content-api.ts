import { call } from "./http";
import { refreshDb } from "./store";
import type { PackageTier, Partner, Referrer, RunningCost, ServiceItem, WorkItem } from "./types";

export type ServicePatch = Partial<Omit<ServiceItem, "id" | "scene">>;
export const servicesApi = {
  async update(id: string, patch: ServicePatch): Promise<void> {
    await call("PATCH", `/api/control-room/services/${id}`, patch);
    await refreshDb();
  },
};

export const packagesApi = {
  async update(id: string, patch: Partial<Omit<PackageTier, "id">>): Promise<void> {
    await call("PATCH", `/api/control-room/packages/${id}`, patch);
    await refreshDb();
  },
};

export const costsApi = {
  async save(rows: RunningCost[]): Promise<void> {
    await call("PUT", "/api/control-room/running-costs", rows);
    await refreshDb();
  },
};

export type WorkInput = Omit<WorkItem, "id">;
export const workApi = {
  async create(input: WorkInput): Promise<void> {
    await call("POST", "/api/control-room/work", input);
    await refreshDb();
  },
  async update(id: string, patch: Partial<WorkInput>): Promise<void> {
    await call("PATCH", `/api/control-room/work/${id}`, patch);
    await refreshDb();
  },
  async remove(id: string): Promise<void> {
    await call("DELETE", `/api/control-room/work/${id}`);
    await refreshDb();
  },
};

export type PartnerInput = Omit<Partner, "id">;
export const partnersApi = {
  async create(input: PartnerInput): Promise<void> {
    await call("POST", "/api/control-room/partners", input);
    await refreshDb();
  },
  async update(id: string, patch: Partial<PartnerInput>): Promise<void> {
    await call("PATCH", `/api/control-room/partners/${id}`, patch);
    await refreshDb();
  },
  async remove(id: string): Promise<void> {
    await call("DELETE", `/api/control-room/partners/${id}`);
    await refreshDb();
  },
};

export type ReferrerInput = Pick<Referrer, "name" | "email" | "whatsapp" | "rate" | "status">;
export const referrersApi = {
  async create(input: ReferrerInput): Promise<void> {
    await call("POST", "/api/control-room/referrers", input);
    await refreshDb();
  },
  async update(id: string, patch: Partial<ReferrerInput>): Promise<void> {
    await call("PATCH", `/api/control-room/referrers/${id}`, patch);
    await refreshDb();
  },
};
