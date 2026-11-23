import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH as updateTeamMember } from "@/app/api/control-room/team/[id]/route";
import { PATCH as updateSettings } from "@/app/api/control-room/settings/route";
import { createJsonRequest } from "../../mocks/request";
import { createMockSupabase } from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Admin Route Authorization: Team & Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-owner staff from mutating team roles with 403", async () => {
    // Staff member with sales role
    const mockSupabase = createMockSupabase({
      staff: {
        id: "sales-1",
        name: "Sales Rep",
        email: "sales@albertnelly.com",
        role: "sales",
        status: "active",
      },
    });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const req = createJsonRequest("http://localhost:3000/api/control-room/team/staff-2", {
      role: "owner",
    });
    const ctx = { params: Promise.resolve({ id: "staff-2" }) };

    const response = await updateTeamMember(req, ctx);
    expect(response.status).toBe(403);

    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Your role can’t do this.");
  });

  it("rejects non-owner staff from updating settings with 403", async () => {
    // Staff member with content role
    const mockSupabase = createMockSupabase({
      staff: {
        id: "content-1",
        name: "Marketing Lead",
        email: "content@albertnelly.com",
        role: "content",
        status: "active",
      },
    });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const req = createJsonRequest("http://localhost:3000/api/control-room/settings", {
      siteName: "Hacked Site",
    });

    const response = await updateSettings(req);
    expect(response.status).toBe(403);

    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Your role can’t do this.");
  });

  it("rejects invalid role assignment with 422 when requested by owner", async () => {
    const mockSupabase = createMockSupabase({
      staff: {
        id: "owner-1",
        name: "Owner",
        email: "owner@albertnelly.com",
        role: "owner",
        status: "active",
      },
    });
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const req = createJsonRequest("http://localhost:3000/api/control-room/team/staff-2", {
      role: "superadmin_invalid",
    });
    const ctx = { params: Promise.resolve({ id: "staff-2" }) };

    const response = await updateTeamMember(req, ctx);
    expect(response.status).toBe(422);

    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Valid role is required.");
  });
});
