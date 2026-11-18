import type { LeadType } from "@/types/lead";

export const COUNTDOWN_SECONDS = 5;
export const NOT_SURE = "Not sure yet";

export const leadOptions: Record<LeadType, string> = {
  hire: "I want to hire Albert Nelly",
  refer: "I want to refer someone",
  partner: "I want to partner with Albert Nelly",
  update: "Just keep me updated",
};

export const leadHeadings: Record<LeadType, string> = {
  hire: "Tell us what you’re building",
  refer: "Become a referrer",
  partner: "Let’s partner",
  update: "Stay in the loop",
};

export const partnerCategories = ["Photography", "Flyer design", "Portrait art", "Event planning", "Other"];
export const countryCodes = ["+234", "+233", "+254", "+27", "+44", "+1"];
export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
