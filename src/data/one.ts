import type { SceneId } from "@/types/scene";
import type { LeadType } from "@/types/lead";

/**
 * Copy for variant one, exactly as written in the HTML prototype (placeholder copy included).
 * Main's own copy stays in copy.ts, services.ts and the other data files. Nothing here is shared with main.
 */
export const oneCopy = {
  brand: "Albert Nelly",
  nav: [
    { href: "#services", label: "Services" },
    { href: "#schools", label: "Schools" },
    { href: "#work", label: "Work" },
    { href: "#referral", label: "Referral" },
    { href: "#partners", label: "Partners" },
  ],
  navCta: { long: "Start a conversation", short: "Talk to us" },
  hero: {
    title: "Ideas, designed and built.",
    lede: "Tell us what you’re building. We design it, build it and stay with you until it works.",
    primary: "Start a conversation",
    secondary: "See what we do",
  },
  about: {
    title: "A tech agency that works like a studio.",
    body: "Albert Nelly designs and builds for founders, individuals, small businesses and schools. We start with a conversation, agree the work and the price together, and show progress as we go.",
    facts: ["Five services under one roof", "Prices in naira, always open to discussion", "Every project starts as a chat on WhatsApp"],
  },
  services: {
    title: "What we can build for you",
    cta: "Talk to us",
    /** stage: the 3D object that sits on top of the card. */
    items: [
      { title: "School Websites", text: "A clear, modern site for your school, from a simple front door to a full portal.", suits: "Suits school owners and administrators" },
      { title: "UI/UX Design", text: "Interfaces people understand on the first try.", suits: "Suits founders and product teams", stage: "wire" as SceneId },
      { title: "Graphics Design", text: "Logos, flyers and brand looks that hold together.", suits: "Suits small businesses and individuals", stage: "shp" as SceneId },
      { title: "Web and Mobile Development", text: "Websites and apps built to run well and grow with you.", suits: "Suits founders and growing businesses", stage: "dev" as SceneId },
      { title: "Art and Painting", text: "Custom paintings and portraits, made with partner artists.", suits: "Suits gifts, homes and offices", badge: "with our partners" },
    ],
  },
  schools: {
    title: "School website packages",
    lead: "Hosting is included in every package. Prices are agreed with you in a short chat.",
    cta: "Talk about this package",
    tip: "Answers questions using the school’s own documents.",
    packages: [
      { title: "Starter", ctx: "Starter school website", text: "A clear, modern website for your school.", features: ["Modern, mobile-friendly site", "About, admissions and contact pages", "News and events", "Hosting included"] },
      { title: "Smart School Portal", ctx: "Smart School Portal", highlight: true, text: "Starter, plus the tools a school runs on every day.", features: ["Everything in Starter", "Report cards", "Computer-based tests", "AI assistant", "Fee tracking"], tipOn: "AI assistant" },
      { title: "Custom Suite", ctx: "Custom Suite", text: "Everything above, plus features built around your school.", features: ["Everything in Smart School Portal", "Bespoke features", "Priced after a consultation"] },
    ],
    costsTitle: "Yearly running costs",
    costs: [["Domain", "₦ to confirm"], ["Hosting", "₦ to confirm"], ["AI and messaging usage", "₦ to confirm"], ["Support", "₦ to confirm"]],
  },
  work: {
    title: "Selected work",
    filterLabel: "Filter projects",
    tabs: ["All", "Design", "Development"],
    projects: [
      { category: "Design", title: "Project 1" },
      { category: "Development", title: "Project 2" },
      { category: "Design", title: "Project 3" },
      { category: "Development", title: "Project 4" },
    ],
    challenge: "One line on the problem we solved.",
    resultBold: "One result",
    resultRest: ", ideally with a number.",
  },
  referral: {
    title: "Introduce someone. Earn when the deal closes.",
    steps: [
      ["Introduce", " a person or business that needs us."],
      ["Chat", " with them in a WhatsApp group with our team."],
      ["Deal", " gets agreed and finalized."],
      ["Earn", " a share of the project."],
    ],
    band: "Up to 10% on every finalized deal. Agreed for each project.",
    cta: "Become a referrer",
  },
  partners: {
    title: "Partners",
    logos: 5,
    logoLabel: "Logo",
    howTitle: "How to partner",
    howText: "You get introductions to our clients. We need a quality service and a clear way to reach you.",
    steps: ["Register", "Chat with us on WhatsApp", "Get approved"],
    cta: "Partner with us",
  },
  join: {
    title: "Tell us what you’re building.",
    lead: "Tap the bubble to start. We’ll continue the chat on WhatsApp.",
    bubble: "Let’s talk",
    bubbleLabel: "Let’s talk. Open the registration form",
    note: "WhatsApp, email and social handles go here once confirmed.",
  },
  footer: "Albert Nelly prototype for review. Copy, prices and the WhatsApp number are placeholders.",
  fab: "Chat with us",
  panel: {
    pickTitle: "What brings you here?",
    options: {
      hire: ["I want to hire Albert Nelly", "Tell us what you need designed or built"],
      refer: ["I want to refer someone", "Introduce a client and earn when the deal closes"],
      partner: ["I want to partner with Albert Nelly", "Work with us on client projects"],
      update: ["Just keep me updated", "News and offers, no chat needed"],
    } satisfies Record<LeadType, [string, string]>,
    formTitle: "Tell us a bit about you",
    updateTitle: "Where should we send updates?",
    labels: { name: "Name", email: "Email", wa: "WhatsApp number", service: "What do you need?", business: "Business name", category: "Category" },
    countryCodes: ["+234", "+233", "+44", "+1"],
    categories: ["Photography", "Flyer and graphic design", "Portrait art", "Event planning", "Something else"],
    birthday: { legend: "Birthday (optional)", day: "Day", month: "Month", hint: "So we can send you a birthday surprise." },
    consent: "I agree that Albert Nelly can contact me about this.",
    submit: "Continue to WhatsApp",
    submitUpdate: "Keep me updated",
    saving: "Saving…",
    retry: "Try again",
    netError: "We couldn’t save that. Please try again.",
    errors: {
      name: "Add your name so we know who to greet.",
      email: "That email looks incomplete. Try name@example.com.",
      wa: "Enter your WhatsApp number without the country code.",
      consent: "Tick the box so we can reach you.",
    },
    done: { title: "You’re in.", back: "Welcome back.", opening: "Opening WhatsApp in", button: "Open WhatsApp", hint: "WhatsApp can’t send the message for you. When it opens, tap Send so our team sees it.", fallback: "Didn’t open? Tap the button above, or copy our number and message us.", copy: "Copy", copied: "Copied" },
    updated: { title: "Thank you.", text: "We’ll send news and offers to your inbox. There is no WhatsApp step for this one.", close: "Close" },
    back: "Back",
    close: "Close",
  },
} as const;
