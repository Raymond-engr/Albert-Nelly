import { logActivity, uid } from "./api";
import { dbStore } from "./store";
import type { PackageTier, Partner, Referrer, RunningCost, ServiceItem, WorkItem } from "./types";

/**
 * Writes for the content the public site shows, and for referrers.
 * TODO(integration): each function becomes one server call. After every successful write the server must also
 * refresh the public pages (revalidateTag / revalidatePath), see the handover, "Public site reads the database".
 *   servicesApi.update  -> PATCH  /api/control-room/services/:id
 *   packagesApi.update  -> PATCH  /api/control-room/packages/:id
 *   costsApi.save       -> PUT    /api/control-room/running-costs
 *   workApi.*           -> POST / PATCH / DELETE /api/control-room/work(/:id)
 *   partnersApi.*       -> POST / PATCH / DELETE /api/control-room/partners(/:id)
 *   referrersApi.*      -> POST / PATCH          /api/control-room/referrers(/:id)
 */
const swap = <T extends { id: string }, P extends Partial<T>>(rows: T[], id: string, patch: P): T[] => rows.map((r) => (r.id === id ? { ...r, ...patch } : r));

export type ServicePatch = Partial<Omit<ServiceItem, "id" | "scene">>;
export const servicesApi = {
  async update(id: string, patch: ServicePatch): Promise<void> {
    const before = dbStore.get().services.find((s) => s.id === id);
    dbStore.set((db) => ({ ...db, services: swap(db.services, id, patch) }));
    const priceChanged = patch.price && JSON.stringify(patch.price) !== JSON.stringify(before?.price);
    logActivity(priceChanged ? "Changed the price display" : "Edited a service", patch.title ?? before?.title ?? "");
  },
};

export const packagesApi = {
  /** Only one package can be highlighted: setting `featured` clears it on the others. */
  async update(id: string, patch: Partial<Omit<PackageTier, "id">>): Promise<void> {
    dbStore.set((db) => ({
      ...db,
      packages: db.packages.map((p) => (p.id === id ? { ...p, ...patch } : patch.featured ? { ...p, featured: false } : p)),
    }));
    logActivity("Edited a school package", patch.name ?? dbStore.get().packages.find((p) => p.id === id)?.name ?? "");
  },
};

export const costsApi = {
  async save(rows: RunningCost[]): Promise<void> {
    dbStore.set((db) => ({ ...db, runningCosts: rows }));
    logActivity("Updated the yearly running costs");
  },
};

export type WorkInput = Omit<WorkItem, "id">;
export const workApi = {
  async create(input: WorkInput): Promise<void> {
    dbStore.set((db) => ({ ...db, work: [...db.work, { ...input, id: uid("work") }] }));
    logActivity("Added a project to Selected work", input.title);
  },
  async update(id: string, patch: Partial<WorkInput>): Promise<void> {
    dbStore.set((db) => ({ ...db, work: swap(db.work, id, patch) }));
    logActivity("Edited a project", patch.title ?? "");
  },
  async remove(id: string): Promise<void> {
    const w = dbStore.get().work.find((x) => x.id === id);
    dbStore.set((db) => ({ ...db, work: db.work.filter((x) => x.id !== id) }));
    logActivity("Removed a project", w?.title ?? "");
  },
};

export type PartnerInput = Omit<Partner, "id">;
export const partnersApi = {
  async create(input: PartnerInput): Promise<void> {
    dbStore.set((db) => ({ ...db, partners: [...db.partners, { ...input, id: uid("par") }] }));
    logActivity("Added a partner", input.name);
  },
  async update(id: string, patch: Partial<PartnerInput>): Promise<void> {
    dbStore.set((db) => ({ ...db, partners: swap(db.partners, id, patch) }));
    logActivity("Edited a partner", patch.name ?? dbStore.get().partners.find((p) => p.id === id)?.name ?? "");
  },
  async remove(id: string): Promise<void> {
    const p = dbStore.get().partners.find((x) => x.id === id);
    dbStore.set((db) => ({ ...db, partners: db.partners.filter((x) => x.id !== id) }));
    logActivity("Removed a partner", p?.name ?? "");
  },
};

export type ReferrerInput = Pick<Referrer, "name" | "email" | "whatsapp" | "rate" | "status">;
export const referrersApi = {
  async create(input: ReferrerInput): Promise<void> {
    dbStore.set((db) => ({ ...db, referrers: [...db.referrers, { ...input, id: uid("ref"), joinedAt: new Date().toISOString() }] }));
    logActivity("Added a referrer", input.name);
  },
  async update(id: string, patch: Partial<ReferrerInput>): Promise<void> {
    dbStore.set((db) => ({ ...db, referrers: swap(db.referrers, id, patch) }));
    logActivity("Edited a referrer", patch.name ?? dbStore.get().referrers.find((r) => r.id === id)?.name ?? "");
  },
};
