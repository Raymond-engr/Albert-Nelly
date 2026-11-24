import { call } from "./http";
import { dbStore, refreshDb } from "./store";
import type { Deal, DealStage, Payment } from "./types";

export type NewDealInput = {
  title: string;
  client: string;
  service: string;
  agreed: number;
  leadId?: string | null;
  referrerId?: string | null;
};

export type DealPatch = Partial<
  Pick<Deal, "title" | "client" | "service" | "agreed" | "referrerId" | "commissionRate" | "notes">
> & { updatedAt?: string };

export type PaymentInput = Pick<Payment, "dealId" | "direction" | "amount" | "category" | "note"> & {
  date: string;
};

export const dealsApi = {
  async create(input: NewDealInput, _log = true): Promise<Deal> {
    void _log;
    const deal = await call<Deal>("POST", "/api/control-room/deals", input);
    await refreshDb();
    return deal;
  },
  async update(id: string, patch: DealPatch): Promise<void> {
    await call("PATCH", `/api/control-room/deals/${id}`, patch);
    await refreshDb();
  },
  async move(id: string, stage: DealStage): Promise<void> {
    // Optimistic update in client dbStore so the card immediately snaps to the new column without rubber-banding
    dbStore.set((prev) => ({
      ...prev,
      deals: prev.deals.map((d) => (d.id === id ? { ...d, stage } : d)),
    }));

    try {
      await call("POST", `/api/control-room/deals/${id}/stage`, { stage });
      await refreshDb();
    } catch (err) {
      // Revert snapshot if the server rejected the move
      await refreshDb();
      throw err;
    }
  },
};

export const paymentsApi = {
  /** Payments are append-only. Only owner and finance may record payments. */
  async record(input: PaymentInput): Promise<Payment> {
    if (!input.dealId) throw new Error("dealId is required to record a payment.");
    const payment = await call<Payment>("POST", `/api/control-room/deals/${input.dealId}/payments`, input);
    await refreshDb();
    return payment;
  },
};
