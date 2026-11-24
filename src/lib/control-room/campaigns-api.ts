import { call } from "./http";
import { refreshDb } from "./store";
import type { Campaign } from "./types";

export type CampaignDraft = Pick<Campaign, "name" | "subject" | "template" | "audience" | "audienceSize" | "body">;

export const campaignsApi = {
  async create(): Promise<Campaign> {
    const campaign = await call<Campaign>("POST", "/api/control-room/campaigns");
    await refreshDb();
    return campaign;
  },
  async save(id: string, draft: CampaignDraft): Promise<void> {
    await call("PATCH", `/api/control-room/campaigns/${id}`, draft);
    await refreshDb();
  },
  async schedule(id: string, draft: CampaignDraft, whenIso: string): Promise<void> {
    await call("POST", `/api/control-room/campaigns/${id}/schedule`, { ...draft, whenIso });
    await refreshDb();
  },
  async unschedule(id: string): Promise<void> {
    await call("POST", `/api/control-room/campaigns/${id}/draft`);
    await refreshDb();
  },
  async sendNow(id: string, draft: CampaignDraft): Promise<void> {
    await call("POST", `/api/control-room/campaigns/${id}/send`, draft);
    await refreshDb();
  },
  async remove(id: string): Promise<void> {
    await call("DELETE", `/api/control-room/campaigns/${id}`);
    await refreshDb();
  },
};
