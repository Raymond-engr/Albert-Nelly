import type { MotionMode } from "@/types/motion";

/**
 * Motion modes: Full, Light and Still.
 *
 * - Development: NEXT_PUBLIC_MOTION_MODE=full|light|still pins the mode. Production builds ignore it.
 * - Otherwise the mode adapts at runtime. Reduced motion, data saver, a slow connection or low memory
 *   set a ceiling; a stage that renders frames can lower it further with reportFps().
 * - Changes are gradual: down one mode per second, up only after the better condition has held for
 *   UP_AFTER_MS, so a flickering connection does not make the page flicker with it.
 *
 * Read it with useMotionMode() (src/hooks/useMotionMode.ts).
 */
const ORDER: MotionMode[] = ["still", "light", "full"];
const rank = (m: MotionMode) => ORDER.indexOf(m);

// Tuning. Network values are the browser's own estimates (Network Information API; Chrome and Android).
const UP_AFTER_MS = 6000; // a better connection must hold this long before we step up
const FPS_FULL = 24; // below this in Full, step down to Light
const FPS_LIGHT = 15; // below this in Light, step down to Still
const RETRY_FIRST_MS = 60_000; // after a frame-rate step down, try the higher mode again after this
const RETRY_MAX_MS = 600_000; // each failed retry doubles the wait, up to this
const REDUCED = "(prefers-reduced-motion: reduce)";

type Conn = EventTarget & { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
const connection = () => (navigator as Navigator & { connection?: Conn }).connection;

/** Development only. In a production build this is always null. */
export function forcedMotionMode(): MotionMode | null {
  if (process.env.NODE_ENV === "production") return null;
  const v = process.env.NEXT_PUBLIC_MOTION_MODE?.trim().toLowerCase();
  return v === "full" || v === "light" || v === "still" ? v : null;
}

/** The best mode this device and connection allow right now. */
function ceiling(): MotionMode {
  if (matchMedia(REDUCED).matches) return "still";
  let m: MotionMode = "full";
  const c = connection();
  if (c) {
    const t = c.effectiveType, d = c.downlink && c.downlink > 0 ? c.downlink : undefined; // 0 means "unknown" or offline
    if (c.saveData || t === "slow-2g" || t === "2g" || (d !== undefined && d < 0.4)) return "still";
    if (t === "3g" || (d !== undefined && d < 1.5) || (c.rtt !== undefined && c.rtt > 400)) m = "light";
  }
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return mem !== undefined && mem < 4 && m === "full" ? "light" : m;
}

let current: MotionMode = "full";
let ready = false;
let betterSince = 0;
let perfCap: MotionMode = "full";
let perfAt = 0;
let perfHold = RETRY_FIRST_MS;
let slowWindows = 0;
let stopListening = () => {};
const subs = new Set<() => void>();

const target = (): MotionMode => {
  const forced = forcedMotionMode();
  if (forced) return forced;
  const net = ceiling();
  return rank(net) <= rank(perfCap) ? net : perfCap;
};

function publish() {
  document.documentElement.dataset.motion = current; // lets any CSS react: [data-motion="still"]
  if (process.env.NODE_ENV !== "production") console.info(`[motion] ${current}`);
  subs.forEach((f) => f());
}

function init() {
  if (ready || typeof window === "undefined") return;
  ready = true;
  current = target();
  document.documentElement.dataset.motion = current;
  if (forcedMotionMode()) console.info(`[motion] ${current} (pinned by NEXT_PUBLIC_MOTION_MODE)`);
}

function tick() {
  if (forcedMotionMode() || document.hidden) return;
  const now = Date.now();
  if (perfCap !== "full" && now - perfAt > perfHold) {
    perfCap = ORDER[rank(perfCap) + 1];
    perfAt = now;
    perfHold = Math.min(perfHold * 2, RETRY_MAX_MS);
  }
  const want = rank(target()), have = rank(current);
  if (want < have) {
    current = ORDER[have - 1];
    betterSince = 0;
    publish();
  } else if (want > have) {
    betterSince ||= now;
    if (now - betterSince >= UP_AFTER_MS) {
      current = ORDER[have + 1];
      betterSince = 0;
      publish();
    }
  } else betterSince = 0;
}

/** For a stage that renders frames: report the average frame rate about every two seconds. */
export function reportFps(fps: number) {
  if (forcedMotionMode() || current === "still") return;
  if (fps >= (current === "full" ? FPS_FULL : FPS_LIGHT)) {
    slowWindows = 0;
    return;
  }
  if (++slowWindows < 2) return;
  slowWindows = 0;
  perfCap = ORDER[rank(current) - 1];
  perfAt = Date.now();
}

export function getMotionMode(): MotionMode {
  init();
  return current;
}

export function subscribeMotion(cb: () => void): () => void {
  init();
  subs.add(cb);
  if (subs.size === 1 && !forcedMotionMode()) {
    const conn = connection(), mq = matchMedia(REDUCED);
    conn?.addEventListener("change", tick);
    mq.addEventListener("change", tick);
    const timer = window.setInterval(tick, 1000);
    stopListening = () => {
      conn?.removeEventListener("change", tick);
      mq.removeEventListener("change", tick);
      clearInterval(timer);
    };
  }
  return () => {
    subs.delete(cb);
    if (!subs.size) stopListening();
  };
}
