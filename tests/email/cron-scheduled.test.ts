import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/cron/send-scheduled/route";
import * as adminModule from "@/lib/supabase/admin";
import * as emailModule from "@/lib/email";

describe("POST /api/cron/send-scheduled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
  });

  it("rejects unauthorized cron requests without bearer token", async () => {
    const req = new Request("http://localhost:3000/api/cron/send-scheduled", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("processes scheduled campaigns and marks them sent", async () => {
    const mockCampaign = {
      id: "camp-scheduled-1",
      name: "Scheduled Newsletter",
      subject: "Monthly Update",
      body: "Here is what happened this month.",
      template: "promo",
      audience_types: ["update"],
      status: "scheduled",
    };

    const mockLeads = [
      { id: "lead-1", name: "Kemi", email: "kemi@example.com", type: "update" },
    ];

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "campaigns") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: [mockCampaign],
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === "leads") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ data: mockLeads, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "campaign_recipients") {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [{ id: "rec-cron-1", lead_id: "lead-1" }],
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        return {};
      }),
    };

    vi.spyOn(adminModule, "getAdminClient").mockReturnValue(mockAdmin as unknown as ReturnType<typeof adminModule.getAdminClient>);

    const sendBatchSpy = vi.spyOn(emailModule, "sendBatch").mockResolvedValue({
      results: [{ id: "resend_cron_1" }],
      successCount: 1,
      failureCount: 0,
    });

    const req = new Request("http://localhost:3000/api/cron/send-scheduled", {
      method: "POST",
      headers: {
        authorization: "Bearer test-cron-secret",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.processed).toBe(1);

    expect(sendBatchSpy).toHaveBeenCalledTimes(1);
  });
});
