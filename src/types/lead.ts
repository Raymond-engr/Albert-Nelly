export type LeadType = "hire" | "refer" | "partner" | "update";

/** Everything the form holds while the visitor types. */
export type LeadValues = {
  name: string;
  email: string;
  cc: string;
  wa: string;
  service: string;
  business: string;
  category: string;
  day: string;
  month: string;
  consent: boolean;
  company: string; // honeypot: must stay empty
};

/** What is sent to /api/leads and validated again on the server. */
export type LeadPayload = {
  type: LeadType;
  name: string;
  email: string;
  whatsapp: string | null;
  service: string | null;
  business: string | null;
  category: string | null;
  birthDay: number | null;
  birthMonth: number | null;
  consent: boolean;
  context: string | null;
  company?: string;
};

export type LeadResult = { ok: true; returning: boolean } | { ok: false; error: string };
