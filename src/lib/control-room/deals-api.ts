import { logActivity, uid } from "./api";
import { DEAL_STAGE_LABEL, type Deal, type DealStage, type Payment } from "./types";
import { dbStore, sessionStore } from "./store";

/**
 * Writes for deals and payments.
 * TODO(integration): each function becomes one server call, for example
 *   create  -> POST  /api/control-room/deals
 *   update  -> PATCH /api/control-room/deals/:id
 *   move    -> POST  /api/control-room/deals/:id/stage      (writes the activity row in the same transaction)
 *   record  -> POST  /api/control-room/deals/:id/payments   (owner and finance only, append-only)
 */
export type NewDealInput = { title: string; client: string; service: string; agreed: number; leadId?: string | null; referrerId?: string | null };
export type DealPatch = Partial<Pick<Deal, "title" | "client" | "service" | "agreed" | "referrerId" | "commissionRate" | "notes">>;
export type PaymentInput = Pick<Payment, "dealId" | "direction" | "amount" | "category" | "note"> & { date: string };

const now = () => new Date().toISOString();

export const dealsApi = {
  async create(input: NewDealInput, log = true): Promise<Deal> {
    const deal: Deal = {
      id: uid("deal"), title: input.title, client: input.client, service: input.service, leadId: input.leadId ?? null, stage: "new",
      agreed: input.agreed, referrerId: input.referrerId ?? null, commissionRate: null,
      ownerId: sessionStore.get().staffId ?? "staff_owner", createdAt: now(), updatedAt: now(), notes: "",
    };
    dbStore.set((db) => ({ ...db, deals: [deal, ...db.deals] }));
    if (log) logActivity("Created a deal", deal.title);
    return deal;
  },
  async update(id: string, patch: DealPatch): Promise<void> {
    dbStore.set((db) => ({ ...db, deals: db.deals.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: now() } : d)) }));
    const d = dbStore.get().deals.find((x) => x.id === id);
    logActivity("Edited a deal", d?.title ?? "");
  },
  async move(id: string, stage: DealStage): Promise<void> {
    dbStore.set((db) => ({ ...db, deals: db.deals.map((d) => (d.id === id ? { ...d, stage, updatedAt: now() } : d)) }));
    const d = dbStore.get().deals.find((x) => x.id === id);
    logActivity(`Moved a deal to ${DEAL_STAGE_LABEL[stage]}`, d?.title ?? "");
  },
};

export const paymentsApi = {
  /** Payments are never edited or deleted. A mistake is fixed by recording a correcting payment. */
  async record(input: PaymentInput): Promise<Payment> {
    const payment: Payment = {
      id: uid("pay"), dealId: input.dealId, direction: input.direction, amount: input.amount, category: input.category, note: input.note,
      date: new Date(`${input.date}T12:00:00`).toISOString(), recordedBy: sessionStore.get().staffId ?? "unknown",
    };
    dbStore.set((db) => ({ ...db, payments: [payment, ...db.payments] }));
    const deal = dbStore.get().deals.find((d) => d.id === input.dealId);
    const amount = new Intl.NumberFormat("en-NG").format(input.amount);
    logActivity(`Recorded a ${input.direction === "in" ? "payment in" : "payment out"} of ₦${amount}`, deal?.title ?? "");
    return payment;
  },
};
