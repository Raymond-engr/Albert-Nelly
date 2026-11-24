/**
 * In-process IP-keyed sliding-window rate limiter.
 * Keyed by IP string; timestamps are stored as ms since epoch.
 *
 * Environment:
 *   RATE_LIMIT_MAX         – max requests per window (default: 10)
 *   RATE_LIMIT_WINDOW_MS   – window size in ms        (default: 60_000)
 */

const store = new Map<string, number[]>();

function getConfig() {
  const max = parseInt(process.env.RATE_LIMIT_MAX ?? "10", 10);
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
  return {
    max: Number.isFinite(max) && max > 0 ? max : 10,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000,
  };
}

export function checkRateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
  const { max, windowMs } = getConfig();
  const now = Date.now();
  const cutoff = now - windowMs;

  const hits = (store.get(ip) ?? []).filter((t) => t > cutoff);
  hits.push(now);
  store.set(ip, hits);

  if (hits.length > max) {
    const oldest = hits[0];
    const retryAfterMs = oldest + windowMs - now;
    return { ok: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }

  return { ok: true, retryAfterSec: 0 };
}

/** Exposed for tests: reset the store between runs. */
export function _resetStore() {
  store.clear();
}
