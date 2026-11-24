import { NOT_SURE } from "@/data/registration";
import { normalizeWa } from "@/lib/validation";
import type { LeadPayload, LeadResult, LeadType, LeadValues } from "@/types/lead";

export function toPayload(type: LeadType, v: LeadValues, ctx: string): LeadPayload {
  let ref: string | null = null;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    ref = params.get("ref");
  }

  return {
    type,
    name: v.name.trim(),
    email: v.email.trim().toLowerCase(),
    whatsapp: type === "update" ? null : normalizeWa(v.cc, v.wa),
    service: type === "hire" && v.service && v.service !== NOT_SURE ? v.service : null,
    business: type === "partner" ? v.business.trim() : null,
    category: type === "partner" ? v.category : null,
    birthDay: v.day ? Number(v.day) : null,
    birthMonth: v.month ? Number(v.month) : null,
    consent: v.consent,
    context: ctx || null,
    company: v.company,
    ref,
  };
}

/** The only place the UI talks to the backend. Swap the internals, keep the signature. */
export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  try {
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; returning?: boolean } | null;
    if (!res.ok || !json?.ok) return { ok: false, error: "We couldn’t save that. Please try again." };
    return { ok: true, returning: Boolean(json.returning) };
  } catch {
    return { ok: false, error: "We couldn’t save that. Please try again." };
  }
}
