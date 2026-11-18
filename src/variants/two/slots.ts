import { mainSlots } from "@/components/showroom/slots";
import type { Slots } from "@/types/slots";
import About from "./About";
import Hero from "./Hero";
import Join from "./Join";
import Nav from "./Nav";
import Partners from "./Partners";
import Referral from "./Referral";
import RegistrationPanel from "./RegistrationPanel";
import Schools from "./Schools";
import Services from "./Services";
import Stage from "./Stage";
import WhatsAppFab from "./WhatsAppFab";
import Work from "./Work";

/**
 * Variant "two": the scroll-driven Three.js prototype. Every slot not listed here (Footer) is main's version.
 * See docs/variants/two.md for what each part looks like and needs.
 */
export const twoSlots: Slots = {
  ...mainSlots,
  Nav,
  Stage,
  Hero,
  About,
  Services,
  Schools,
  Work,
  Referral,
  Partners,
  Join,
  WhatsAppFab,
  RegistrationPanel,
};
