import { mainSlots } from "@/components/showroom/slots";
import type { Slots } from "@/types/slots";
import Hero from "./Hero";
import Nav from "./Nav";
import RegistrationPanel from "./RegistrationPanel";

/**
 * Variant "four": the "From stroke to chat" prototype (one scroll-scrubbed hero, a quiet nav and a chat-style
 * registration). Every slot not listed here is main's version. See docs/variants/four.md.
 */
export const fourSlots: Slots = {
  ...mainSlots,
  Nav,
  Hero,
  RegistrationPanel,
};
