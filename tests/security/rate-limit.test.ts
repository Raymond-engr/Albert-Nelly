import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, _resetStore } from "@/lib/rate-limit";

beforeEach(() => {
  _resetStore();
  vi.unstubAllEnvs();
});

describe("checkRateLimit", () => {
  it("returns ok:true for requests within the limit", () => {
    vi.stubEnv("RATE_LIMIT_MAX", "3");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "60000");

    expect(checkRateLimit("1.2.3.4").ok).toBe(true);
    expect(checkRateLimit("1.2.3.4").ok).toBe(true);
    expect(checkRateLimit("1.2.3.4").ok).toBe(true);
  });

  it("returns ok:false with positive retryAfterSec on (N+1)-th request", () => {
    vi.stubEnv("RATE_LIMIT_MAX", "3");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "60000");

    checkRateLimit("5.6.7.8");
    checkRateLimit("5.6.7.8");
    checkRateLimit("5.6.7.8");
    const result = checkRateLimit("5.6.7.8");

    expect(result.ok).toBe(false);
    expect(result.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates different IPs", () => {
    vi.stubEnv("RATE_LIMIT_MAX", "1");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "60000");

    expect(checkRateLimit("10.0.0.1").ok).toBe(true);
    expect(checkRateLimit("10.0.0.2").ok).toBe(true); // different IP — not blocked
    expect(checkRateLimit("10.0.0.1").ok).toBe(false); // same IP — blocked
  });

  it("uses defaults when env vars are absent", () => {
    // No stubs → defaults: max=10, window=60s
    for (let i = 0; i < 10; i++) checkRateLimit("9.9.9.9");
    expect(checkRateLimit("9.9.9.9").ok).toBe(false);
  });
});
