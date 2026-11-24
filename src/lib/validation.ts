import type { LeadPayload, LeadType, LeadValues } from "@/types/lead";

export type FieldKey = "name" | "email" | "wa" | "business" | "consent";
export type FieldErrors = Partial<Record<FieldKey, string>>;

export const LEAD_TYPES: LeadType[] = ["hire", "refer", "partner", "update"];
const EMAIL = /^\S+@\S+\.\S+$/;

/** Digits only, country code included, leading zero of the local number removed. */
export function normalizeWa(cc: string, local: string): string {
  return cc.replace(/\D/g, "") + local.replace(/\D/g, "").replace(/^0+/, "");
}

/** Client-side validation. Messages are written for visitors, not developers. */
export function validateValues(v: LeadValues, type: LeadType): FieldErrors {
  const e: FieldErrors = {};
  if (v.name.trim().length < 2) e.name = "Tell us your name.";
  if (!EMAIL.test(v.email.trim())) e.email = "That email looks incomplete. Check the @ and the dot.";
  if (type !== "update" && !/^\d{7,11}$/.test(v.wa.replace(/\D/g, "").replace(/^0+/, ""))) e.wa = "Enter your number without the country code.";
  if (type === "partner" && !v.business.trim()) e.business = "Tell us your business name.";
  if (!v.consent) e.consent = "Please tick this so we can contact you.";
  return e;
}

const str = (x: unknown, max: number): string | null => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);
const int = (x: unknown, min: number, max: number): number | null => (Number.isInteger(x) && (x as number) >= min && (x as number) <= max ? (x as number) : null);

/** Server-side validation. Never trust the client. */
export function validatePayload(raw: unknown): { ok: true; data: LeadPayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid request." };
  const b = raw as Record<string, unknown>;
  const type = b.type as LeadType;
  if (!LEAD_TYPES.includes(type)) return { ok: false, error: "Unknown type." };
  const name = str(b.name, 120);
  const email = str(b.email, 200)?.toLowerCase() ?? null;
  if (!name || name.length < 2) return { ok: false, error: "Name is required." };
  if (!email || !EMAIL.test(email)) return { ok: false, error: "Email is invalid." };
  const whatsapp = str(b.whatsapp, 20)?.replace(/\D/g, "") ?? null;
  if (type !== "update" && (!whatsapp || whatsapp.length < 9 || whatsapp.length > 15)) return { ok: false, error: "WhatsApp number is invalid." };
  if (b.consent !== true) return { ok: false, error: "Consent is required." };
  return {
    ok: true,
    data: {
      type, name, email,
      whatsapp: whatsapp || null,
      service: str(b.service, 120),
      business: str(b.business, 160),
      category: str(b.category, 80),
      birthDay: int(b.birthDay, 1, 31),
      birthMonth: int(b.birthMonth, 1, 12),
      consent: true,
      context: str(b.context, 160),
      company: typeof b.company === "string" ? b.company : "",
    },
  };
}
