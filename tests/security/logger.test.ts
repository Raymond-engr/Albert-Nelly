import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("logger.error", () => {
  it("writes a JSON object with required keys to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Dynamic import ensures fresh module load with clean env
    return import("@/lib/logger").then(({ logger }) => {
      logger.error("something broke", { route: "/api/leads" });

      expect(spy).toHaveBeenCalledOnce();
      const raw = spy.mock.calls[0][0] as string;
      const parsed = JSON.parse(raw);

      expect(parsed.level).toBe("error");
      expect(parsed.message).toBe("something broke");
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(parsed.route).toBe("/api/leads");
    });
  });

  it("does not throw when ctx is omitted", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    return import("@/lib/logger").then(({ logger }) => {
      expect(() => logger.error("bare error")).not.toThrow();
    });
  });

  it("does not forward to Sentry when SENTRY_DSN is absent", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    vi.spyOn(console, "error").mockImplementation(() => {});

    return import("@/lib/logger").then(({ logger }) => {
      logger.error("no sentry");
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
