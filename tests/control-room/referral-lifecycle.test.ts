import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as convertToReferrerPost } from "@/app/api/control-room/leads/[id]/convert-to-referrer/route";
import { POST as referrersPost } from "@/app/api/control-room/referrers/route";
import { POST as leadsPost } from "@/app/api/leads/route";
import * as guardModule from "@/lib/control-room/server/guard";
import * as adminModule from "@/lib/supabase/admin";

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: vi.fn(),
  };
});

describe("Referral Lifecycle Automation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/control-room/leads/[id]/convert-to-referrer", () => {
    it("promotes lead of type refer to referrer row and updates lead to contacted", async () => {
      const mockLead = {
        id: "lead-ref-1",
        name: "Jane Referrer",
        email: "jane@example.com",
        whatsapp: "08012345678",
        type: "refer",
      };

      const insertSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "ref-new-1", name: "Jane Referrer", email: "jane@example.com", whatsapp: "08012345678", rate: 12, status: "active" },
            error: null,
          }),
        }),
      });

      const updateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "leads") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockLead, error: null }),
                }),
              }),
              update: updateSpy,
            };
          }
          if (table === "referrers") {
            return {
              select: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
              insert: insertSpy,
            };
          }
          return {};
        }),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.spyOn(guardModule, "requireStaff").mockResolvedValue({
        staff: { id: "staff-1", name: "Owner", email: "owner@example.com", role: "owner", status: "active", lastSeen: null },
        supabase: mockSupabase as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["supabase"],
        user: { id: "staff-1" } as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["user"],
      });

      const req = new Request("http://localhost:3000/api/control-room/leads/lead-ref-1/convert-to-referrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: 12 }),
      });

      const res = await convertToReferrerPost(req, { params: Promise.resolve({ id: "lead-ref-1" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.email).toBe("jane@example.com");

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Jane Referrer",
          email: "jane@example.com",
          rate: 12,
        })
      );
      expect(updateSpy).toHaveBeenCalledWith({ status: "contacted" });
    });

    it("rejects duplicate referrer email with 409 Conflict", async () => {
      const mockLead = {
        id: "lead-ref-2",
        name: "Existing Person",
        email: "duplicate@example.com",
        whatsapp: "08012345678",
        type: "refer",
      };

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "leads") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockLead, error: null }),
                }),
              }),
            };
          }
          if (table === "referrers") {
            return {
              select: vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "ref-dup", name: "Already There" }, error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      };

      vi.spyOn(guardModule, "requireStaff").mockResolvedValue({
        staff: { id: "staff-1", name: "Owner", email: "owner@example.com", role: "owner", status: "active", lastSeen: null },
        supabase: mockSupabase as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["supabase"],
        user: { id: "staff-1" } as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["user"],
      });

      const req = new Request("http://localhost:3000/api/control-room/leads/lead-ref-2/convert-to-referrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: 10 }),
      });

      const res = await convertToReferrerPost(req, { params: Promise.resolve({ id: "lead-ref-2" }) });
      expect(res.status).toBe(409);
    });
  });

  describe("POST /api/control-room/referrers", () => {
    it("rejects duplicate email during manual referrer creation", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: "existing-id" }, error: null }),
            }),
          }),
        }),
      };

      vi.spyOn(guardModule, "requireStaff").mockResolvedValue({
        staff: { id: "staff-1", name: "Owner", email: "owner@example.com", role: "owner", status: "active", lastSeen: null },
        supabase: mockSupabase as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["supabase"],
        user: { id: "staff-1" } as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["user"],
      });

      const req = new Request("http://localhost:3000/api/control-room/referrers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "exists@example.com",
          whatsapp: "08012345678",
          rate: 10,
        }),
      });

      const res = await referrersPost(req);
      expect(res.status).toBe(409);
    });
  });

  describe("POST /api/leads referral attribution", () => {
    it("stores referrer_id when valid ref is passed in payload", async () => {
      const insertSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "new-lead-id" }, error: null }),
        }),
      });

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "referrers") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: { id: "11111111-1111-1111-1111-111111111111" }, error: null }),
                  }),
                }),
              }),
            };
          }
          if (table === "leads") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
              insert: insertSpy,
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
          type: "hire",
          name: "Client Referred",
          email: "referred@example.com",
          whatsapp: "08012345678",
          consent: true,
          ref: "11111111-1111-1111-1111-111111111111",
        }),
      });

      const res = await leadsPost(req);
      expect(res.status).toBe(200);
      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          referrer_id: "11111111-1111-1111-1111-111111111111",
        })
      );
    });
  });
});
