import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/leads/route";
import { _resetStore } from "@/lib/rate-limit";

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => null, // demo mode — no DB needed
}));

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: vi.fn() };
});

function makeRequest(overrides: Record<string, unknown> = {}, ip = "1.2.3.4") {
  const body = {
    type: "parent",
    name: "Test User",
    email: "test@example.com",
    whatsapp: "08012345678",
    service: "photography",
    consent: true,
    ...overrides,
  };
  return new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  _resetStore();
  vi.unstubAllEnvs();
  vi.stubEnv("RATE_LIMIT_MAX", "2");
  vi.stubEnv("RATE_LIMIT_WINDOW_MS", "60000");
});

describe("POST /api/leads rate limiting", () => {
  it("allows requests within the limit", async () => {
    const r1 = await POST(makeRequest());
    const r2 = await POST(makeRequest({ email: "b@example.com" }));
    expect(r1.status).not.toBe(429);
    expect(r2.status).not.toBe(429);
  });

  it("returns 429 when limit is exceeded", async () => {
    await POST(makeRequest({ email: "c1@example.com" }));
    await POST(makeRequest({ email: "c2@example.com" }));
    const r = await POST(makeRequest({ email: "c3@example.com" }));
    expect(r.status).toBe(429);
    expect(r.headers.get("Retry-After")).toBeTruthy();
  });

  it("does not rate-limit a different IP", async () => {
    await POST(makeRequest({ email: "d1@example.com" }, "1.1.1.1"));
    await POST(makeRequest({ email: "d2@example.com" }, "1.1.1.1"));
    // Third from same IP blocked
    expect((await POST(makeRequest({ email: "d3@example.com" }, "1.1.1.1"))).status).toBe(429);
    // Different IP still OK
    expect((await POST(makeRequest({ email: "d4@example.com" }, "2.2.2.2"))).status).not.toBe(429);
  });
});
