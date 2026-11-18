import { mainSlots } from "@/components/showroom/slots";
import type { Slots } from "@/types/slots";
import Referral from "./Referral";
import RegistrationPanel from "./RegistrationPanel";
import Stage from "./Stage";
import WhatsAppFab from "./WhatsAppFab";

/**
 * Variant "one": the painted-canvas prototype. Every slot not listed here is main's version.
 * See docs/variants/one.md for what each part looks like and needs.
 */
export const oneSlots: Slots = {
  ...mainSlots,
  Stage,
  Referral,
  WhatsAppFab,
  RegistrationPanel,
};
