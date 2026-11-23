import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/webhooks/email/route";
import * as adminModule from "@/lib/supabase/admin";

describe("POST /api/webhooks/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.EMAIL_WEBHOOK_SECRET;
  });

  it("updates delivered_at timestamp on email.delivered event", async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const mockAdmin = {
      from: vi.fn().mockReturnValue({
        update: updateSpy,
      }),
    };

    vi.spyOn(adminModule, "getAdminClient").mockReturnValue(mockAdmin as unknown as ReturnType<typeof adminModule.getAdminClient>);

    const req = new Request("http://localhost:3000/api/webhooks/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "email.delivered",
        data: {
          email_id: "resend_12345",
          tags: { recipient_id: "rec-999" },
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ delivered_at: expect.any(String) })
    );
  });

  it("unsubscribes lead on hard bounce", async () => {
    const leadUpdateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "campaign_recipients") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { lead_id: "lead-bounce-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "leads") {
          return {
            update: leadUpdateSpy,
          };
        }
        return {};
      }),
    };

    vi.spyOn(adminModule, "getAdminClient").mockReturnValue(mockAdmin as unknown as ReturnType<typeof adminModule.getAdminClient>);

    const req = new Request("http://localhost:3000/api/webhooks/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "email.bounced",
        data: {
          email_id: "resend_bounce_123",
          tags: { recipient_id: "rec-bounced-1" },
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(leadUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ unsubscribed_at: expect.any(String) })
    );
  });
});
