import type { SchoolPackage } from "@/types/content";

export const AI_FEATURE = "AI assistant";

export const packages: SchoolPackage[] = [
  { name: "Starter", description: "A clear, modern school website.", audience: "Schools starting online", price: "₦X",
    features: ["Home, About and Academics pages", "Gallery", "News and events", "Contact page", "Inquiry or application form"],
    more: ["Easy editing panel for staff", "Fast, mobile-first design", "WhatsApp chat button"] },
  { name: "Smart School Portal", description: "Starter, plus report cards, tests and fee tracking.", audience: "Schools ready to go paperless", price: "from ₦X", featured: true,
    features: ["Everything in Starter", "Termly report cards parents can print", "Teacher portal for scores and comments", "Computer-based tests, marked automatically", AI_FEATURE],
    more: ["Online fee tracking with receipts"] },
  { name: "Custom Suite", description: "Everything, plus features built with your school.", audience: "Larger or multi-campus schools", price: "Custom quote after consultation",
    features: ["Everything in Smart School Portal", "Several campuses", "Staff payroll", "Library tools"],
    more: ["Mobile apps", "Anything else we design together"] },
];

export const runningCosts = [
  { item: "Domain", amount: "₦X" },
  { item: "Hosting", amount: "₦X" },
  { item: "AI and messaging usage", amount: "₦X" },
  { item: "Support", amount: "₦X" },
];
