import type { Campaign, Lead, LeadType } from "./types";

/** Message templates, their variables and the campaign audience helpers. */
export type TemplateKind = LeadType | "birthday";
type Variable = { token: string; label: string; sample: string };
const NAME: Variable = { token: "{name}", label: "Name", sample: "Ada" };

export const VARIABLES: Record<TemplateKind, Variable[]> = {
  hire: [NAME, { token: "{service}", label: "Service", sample: "UI/UX Design" }],
  refer: [NAME],
  partner: [NAME, { token: "{business}", label: "Business", sample: "Lekki Lens Studio" }, { token: "{category}", label: "Category", sample: "Photography" }],
  update: [NAME],
  birthday: [NAME, { token: "{discount}", label: "Discount", sample: "10" }],
};

/** Replaces {name}-style tokens. Unknown tokens are left as they are. */
export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
}
export function sampleValues(kind: TemplateKind, discount?: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of VARIABLES[kind]) out[v.token.slice(1, -1)] = v.sample;
  if (discount !== undefined) out.discount = String(discount);
  return out;
}
/** Puts a token where the cursor is (or replaces the selection). Returns the new text and where the cursor goes. */
export function insertToken(value: string, token: string, start: number, end: number) {
  return { text: value.slice(0, start) + token + value.slice(end), caret: start + token.length };
}

export const CAMPAIGN_DEFAULTS: Record<Campaign["template"], { subject: string; body: string }> = {
  welcome: { subject: "Welcome to Albert Nelly", body: "Hi {name},\n\nThanks for joining. We design and build websites, apps, brands and art for founders, businesses and schools.\n\nIf you ever want to talk about an idea, message us on WhatsApp." },
  promo: { subject: "", body: "Hi {name},\n\nWrite the news here in two or three short paragraphs.\n\nPrices are always a conversation, so just message us on WhatsApp." },
  birthday: { subject: "Happy birthday from Albert Nelly", body: "Hi {name},\n\nWishing you a wonderful birthday from all of us. Here is a small gift: {discount}% off your next project." },
};

export const AUDIENCE_TYPES: { id: LeadType; label: string }[] = [
  { id: "hire", label: "People who want to hire us" },
  { id: "refer", label: "Referrers" },
  { id: "partner", label: "Partners" },
  { id: "update", label: "People who asked for updates" },
];
const SHORT: Record<LeadType, string> = { hire: "Hire", refer: "Referrers", partner: "Partners", update: "Updates" };
const isType = (s: string): s is LeadType => s in SHORT;

/** TODO(integration): store the audience as a real column (audience_types text[]) instead of a comma-separated string. */
export function audienceTypes(audience: string): LeadType[] {
  const t = audience.split(",").map((s) => s.trim()).filter(isType);
  return t.length ? t : AUDIENCE_TYPES.map((a) => a.id);
}
export function audienceLabel(audience: string): string {
  const parts = audience.split(",").map((s) => s.trim());
  return parts.every(isType) ? parts.map((p) => SHORT[p as LeadType]).join(", ") : audience;
}
export const audienceCount = (leads: Lead[], types: LeadType[]) =>
  new Set(leads.filter((l) => types.includes(l.type) && l.status !== "archived").map((l) => l.email)).size;
