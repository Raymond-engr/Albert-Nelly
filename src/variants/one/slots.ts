import type { Slots } from "@/types/slots";
import About from "./About";
import Footer from "./Footer";
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
 * Variant "one": the painted-canvas prototype, converted part by part and unchanged in look and wording.
 * All thirteen slots come from this folder. Nothing falls back to main, so no part of main shows through.
 */
export const oneSlots: Slots = { Nav, Stage, Hero, About, Services, Schools, Work, Referral, Partners, Join, Footer, WhatsAppFab, RegistrationPanel };
