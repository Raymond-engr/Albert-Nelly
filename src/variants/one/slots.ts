import { mainSlots } from "@/components/showroom/slots";
import type { Slots } from "@/types/slots";

/**
 * Variant "one". Every slot starts as main's version. Replace a slot by creating
 * a file in this folder (for example ./Hero.tsx) and importing it below.
 * See docs/CONVERT_PROTOTYPE.md.
 */
export const oneSlots: Slots = {
  ...mainSlots,
  // Hero,
  // Stage,
};
