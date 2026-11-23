import { call } from "./http";
import { refreshDb } from "./store";
import type { Deal, Lead } from "./types";
import type { NewDealInput } from "./deals-api";

export type LeadPatch = Partial<Pick<Lead, "status" | "notes" | "tags" | "ownerId">> & { updatedAt?: string };

export const leadsApi = {
  async update(id: string, patch: LeadPatch): Promise<void> {
    await call("PATCH", `/api/control-room/leads/${id}`, patch);
    await refreshDb();
  },
  async convertToDeal(leadId: string, input: Omit<NewDealInput, "leadId">): Promise<Deal> {
    const deal = await call<Deal>("POST", `/api/control-room/leads/${leadId}/convert`, input);
    await refreshDb();
    return deal;
  },
};
