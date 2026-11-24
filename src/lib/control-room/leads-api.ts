import { logActivity } from "./api";
import { dealsApi, type NewDealInput } from "./deals-api";
import { dbStore } from "./store";
import type { Deal, Lead } from "./types";

/**
 * Writes for leads.
 * TODO(integration):
 *   update        -> PATCH /api/control-room/leads/:id
 *   convertToDeal -> POST  /api/control-room/leads/:id/deal   (one transaction: insert the deal, set lead.status = 'deal')
 */
export type LeadPatch = Partial<Pick<Lead, "status" | "notes" | "tags" | "ownerId">>;

export const leadsApi = {
  async update(id: string, patch: LeadPatch): Promise<void> {
    dbStore.set((db) => ({ ...db, leads: db.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
    const lead = dbStore.get().leads.find((l) => l.id === id);
    logActivity(patch.status === "archived" ? "Archived a lead" : "Edited a lead", lead?.name ?? "");
  },
  async convertToDeal(leadId: string, input: Omit<NewDealInput, "leadId">): Promise<Deal> {
    const deal = await dealsApi.create({ ...input, leadId }, false);
    dbStore.set((db) => ({ ...db, leads: db.leads.map((l) => (l.id === leadId ? { ...l, status: "deal", dealId: deal.id } : l)) }));
    logActivity("Turned a lead into a deal", input.client);
    return deal;
  },
};
