"use client";

import { useSyncExternalStore } from "react";
import { getMotionMode, subscribeMotion } from "@/lib/motion";
import type { MotionMode } from "@/types/motion";

/**
 * The current animation mode: "full", "light" or "still". It changes at runtime (network, frame rate,
 * reduced motion), so react to it instead of reading it once. See src/lib/motion.ts.
 */
export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribeMotion, getMotionMode, () => "full" as MotionMode);
}
