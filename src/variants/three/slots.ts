import { mainSlots } from "@/components/showroom/slots";
import type { Slots } from "@/types/slots";
import Footer from "./Footer";
import Hero from "./Hero";
import Join from "./Join";
import Nav from "./Nav";
import Referral from "./Referral";
import RegistrationPanel from "./RegistrationPanel";
import Schools from "./Schools";
import Services from "./Services";
import Stage from "./Stage";
import WhatsAppFab from "./WhatsAppFab";

/**
 * Variant "three": "From canvas to code". About, Work and Partners are not in the
 * prototype, so they fall back to main's versions. See docs/variants/three.md.
 */
export const threeSlots: Slots = {
  ...mainSlots,
  Nav, Stage, Hero, Services, Schools, Referral, Join, Footer, WhatsAppFab, RegistrationPanel,
};
