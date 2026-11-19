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

/** Words for the chat-style registration panel (variant four). Optional: other panels ignore it. {name} is replaced by the visitor's first name. */
export const chatPrompts = {
  pick: "What brings you here?",
  name: "Lovely. What should we call you?",
  wa: "Nice to meet you, {name}. What’s your WhatsApp number?",
  email: "And your email?",
  service: "What do you need?",
  business: "What’s your business called?",
  category: "Which category fits you best?",
  bday: "Optional: your birthday? So we can send you a birthday surprise.",
  consent: "Last one: is it okay if we contact you?",
  consentLabel: "I agree to be contacted by Albert Nelly.",
  consentYes: "Yes, that’s fine",
  skip: "Skip",
  skipHint: "Skip, I’ll pass on the surprise",
  send: "Send",
  next: "Next",
  welcomeNew: "You’re in",
  welcomeBack: "Welcome back",
  opening: "Opening WhatsApp",
  hint: "One thing: WhatsApp can’t send for you, so tap Send when it opens.",
  updated: "Check your inbox for a welcome note.",
  placeholders: { name: "Your name", wa: "801 234 5678", email: "you@email.com", business: "Business name" },
};
