export const copy = {
  hero: {
    title: "Ideas, designed and built.",
    lead: "Albert Nelly designs and builds websites, apps, brands and art for founders, businesses and schools.",
    primary: "See what we do",
    secondary: "Start a conversation",
  },
  // Optional fields used by variant four ("From stroke to chat"). Other parts may ignore them.
  story: {
    lead: "Websites, apps, design and art for founders, schools and businesses.",
    scenes: [
      { label: "UI/UX design", title: "It starts with one stroke.", body: "We sketch the idea, shape the screens and test them before a single line of code." },
      { label: "Web and mobile development", title: "Then we make it real.", body: "One design, built for the phone in your hand and the browser on your desk." },
    ],
    talkLead: "Tap the bubble. A short chat, then WhatsApp.",
    alt: "A white canvas. A green brushstroke becomes a screen wireframe, then a phone and browser, then a speech bubble that says Let’s talk.",
  },
  about: {
    title: "Where art meets technology.",
    body: "We’re a small tech agency that treats every screen like a canvas. You talk to the people who design and build your project, and every price is a conversation.",
    facts: ["Five services, one team", "Priced in naira", "You can message us before you commit to anything"],
  },
  services: { title: "What we do." },
  schools: {
    title: "School packages.",
    lead: "Compare the three side by side. Running costs are below, so nothing surprises you later.",
    costsTitle: "Yearly running costs",
    more: "See all features",
    cta: "Talk about this package",
    aiTooltip: "Answers questions using the school’s own documents.",
  },
  work: { title: "Selected work.", lead: "A few projects, explained well. Placeholders until the real ones arrive." },
  referral: {
    title: "Introduce someone. Earn when the deal closes.",
    band: "Up to 10%",
    bandNote: "Agreed for each project.",
    cta: "Become a referrer",
  },
  partners: {
    title: "Our partners.",
    lead: "Photographers, designers, artists and planners we trust.",
    howTitle: "How to partner",
    howBody: "You get introductions to our clients and shared promotion. We need your portfolio, your rates and your contact details.",
    steps: ["Register", "Chat with us on WhatsApp", "Get approved"],
    cta: "Partner with us",
    tileNote: "Placeholder: what they do with Albert Nelly.",
    tileLink: "Visit site",
  },
  join: { title: "Tell us what you’re building.", lead: "A short form, then a WhatsApp chat with the team.", cta: "Let’s talk" },
} as const;
