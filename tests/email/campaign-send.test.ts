import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/control-room/campaigns/[id]/send/route";
import * as guardModule from "@/lib/control-room/server/guard";
import * as emailModule from "@/lib/email";

describe("POST /api/control-room/campaigns/[id]/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves eligible consented leads, creates recipient rows, and sends campaign", async () => {
    const mockCampaign = {
      id: "camp-123",
      name: "Product Launch",
      subject: "Introducing Our New Feature",
      body: "Check out what we built.",
      template: "promo",
      audience_types: ["hire", "update"],
      status: "draft",
    };

    const mockLeads = [
      { id: "lead-1", name: "Alice", email: "alice@example.com", type: "hire" },
      { id: "lead-2", name: "Bob", email: "bob@example.com", type: "update" },
      { id: "lead-3", name: "Alice Duplicate", email: "alice@example.com", type: "hire" }, // Should be deduplicated
    ];

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "campaigns") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockCampaign, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { ...mockCampaign, status: "sent", sent_at: new Date().toISOString() },
                    error: null,
                  }),
                }),
              }),
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
                data: [
                  { id: "rec-1", lead_id: "lead-1" },
                  { id: "rec-2", lead_id: "lead-2" },
                ],
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
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.spyOn(guardModule, "requireStaff").mockResolvedValue({
      staff: { id: "staff-1", name: "Admin", email: "admin@example.com", role: "owner", status: "active", lastSeen: null },
      supabase: mockSupabase as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["supabase"],
      user: { id: "staff-1" } as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["user"],
    });

    const sendBatchSpy = vi.spyOn(emailModule, "sendBatch").mockResolvedValue({
      results: [{ id: "resend_1" }, { id: "resend_2" }],
      successCount: 2,
      failureCount: 0,
    });

    const req = new Request("http://localhost:3000/api/control-room/campaigns/camp-123/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const ctx = { params: Promise.resolve({ id: "camp-123" }) };
    const res = await POST(req, ctx);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe("sent");

    // Verified 2 unique leads dispatched
    expect(sendBatchSpy).toHaveBeenCalledTimes(1);
    const batchArg = sendBatchSpy.mock.calls[0][0];
    expect(batchArg.length).toBe(2);
    expect(batchArg[0].to).toBe("alice@example.com");
    expect(batchArg[1].to).toBe("bob@example.com");
  });

  it("returns 400 if campaign is already sent", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "camp-sent", status: "sent" },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.spyOn(guardModule, "requireStaff").mockResolvedValue({
      staff: { id: "staff-1", name: "Admin", email: "admin@example.com", role: "owner", status: "active", lastSeen: null },
      supabase: mockSupabase as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["supabase"],
      user: { id: "staff-1" } as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["user"],
    });

    const req = new Request("http://localhost:3000/api/control-room/campaigns/camp-sent/send", {
      method: "POST",
    });

    const ctx = { params: Promise.resolve({ id: "camp-sent" }) };
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
  });
});
