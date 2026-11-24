import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/cron/birthdays/route";
import * as adminModule from "@/lib/supabase/admin";
import * as emailModule from "@/lib/email";

describe("POST /api/cron/birthdays", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
  });

  it("rejects unauthorized cron requests without bearer token", async () => {
    const req = new Request("http://localhost:3000/api/cron/birthdays", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("sends birthday greetings and avoids duplicate sending for same year", async () => {
    const sendEmailSpy = vi.spyOn(emailModule, "sendEmail").mockResolvedValue({ id: "resend_bday_1" });

    // Format today's date in Lagos
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((p) => [p.type, p.value]));
    const currentYear = parseInt(parts.year, 10);
    const currentMonth = parseInt(parts.month, 10);
    const currentDay = parseInt(parts.day, 10);

    const mockCandidates = [
      { id: "lead-bday-1", name: "Emeka", email: "emeka@example.com", birth_month: currentMonth, birth_day: currentDay },
      { id: "lead-bday-2", name: "Zainab", email: "zainab@example.com", birth_month: currentMonth, birth_day: currentDay },
    ];

    // Zainab was already sent this year
    const mockAlreadySent = [{ lead_id: "lead-bday-2" }];

    const insertSpy = vi.fn().mockResolvedValue({ data: null, error: null });

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "settings") {
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { birthday_discount: 15 }, error: null }),
            }),
          };
        }
        if (table === "leads") {
          return {
            select: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      eq: vi.fn().mockResolvedValue({ data: mockCandidates, error: null }),
                      in: vi.fn().mockResolvedValue({ data: mockCandidates, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "birthday_sends") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: mockAlreadySent, error: null }),
              }),
            }),
            insert: insertSpy,
          };
        }
        return {};
      }),
    };

    vi.spyOn(adminModule, "getAdminClient").mockReturnValue(mockAdmin as unknown as ReturnType<typeof adminModule.getAdminClient>);

    const req = new Request("http://localhost:3000/api/cron/birthdays", {
      method: "POST",
      headers: {
        authorization: "Bearer test-cron-secret",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.sent).toBe(1); // Only Emeka was sent; Zainab was filtered out by sentSet

    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "emeka@example.com",
        subject: "Happy birthday from Albert Nelly",
      })
    );

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_id: "lead-bday-1",
        year: currentYear,
        provider_id: "resend_bday_1",
      })
    );
  });
});
