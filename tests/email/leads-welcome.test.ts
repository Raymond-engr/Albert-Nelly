import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/leads/route";
import * as emailModule from "@/lib/email";
import * as adminModule from "@/lib/supabase/admin";

let afterTask: (() => Promise<void>) | null = null;

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: vi.fn((cb: () => Promise<void>) => {
      afterTask = cb;
    }),
  };
});

describe("POST /api/leads - Welcome Email Trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    afterTask = null;
  });

  it("triggers welcome email when lead consents on new registration", async () => {
    const sendEmailSpy = vi.spyOn(emailModule, "sendEmail").mockResolvedValue({ id: "mock_msg_123" });

    const mockAdmin = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "leads") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "test-lead-uuid" }, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.spyOn(adminModule, "getAdminClient").mockReturnValue(mockAdmin as unknown as ReturnType<typeof adminModule.getAdminClient>);

    const req = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "update",
        name: "Amaka",
        email: "amaka@example.com",
        consent: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    expect(afterTask).not.toBeNull();
    await afterTask!();

    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "amaka@example.com",
        subject: "Welcome to Albert Nelly",
        unsubscribeUrl: expect.stringContaining("test-lead-uuid"),
      })
    );
  });

  it("rejects registration without consent with 422", async () => {
    const sendEmailSpy = vi.spyOn(emailModule, "sendEmail").mockResolvedValue({ id: "mock_msg_123" });

    const req = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "update",
        name: "Amaka",
        email: "amaka@example.com",
        consent: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    expect(sendEmailSpy).not.toHaveBeenCalled();
    expect(afterTask).toBeNull();
  });
});
