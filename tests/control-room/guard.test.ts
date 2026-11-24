import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { createMockSupabase } from "../mocks/supabase";

// Mock @/lib/supabase/server
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Control Room Guard: requireStaff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 401 if user is not signed in", async () => {
    const mockSupabase = createMockSupabase({ user: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    await expect(requireStaff("leads", "view")).rejects.toThrow(
      new HttpError(401, "Sign in to continue.")
    );
  });

  it("throws 401 if user has not completed two-step verification (AAL1)", async () => {
    const mockSupabase = createMockSupabase({ aal: "aal1" });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    await expect(requireStaff("leads", "view")).rejects.toThrow(
      new HttpError(401, "Two-step verification is required.")
    );
  });

  it("throws 403 if staff account does not exist or is disabled", async () => {
    const mockSupabase = createMockSupabase({ staff: null });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    await expect(requireStaff("leads", "view")).rejects.toThrow(
      new HttpError(403, "This account is not active.")
    );
  });

  it("throws 403 if staff account status is invited rather than active", async () => {
    const mockSupabase = createMockSupabase({
      staff: {
        id: "user-123",
        name: "Invited User",
        email: "invited@albertnelly.com",
        role: "owner",
        status: "invited",
      },
    });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    await expect(requireStaff("leads", "view")).rejects.toThrow(
      new HttpError(403, "This account is not active.")
    );
  });

  it("throws 403 if user role is not permitted to perform action in area", async () => {
    const mockSupabase = createMockSupabase({
      staff: {
        id: "user-123",
        name: "Sales User",
        email: "sales@albertnelly.com",
        role: "sales",
        status: "active",
      },
    });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    // Sales role cannot edit team
    await expect(requireStaff("team", "edit")).rejects.toThrow(
      new HttpError(403, "Your role can’t do this.")
    );
  });

  it("returns staff, user, and supabase when authorized", async () => {
    const mockSupabase = createMockSupabase({
      staff: {
        id: "user-123",
        name: "Owner User",
        email: "owner@albertnelly.com",
        role: "owner",
        status: "active",
      },
    });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const result = await requireStaff("team", "edit");
    expect(result.staff.role).toBe("owner");
    expect(result.user.id).toBe("user-123");
    expect(result.supabase).toBeDefined();
  });
});

describe("Control Room Guard: handle() wrapper", () => {
  it("wraps successful executions in { ok: true, data }", async () => {
    const response = await handle(async () => ({ message: "success" }));
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ ok: true, data: { message: "success" } });
  });

  it("maps HttpError to response status and error body", async () => {
    const response = await handle(async () => {
      throw new HttpError(403, "Forbidden action");
    });
    expect(response.status).toBe(403);

    const json = await response.json();
    expect(json).toEqual({ ok: false, error: "Forbidden action" });
  });

  it("catches unexpected exceptions and returns generic 500 error", async () => {
    const response = await handle(async () => {
      throw new Error("Database connection dropped unexpectedly");
    });
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toEqual({ ok: false, error: "Something went wrong. Please try again." });
  });
});
