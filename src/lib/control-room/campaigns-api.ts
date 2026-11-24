import { logActivity, uid } from "./api";
import { dbStore } from "./store";
import type { Campaign } from "./types";

/**
 * Writes for campaigns.
 * TODO(integration): sending goes through an email provider (for example Resend) and a queue. The browser only asks the server
 * to schedule or send; the server renders the email, sends it in batches and records delivered, opened and clicked from the
 * provider's webhooks. Endpoints: POST /api/control-room/campaigns, PATCH /:id, POST /:id/schedule, POST /:id/send, DELETE /:id.
 */
export type CampaignDraft = Pick<Campaign, "name" | "subject" | "template" | "audience" | "audienceSize" | "body">;

const swap = (id: string, patch: Partial<Campaign>) =>
  dbStore.set((db) => ({ ...db, campaigns: db.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

export const campaignsApi = {
  async create(): Promise<Campaign> {
    const c: Campaign = { id: uid("camp"), name: "Untitled campaign", subject: "", template: "promo", audience: "hire,refer,partner,update", audienceSize: 0, status: "draft", scheduledFor: null, sentAt: null, stats: null, body: "" };
    dbStore.set((db) => ({ ...db, campaigns: [c, ...db.campaigns] }));
    logActivity("Started a campaign", c.name);
    return c;
  },
  async save(id: string, draft: CampaignDraft): Promise<void> {
    swap(id, draft);
    logActivity("Saved a campaign draft", draft.name);
  },
  async schedule(id: string, draft: CampaignDraft, whenIso: string): Promise<void> {
    swap(id, { ...draft, status: "scheduled", scheduledFor: whenIso });
    logActivity("Scheduled a campaign", draft.name);
  },
  async unschedule(id: string): Promise<void> {
    swap(id, { status: "draft", scheduledFor: null });
    logActivity("Moved a campaign back to draft", dbStore.get().campaigns.find((c) => c.id === id)?.name ?? "");
  },
  /** The prototype invents the results (58 percent opened, 14 percent clicked). The real numbers come from the email provider. */
  async sendNow(id: string, draft: CampaignDraft): Promise<void> {
    const n = draft.audienceSize;
    swap(id, { ...draft, status: "sent", scheduledFor: null, sentAt: new Date().toISOString(), stats: { delivered: n, opened: Math.round(n * 0.58), clicked: Math.round(n * 0.14) } });
    logActivity(`Sent a campaign to ${n} people`, draft.name);
  },
  async remove(id: string): Promise<void> {
    const name = dbStore.get().campaigns.find((c) => c.id === id)?.name ?? "";
    dbStore.set((db) => ({ ...db, campaigns: db.campaigns.filter((c) => c.id !== id) }));
    logActivity("Deleted a campaign", name);
  },
};
