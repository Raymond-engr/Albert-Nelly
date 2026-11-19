import { packages, runningCosts } from "@/data/packages";
import { services } from "@/data/services";
import { site } from "@/data/site";
import { work } from "@/data/work";
import type {
  Activity, Campaign, Db, Deal, DealStage, Lead, LeadStatus, LeadType, PackageTier, Payment, PaymentCategory,
  PriceDisplay, Referrer, Staff,
} from "./types";

/**
 * Demo data. Everything here is invented (names, amounts, dates are relative to today).
 * TODO(integration): delete this file when the real database is connected. Service, package, work and
 * running-cost rows reuse the copy from src/data so the prototype matches the live site.
 */
const day = (ago: number, hour = 10, min = 0) => {
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  d.setDate(d.getDate() - ago);
  return d.toISOString();
};
const ahead = (n: number, hour = 9) => day(-n, hour);
const birthday = (inDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + inDays);
  return { birthDay: d.getDate(), birthMonth: d.getMonth() + 1 };
};

const staff: Staff[] = [
  { id: "staff_owner", name: "Albert Nwosu", email: "albert@albertnelly.example", role: "owner", status: "active", lastSeen: day(0, 8) },
  { id: "staff_finance", name: "Folake Adebayo", email: "folake@albertnelly.example", role: "finance", status: "active", lastSeen: day(1, 16) },
  { id: "staff_sales", name: "Tobi Mensah", email: "tobi@albertnelly.example", role: "sales", status: "active", lastSeen: day(0, 9) },
  { id: "staff_content", name: "Zainab Kareem", email: "zainab@albertnelly.example", role: "content", status: "active", lastSeen: day(2, 12) },
  { id: "staff_sales2", name: "Emeka Obi", email: "emeka@albertnelly.example", role: "sales", status: "invited", lastSeen: null },
];

const lead = (n: number, ago: number, type: LeadType, name: string, service: string | null, source: string, status: LeadStatus, extra: Partial<Lead> = {}): Lead => ({
  id: `lead_${n}`,
  createdAt: day(ago, 8 + (n % 9), (n * 7) % 60),
  type,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
  whatsapp: type === "update" ? null : `23480${String(30000000 + n * 1234567).slice(0, 8)}`,
  service,
  business: null,
  category: null,
  birthDay: null,
  birthMonth: null,
  context: null,
  source,
  status,
  notes: "",
  tags: [],
  dealId: null,
  ownerId: null,
  ...extra,
});

const leads: Lead[] = [
  lead(1, 0, "hire", "Adaeze Okafor", "School Websites", "School package", "new", { context: "Smart School Portal", tags: ["school"] }),
  lead(2, 0, "hire", "Tunde Bakare", "UI/UX Design", "Service card", "new", { context: "UI/UX Design" }),
  lead(3, 1, "refer", "Ngozi Eze", null, "Referral section", "new"),
  lead(4, 1, "hire", "Ibrahim Musa", "Web and Mobile Development", "Service card", "contacted", { context: "Web and Mobile Development", ownerId: "staff_sales", notes: "Wants a delivery app. Asked for a call on Thursday." }),
  lead(5, 2, "partner", "Funke Adeyemi", null, "Partners section", "new", { business: "Lekki Lens Studio", category: "Photography" }),
  lead(6, 3, "update", "Chinedu Obi", null, "Join section", "new", birthday(3)),
  lead(7, 4, "hire", "Aisha Bello", "Graphics Design", "Hero button", "contacted", { ownerId: "staff_sales", tags: ["brand kit"] }),
  lead(8, 6, "hire", "Emeka Nwosu", "School Websites", "School package", "deal", { context: "Starter", dealId: "deal_1", ownerId: "staff_sales", tags: ["school"] }),
  lead(9, 8, "hire", "Kemi Ojo", "Art and Painting", "Service card", "deal", { context: "Art and Painting", dealId: "deal_2", ownerId: "staff_sales" }),
  lead(10, 10, "partner", "Segun Balogun", null, "Partners section", "contacted", { business: "Balogun Prints", category: "Flyer design" }),
  lead(11, 12, "update", "Bisi Ogunleye", null, "Floating button", "archived", birthday(9)),
  lead(12, 15, "hire", "Uche Anya", "Web and Mobile Development", "Floating button", "deal", { dealId: "deal_3", ownerId: "staff_sales", tags: ["app"] }),
  lead(13, 18, "refer", "Hauwa Sani", null, "Referral section", "contacted"),
  lead(14, 22, "update", "Dayo Coker", null, "Join section", "new", birthday(21)),
];

const deal = (n: number, title: string, client: string, service: string, stage: DealStage, agreed: number, extra: Partial<Deal> = {}): Deal => ({
  id: `deal_${n}`, title, client, service, leadId: null, stage, agreed, referrerId: null, commissionRate: null,
  ownerId: "staff_sales", createdAt: day(30 - n * 3), updatedAt: day(n % 5), notes: "", ...extra,
});
const deals: Deal[] = [
  deal(1, "Starter school website", "Bright Minds School", "School Websites", "progress", 420000, { leadId: "lead_8", referrerId: "ref_1", commissionRate: 10 }),
  deal(2, "Wedding portrait series", "Kemi Ojo", "Art and Painting", "deposit", 180000, { leadId: "lead_9" }),
  deal(3, "Table booking app", "Uche Anya", "Web and Mobile Development", "quote", 1500000, { leadId: "lead_12", referrerId: "ref_2", commissionRate: 7 }),
  deal(4, "Brand kit", "Ola Bakes", "Graphics Design", "conversation", 85000),
  deal(5, "Smart School Portal", "Greenfield Academy", "School Websites", "delivered", 2400000, { referrerId: "ref_1", commissionRate: 10, createdAt: day(75) }),
  deal(6, "Landing page", "Zenith Foods", "UI/UX Design", "closed", 350000, { createdAt: day(60) }),
  deal(7, "App redesign", "Kola Tech", "UI/UX Design", "lost", 600000, { notes: "Budget did not fit." }),
  deal(8, "Portrait commission", "Mrs. Adeyemi", "Art and Painting", "new", 0),
];

const pay = (n: number, dealId: string | null, direction: "in" | "out", amount: number, ago: number, category: PaymentCategory, note: string, by = "staff_finance"): Payment => ({
  id: `pay_${n}`, dealId, direction, amount, date: day(ago, 11), category, note, recordedBy: by,
});
const payments: Payment[] = [
  pay(1, "deal_1", "in", 210000, 12, "deposit", "50% deposit, bank transfer"),
  pay(2, "deal_2", "in", 90000, 5, "deposit", "50% deposit, bank transfer"),
  pay(3, "deal_5", "in", 1200000, 60, "deposit", "First instalment"),
  pay(4, "deal_5", "in", 800000, 30, "balance", "Second instalment"),
  pay(5, "deal_5", "in", 400000, 6, "balance", "Final instalment"),
  pay(6, "deal_5", "out", 120000, 4, "commission", "Half of Ngozi Eze's commission"),
  pay(7, "deal_6", "in", 350000, 40, "balance", "Paid in full"),
  pay(8, null, "out", 45000, 3, "expense", "Hosting renewal"),
  pay(9, null, "out", 60000, 10, "expense", "Partner photographer fee"),
  pay(10, null, "out", 15000, 20, "expense", "Domain renewal"),
  pay(11, null, "in", 450000, 100, "other", "Earlier project"),
  pay(12, null, "in", 520000, 130, "other", "Earlier project"),
  pay(13, null, "in", 380000, 160, "other", "Earlier project"),
  pay(14, null, "out", 90000, 105, "expense", "Software subscriptions"),
  pay(15, null, "out", 70000, 135, "expense", "Software subscriptions"),
];

const referrers: Referrer[] = [
  { id: "ref_1", name: "Ngozi Eze", email: "ngozi.eze@example.com", whatsapp: "2348031234567", rate: 10, status: "active", joinedAt: day(120) },
  { id: "ref_2", name: "Hauwa Sani", email: "hauwa.sani@example.com", whatsapp: "2348051234567", rate: 7, status: "active", joinedAt: day(40) },
  { id: "ref_3", name: "Funmi Alade", email: "funmi.alade@example.com", whatsapp: "2348071234567", rate: 5, status: "active", joinedAt: day(20) },
  { id: "ref_4", name: "Peter Okon", email: "peter.okon@example.com", whatsapp: "2348091234567", rate: 8, status: "paused", joinedAt: day(200) },
];

const campaigns: Campaign[] = [
  { id: "camp_1", name: "Welcome email", subject: "Welcome to Albert Nelly", template: "welcome", audience: "New updates sign-ups", audienceSize: 212, status: "automated", scheduledFor: null, sentAt: day(1), stats: { delivered: 212, opened: 131, clicked: 38 }, body: "Thanks for joining. Here is what we do." },
  { id: "camp_2", name: "Back-to-school packages", subject: "Is your school website ready for the new term?", template: "promo", audience: "Hire and updates leads", audienceSize: 188, status: "scheduled", scheduledFor: ahead(5), sentAt: null, stats: null, body: "Compare our three school packages." },
  { id: "camp_3", name: "Birthday emails", subject: "Happy birthday from Albert Nelly", template: "birthday", audience: "Birthdays today", audienceSize: 41, status: "automated", scheduledFor: null, sentAt: day(2), stats: { delivered: 41, opened: 30, clicked: 12 }, body: "A 10% birthday offer and four partner ideas." },
  { id: "camp_4", name: "Partner spotlight", subject: "Meet Lekki Lens Studio", template: "promo", audience: "All leads", audienceSize: 305, status: "draft", scheduledFor: null, sentAt: null, stats: null, body: "" },
  { id: "camp_5", name: "Year-end thank-you", subject: "Thank you for a great year", template: "promo", audience: "All leads", audienceSize: 305, status: "sent", scheduledFor: null, sentAt: day(28), stats: { delivered: 301, opened: 172, clicked: 44 }, body: "A short thank-you from the team." },
  { id: "camp_6", name: "Referral program reminder", subject: "Earn up to 10% when you introduce a client", template: "promo", audience: "Referrers", audienceSize: 57, status: "scheduled", scheduledFor: ahead(12), sentAt: null, stats: null, body: "How the referral program works." },
];

const PRICES: PriceDisplay[] = [
  { kind: "none" }, { kind: "from", amount: 150000 }, { kind: "custom" }, { kind: "range", min: 20000, max: 80000 }, { kind: "perStudent", amount: 1500 },
];
const PACKAGE_PRICES: PriceDisplay[] = [{ kind: "exact", amount: 250000 }, { kind: "from", amount: 600000 }, { kind: "custom" }];
const COSTS = [12000, 60000, 90000, 150000];

const activity: Activity[] = [
  { id: "act_1", at: day(0, 9, 12), actorId: "staff_sales", action: "Moved deal to In progress", target: "Starter school website" },
  { id: "act_2", at: day(0, 8, 40), actorId: "staff_owner", action: "Signed in", target: "" },
  { id: "act_3", at: day(1, 16, 5), actorId: "staff_finance", action: "Recorded a payment of ₦400,000", target: "Smart School Portal" },
  { id: "act_4", at: day(2, 12, 30), actorId: "staff_content", action: "Scheduled a campaign", target: "Back-to-school packages" },
  { id: "act_5", at: day(3, 10, 15), actorId: "staff_sales", action: "Turned a lead into a deal", target: "Kemi Ojo" },
  { id: "act_6", at: day(4, 15, 0), actorId: "staff_owner", action: "Changed the price display", target: "UI/UX Design" },
  { id: "act_7", at: day(5, 11, 22), actorId: "staff_finance", action: "Recorded a payment of ₦90,000", target: "Wedding portrait series" },
  { id: "act_8", at: day(7, 9, 50), actorId: "staff_owner", action: "Invited a team member", target: "Emeka Obi" },
];

export function seedDb(): Db {
  return {
    staff,
    leads,
    deals,
    payments,
    campaigns,
    services: services.map((s, i) => ({
      id: `svc_${i + 1}`, title: s.title, description: s.description, audience: s.audience, badge: s.badge ?? "", scene: s.scene,
      price: PRICES[i] ?? { kind: "none" }, published: true,
    })),
    packages: packages.map((p, i): PackageTier => ({
      id: `pkg_${i + 1}`, name: p.name, description: p.description, audience: p.audience, price: PACKAGE_PRICES[i] ?? { kind: "custom" },
      featured: !!p.featured, features: [...p.features], more: [...p.more],
    })),
    runningCosts: runningCosts.map((c, i) => ({ id: `cost_${i + 1}`, item: c.item, amount: COSTS[i] ?? 0 })),
    work: work.map((w, i) => ({ id: `work_${i + 1}`, category: w.category, title: w.title, challenge: w.challenge, result: w.result, published: true })),
    partners: [
      { id: "par_1", name: "Lekki Lens Studio", category: "Photography", note: "Event and portrait photography.", link: "https://example.com/lekki-lens", status: "active", published: true },
      { id: "par_2", name: "Balogun Prints", category: "Flyer design", note: "Birthday and event flyers.", link: "https://example.com/balogun-prints", status: "active", published: true },
      { id: "par_3", name: "Studio Ife", category: "Portrait art", note: "Hand-painted portraits.", link: "https://example.com/studio-ife", status: "active", published: true },
      { id: "par_4", name: "Eventful by Tola", category: "Event planning", note: "Surprise events.", link: "", status: "pending", published: false },
    ],
    referrers,
    templates: [
      { id: "tpl_hire", type: "hire", label: "Hire", body: "Hello Albert Nelly, my name is {name}. I’d like to talk about {service}. I found you through your website." },
      { id: "tpl_refer", type: "refer", label: "Refer", body: "Hello Albert Nelly, I’m {name}. I’d like to refer a client to you and join the referral program." },
      { id: "tpl_partner", type: "partner", label: "Partner", body: "Hello Albert Nelly, I’m {name} from {business} ({category}). I’d like to become a partner." },
      { id: "tpl_update", type: "update", label: "Updates", body: "Welcome, {name}. We’ll send you news and the odd surprise. Nothing else." },
      { id: "tpl_birthday", type: "birthday", label: "Birthday", body: "Happy birthday, {name}! Reply on WhatsApp to claim your {discount}% birthday offer." },
    ],
    settings: { whatsappNumber: site.whatsappDisplay, birthdayDiscount: 10, commissionMin: 5, commissionMax: 10 },
    activity,
  };
}
