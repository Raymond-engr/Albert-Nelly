import { mainSlots } from "@/components/showroom/slots";
import type { Slots } from "@/types/slots";

/**
 * Variant "four". Every slot starts as main's version. Replace a slot by creating
 * a file in this folder (for example ./Hero.tsx) and importing it below.
 * See docs/CONVERT_PROTOTYPE.md.
 */
export const fourSlots: Slots = {
  ...mainSlots,
  // Hero,
  // Stage,
};
