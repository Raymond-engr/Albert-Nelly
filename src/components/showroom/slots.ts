import type { Slots } from "@/types/slots";
import Nav from "./Nav";
import Stage from "./Stage";
import Hero from "./Hero";
import About from "./About";
import Services from "./Services";
import Schools from "./Schools";
import Work from "./Work";
import Referral from "./Referral";
import Partners from "./Partners";
import Join from "./Join";
import Footer from "./Footer";
import WhatsAppFab from "./WhatsAppFab";
import RegistrationPanel from "./RegistrationPanel";

/** The live site. To swap a part from a variant, change ONE import here. See docs/SWAP_INTO_MAIN.md. */
export const mainSlots: Slots = {
  Nav, Stage, Hero, About, Services, Schools, Work, Referral, Partners, Join, Footer, WhatsAppFab, RegistrationPanel,
};
