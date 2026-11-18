import { site } from "@/data/site";
import { NOT_SURE } from "@/data/registration";
import type { LeadType, LeadValues } from "@/types/lead";

export const waLink = (message: string) => `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;

/** The first WhatsApp message, prefilled. The visitor still has to tap Send. */
export function leadMessage(type: LeadType, v: LeadValues, ctx: string): string {
  const what = ctx || (v.service && v.service !== NOT_SURE ? v.service : "a project");
  switch (type) {
    case "refer":
      return `Hello Albert Nelly, I’m ${v.name}. I’d like to refer a client to you and join the referral program.`;
    case "partner":
      return `Hello Albert Nelly, I’m ${v.name} from ${v.business} (${v.category}). I’d like to become a partner.`;
    default:
      return `Hello Albert Nelly, my name is ${v.name}. I’d like to talk about ${what}. I found you through your website.`;
  }
}
