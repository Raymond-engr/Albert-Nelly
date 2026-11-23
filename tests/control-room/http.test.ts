import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { call, ApiError } from "@/lib/control-room/http";

describe("Client HTTP layer: call<T>()", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns parsed data when response is ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ ok: true, data: { id: "deal-1", title: "Wedding Shoot" } }),
    });

    const result = await call<{ id: string; title: string }>(
      "PATCH",
      "/api/control-room/deals/deal-1",
      { title: "Wedding Shoot" }
    );

    expect(result).toEqual({ id: "deal-1", title: "Wedding Shoot" });
    expect(global.fetch).toHaveBeenCalledWith("/api/control-room/deals/deal-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Wedding Shoot" }),
    });
  });

  it("throws ApiError with status and custom message on non-ok responses", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        ok: false,
        error: "Title cannot be empty.",
        fields: { title: "Required" },
      }),
    });

    await expect(
      call("POST", "/api/control-room/deals", { title: "" })
    ).rejects.toSatisfy((e: unknown) => {
      return (
        e instanceof ApiError &&
        e.status === 400 &&
        e.message === "Title cannot be empty." &&
        e.fields?.title === "Required"
      );
    });
  });

  it("provides fallback error message if server returns invalid JSON or empty body", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new Error("Bad Gateway")),
    });

    await expect(call("GET", "/api/control-room/snapshot")).rejects.toSatisfy(
      (e: unknown) => {
        return (
          e instanceof ApiError &&
          e.status === 502 &&
          e.message === "Something went wrong. Please try again."
        );
      }
    );
  });
});
