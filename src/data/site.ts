const digits = (process.env.NEXT_PUBLIC_WA_NUMBER ?? "2340000000000").replace(/\D/g, "");

export const site = {
  name: "Albert Nelly",
  whatsappNumber: digits,
  whatsappDisplay: `+${digits}`,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@yourdomain.com",
  social: process.env.NEXT_PUBLIC_SOCIAL_HANDLE ?? "@albertnelly",
  nav: [
    { href: "#services", label: "Services" },
    { href: "#schools", label: "Schools" },
    { href: "#work", label: "Work" },
    { href: "#referral", label: "Referral" },
    { href: "#partners", label: "Partners" },
  ],
} as const;
