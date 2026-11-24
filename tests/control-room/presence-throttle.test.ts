import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the throttle behaviour of requireStaff's passive presence update.
// The module-level `seenAt` Map persists across tests in the same module, so we
// reset it by re-importing the module with vi.resetModules().

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/control-room/roles", () => ({
  can: vi.fn().mockReturnValue(true),
}));

import { createClient } from "@/lib/supabase/server";

function makeSupabaseMock(staffId = "user-abc") {
  const updateChain = {
    eq: vi.fn().mockReturnValue(Promise.resolve({ data: null, error: null })),
  };
  const updateFn = vi.fn().mockReturnValue(updateChain);
  const fromFn = vi.fn().mockImplementation((table: string) => {
    if (table === "staff") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: staffId, name: "Test", email: "t@t.com", role: "owner", status: "active" },
              error: null,
            }),
          }),
        }),
        update: updateFn,
      };
    }
    return {};
  });
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: staffId } }, error: null }),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: "aal2" },
          error: null,
        }),
      },
    },
    from: fromFn,
    _updateFn: updateFn,
    _updateChain: updateChain,
  };
}

describe("requireStaff passive presence throttle", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("writes last_seen_at on the first call", async () => {
    const mock = makeSupabaseMock("user-throttle-1");
    vi.mocked(createClient).mockResolvedValue(mock as never);

    const { requireStaff } = await import("@/lib/control-room/server/guard");
    await requireStaff("overview", "view");
    // Allow async presence write to flush
    await new Promise((r) => setTimeout(r, 10));

    expect(mock._updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ last_seen_at: expect.any(String) })
    );
  });

  it("skips last_seen_at write on a second call within 5 minutes", async () => {
    const mock = makeSupabaseMock("user-throttle-2");
    vi.mocked(createClient).mockResolvedValue(mock as never);

    const { requireStaff } = await import("@/lib/control-room/server/guard");
    await requireStaff("overview", "view");
    await new Promise((r) => setTimeout(r, 10));
    const firstCallCount = mock._updateFn.mock.calls.length;

    // Second call within throttle window — should NOT call update again
    await requireStaff("overview", "view");
    await new Promise((r) => setTimeout(r, 10));

    expect(mock._updateFn.mock.calls.length).toBe(firstCallCount); // no extra calls
  });
});
