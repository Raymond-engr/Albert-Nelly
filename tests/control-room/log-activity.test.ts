import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverLogActivity } from "@/lib/control-room/server/log-activity";
import type { Staff } from "@/lib/control-room/types";

function makeMockSupabase(rpcError: Error | null = null) {
  const rpcFn = vi.fn().mockReturnValue(
    Promise.resolve({ data: null, error: rpcError })
  );
  return {
    rpc: rpcFn,
  } as unknown as SupabaseClient;
}

const mockStaff: Staff = {
  id: "user-123",
  name: "Albert",
  email: "dev@albertnelly.com",
  role: "owner",
  status: "active",
  lastSeen: null,
};

describe("serverLogActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls supabase.rpc with correct action and target", async () => {
    const supabase = makeMockSupabase();
    serverLogActivity(supabase, mockStaff, "lead.update", "John Doe");
    // Allow microtasks to flush
    await new Promise((r) => setTimeout(r, 0));
    expect(supabase.rpc).toHaveBeenCalledWith("log_activity", {
      p_action: "lead.update",
      p_target: "John Doe",
    });
  });

  it("defaults target to empty string when omitted", async () => {
    const supabase = makeMockSupabase();
    serverLogActivity(supabase, mockStaff, "settings.update");
    await new Promise((r) => setTimeout(r, 0));
    expect(supabase.rpc).toHaveBeenCalledWith("log_activity", {
      p_action: "settings.update",
      p_target: "",
    });
  });

  it("does not throw when rpc returns an error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = makeMockSupabase(new Error("DB error"));
    // Must not throw
    expect(() => serverLogActivity(supabase, mockStaff, "fail.action")).not.toThrow();
    await new Promise((r) => setTimeout(r, 10));
    expect(consoleError).toHaveBeenCalledWith("[activity]", "DB error");
    consoleError.mockRestore();
  });
});
