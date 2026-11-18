import type { ComponentType } from "react";

/** Every swappable part of the Showroom. All slots are prop-less. */
export const SLOT_NAMES = [
  "Nav",
  "Stage",
  "Hero",
  "About",
  "Services",
  "Schools",
  "Work",
  "Referral",
  "Partners",
  "Join",
  "Footer",
  "WhatsAppFab",
  "RegistrationPanel",
] as const;

export type SlotName = (typeof SLOT_NAMES)[number];
export type Slots = Record<SlotName, ComponentType>;
