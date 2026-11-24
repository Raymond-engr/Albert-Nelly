import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/control-room/uploads/route";
import * as guardModule from "@/lib/control-room/server/guard";
import * as nextCache from "next/cache";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("POST /api/control-room/uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns signed upload URL and updates work_items row", async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const mockSupabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUploadUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://xyz.storage.supabase.co/upload?token=abc", token: "abc" },
            error: null,
          }),
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "work_items") {
          return { update: updateSpy };
        }
        return {};
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.spyOn(guardModule, "requireStaff").mockResolvedValue({
      staff: { id: "staff-1", name: "Content Admin", email: "content@example.com", role: "content", status: "active", lastSeen: null },
      supabase: mockSupabase as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["supabase"],
      user: { id: "staff-1" } as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["user"],
    });

    const req = new Request("http://localhost:3000/api/control-room/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "work",
        entityId: "item-123",
        contentType: "image/webp",
        size: 140 * 1024,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.signedUrl).toContain("token=abc");
    expect(json.data.path).toBe("work/item-123.webp");
  });

  it("rejects unauthorized staff roles like sales", async () => {
    vi.spyOn(guardModule, "requireStaff").mockResolvedValue({
      staff: { id: "staff-2", name: "Sales User", email: "sales@example.com", role: "sales", status: "active", lastSeen: null },
      supabase: {} as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["supabase"],
      user: { id: "staff-2" } as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["user"],
    });

    const req = new Request("http://localhost:3000/api/control-room/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "work",
        entityId: "item-123",
        contentType: "image/webp",
        size: 50 * 1024,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("rejects files exceeding size limits with 400", async () => {
    vi.spyOn(guardModule, "requireStaff").mockResolvedValue({
      staff: { id: "staff-1", name: "Owner", email: "owner@example.com", role: "owner", status: "active", lastSeen: null },
      supabase: {} as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["supabase"],
      user: { id: "staff-1" } as unknown as Awaited<ReturnType<typeof guardModule.requireStaff>>["user"],
    });

    const req = new Request("http://localhost:3000/api/control-room/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "work",
        entityId: "item-123",
        contentType: "image/webp",
        size: 600 * 1024, // Exceeds 500 KB limit
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("exceeds the maximum limit");
  });
});
