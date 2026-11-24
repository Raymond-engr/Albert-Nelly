import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH as updateLead } from "@/app/api/control-room/leads/[id]/route";
import { PATCH as updateService } from "@/app/api/control-room/services/[id]/route";
import { createJsonRequest } from "../../mocks/request";
import { createMockSupabase } from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

describe("Mutation Endpoints: Leads Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid JSON payload with 400", async () => {
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

    const req = new Request("http://localhost:3000/api/control-room/leads/lead-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json-content",
    });
    const ctx = { params: Promise.resolve({ id: "lead-1" }) };

    const response = await updateLead(req, ctx);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Invalid JSON payload.");
  });

  it("rejects moving lead directly to deal status with 422", async () => {
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

    const req = createJsonRequest("http://localhost:3000/api/control-room/leads/lead-1", {
      status: "deal",
    });
    const ctx = { params: Promise.resolve({ id: "lead-1" }) };

    const response = await updateLead(req, ctx);
    expect(response.status).toBe(422);

    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain("convert endpoint");
  });

  it("successfully updates lead notes and logs activity for authorized staff", async () => {
    const leadRow = {
      id: "lead-1",
      name: "Tunde Bakare",
      email: "tunde@example.com",
      phone: "+2348012345678",
      whatsapp: "+2348012345678",
      source: "website",
      status: "contacted",
      notes: "Followed up via WhatsApp.",
      tags: ["vip"],
      owner_id: "sales-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockSupabase = createMockSupabase({
      staff: {
        id: "sales-1",
        name: "Sales Rep",
        email: "sales@albertnelly.com",
        role: "sales",
        status: "active",
      },
      queryResults: {
        leads: { data: leadRow, error: null },
      },
    });

    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase as unknown as { rpc: unknown }).rpc = rpcMock;

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const req = createJsonRequest("http://localhost:3000/api/control-room/leads/lead-1", {
      notes: "Followed up via WhatsApp.",
    });
    const ctx = { params: Promise.resolve({ id: "lead-1" }) };

    const response = await updateLead(req, ctx);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.id).toBe("lead-1");
    expect(json.data.notes).toBe("Followed up via WhatsApp.");
    expect(rpcMock).toHaveBeenCalledWith("log_activity", {
      p_action: "Edited a lead",
      p_target: "Tunde Bakare",
    });
  });

  it("calls revalidatePath('/') when a public service is updated", async () => {
    const serviceRow = {
      id: "svc-1",
      title: "UI/UX Design",
      description: "Modern design",
      audience: "Startups",
      badge: "",
      price: { kind: "from", amount: 400000 },
      published: true,
    };

    const mockSupabase = createMockSupabase({
      staff: {
        id: "owner-1",
        name: "Owner",
        email: "owner@albertnelly.com",
        role: "owner",
        status: "active",
      },
      queryResults: {
        services: { data: serviceRow, error: null },
      },
    });

    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: null });
    (mockSupabase as unknown as { rpc: unknown }).rpc = rpcMock;

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const req = createJsonRequest("http://localhost:3000/api/control-room/services/svc-1", {
      title: "UI/UX Design Updated",
    });
    const ctx = { params: Promise.resolve({ id: "svc-1" }) };

    const response = await updateService(req, ctx);
    expect(response.status).toBe(200);

    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});
