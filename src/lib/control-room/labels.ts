import type { DealStage, LeadStatus, PaymentCategory } from "./types";

/** Labels, badge tones and small helpers shared by the Leads and Deals screens. */
export type ToneName = "neutral" | "green" | "sun" | "coral" | "dark";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = { new: "New", contacted: "Contacted", deal: "In a deal", archived: "Archived" };
export const LEAD_STATUS_TONE: Record<LeadStatus, ToneName> = { new: "green", contacted: "sun", deal: "dark", archived: "neutral" };
export const STAGE_TONE: Record<DealStage, ToneName> = {
  new: "neutral", conversation: "sun", quote: "sun", deposit: "green", progress: "green", delivered: "dark", closed: "green", lost: "coral",
};
export const PAYMENT_CATEGORY_LABEL: Record<PaymentCategory, string> = {
  deposit: "Deposit", balance: "Balance", commission: "Commission", expense: "Expense", other: "Other",
};

/** Today as yyyy-mm-dd, for <input type="date">. Kept here so screens do not call Date during render. */
export function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "1,250,000", "₦ 1250000" or "" -> a whole number of naira. Returns null when the text is not a number. */
export function parseNaira(text: string): number | null {
  const t = text.replace(/[\s,₦]/g, "");
  if (t === "") return 0;
  return /^\d+$/.test(t) && Number.isSafeInteger(Number(t)) ? Number(t) : null;
}
