"use client";

import { useState, type FormEvent } from "react";
import { settingsApi, templatesApi } from "@/lib/control-room/admin-api";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import { waOk } from "@/lib/control-room/validate";
import type { LeadType, Settings } from "@/lib/control-room/types";
import { Field, inputCls } from "../ui/Field";
import { btn, Card, CardHeader, PageHeader } from "../ui/kit";
import { TemplateEditor } from "./TemplateEditor";

function GeneralForm({ settings }: { settings: Settings }) {
  const [wa, setWa] = useState(settings.whatsappNumber.replace(/\D/g, ""));
  const [discount, setDiscount] = useState(String(settings.birthdayDiscount));
  const [min, setMin] = useState(String(settings.commissionMin));
  const [max, setMax] = useState(String(settings.commissionMax));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const next: Record<string, string> = {};
    const d = Number(discount), lo = Number(min), hi = Number(max);
    const pctOk = (v: string, n: number) => v.trim() !== "" && !Number.isNaN(n) && n >= 0 && n <= 100;
    if (!waOk(wa)) next.wa = "Enter digits only, with the country code, for example 2348031234567.";
    if (!pctOk(discount, d) || !Number.isInteger(d)) next.discount = "Enter a whole number between 0 and 100.";
    if (!pctOk(min, lo)) next.min = "Enter a percentage between 0 and 100.";
    if (!pctOk(max, hi)) next.max = "Enter a percentage between 0 and 100.";
    else if (pctOk(min, lo) && lo > hi) next.max = "The highest rate must not be below the lowest.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await settingsApi.save({ whatsappNumber: `+${wa.replace(/\D/g, "")}`, birthdayDiscount: d, commissionMin: lo, commissionMax: hi });
      toast("Settings saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Business settings" />
      <form onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="s-wa" label="WhatsApp number" hint="Every WhatsApp button on the site opens a chat with this number." error={errors.wa}>
            <input id="s-wa" inputMode="tel" className={inputCls} value={wa} onChange={(e) => setWa(e.target.value)} aria-invalid={!!errors.wa} />
          </Field>
        </div>
        <Field id="s-disc" label="Birthday discount (percent)" error={errors.discount}><input id="s-disc" inputMode="numeric" className={inputCls} value={discount} onChange={(e) => setDiscount(e.target.value)} aria-invalid={!!errors.discount} /></Field>
        <div />
        <Field id="s-min" label="Usual commission, lowest (percent)" error={errors.min}><input id="s-min" inputMode="decimal" className={inputCls} value={min} onChange={(e) => setMin(e.target.value)} aria-invalid={!!errors.min} /></Field>
        <Field id="s-max" label="Usual commission, highest (percent)" error={errors.max}><input id="s-max" inputMode="decimal" className={inputCls} value={max} onChange={(e) => setMax(e.target.value)} aria-invalid={!!errors.max} /></Field>
        <div className="sm:col-span-2"><button type="submit" className={btn("brand")} disabled={saving} aria-busy={saving}>{saving ? "Saving…" : "Save settings"}</button></div>
      </form>
    </Card>
  );
}

const HINTS: Record<LeadType, string> = {
  hire: "The first WhatsApp message after someone chooses “I want to hire Albert Nelly”.",
  refer: "The first WhatsApp message from someone who wants to refer a client.",
  partner: "The first WhatsApp message from someone who wants to partner with you.",
  update: "The welcome email for people who only asked to be kept updated.",
};

function TemplatesForm() {
  const db = useDb();
  const list = db.templates.filter((t) => t.type !== "birthday");
  const [bodies, setBodies] = useState<Record<string, string>>(Object.fromEntries(list.map((t) => [t.id, t.body])));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (list.some((t) => (bodies[t.id] ?? "").trim().length < 10)) return setError("Every message needs at least a sentence.");
    setError("");
    setSaving(true);
    try {
      for (const t of list) if (bodies[t.id] !== t.body) await templatesApi.update(t.id, bodies[t.id]);
      toast("Message templates saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Message templates" hint="The words people see first. Use the buttons to insert their name and choices." />
      <form onSubmit={save} noValidate className="flex flex-col gap-6">
        {list.map((t) => (
          <TemplateEditor key={t.id} id={`tpl-${t.id}`} label={t.label} hint={HINTS[t.type as LeadType]} value={bodies[t.id] ?? ""} onChange={(v) => setBodies({ ...bodies, [t.id]: v })} kind={t.type as LeadType} />
        ))}
        {error && <div role="alert" className="text-sm text-danger">{error}</div>}
        <div><button type="submit" className={btn("brand")} disabled={saving} aria-busy={saving}>{saving ? "Saving…" : "Save templates"}</button></div>
      </form>
    </Card>
  );
}

/**
 * Owner only. TODO(integration): a single `settings` row and a `message_templates` table. The public site then reads the
 * WhatsApp number and the first-message templates from the database instead of NEXT_PUBLIC_WA_NUMBER and src/lib/whatsapp.ts
 * (see the handover, "Public site reads the database").
 */
export function SettingsScreen() {
  const db = useDb();
  const staff = useSession();
  if (!staff) return null;
  return (
    <>
      <PageHeader title="Settings" description="Numbers and messages used across the site and the emails." />
      <div className="flex max-w-4xl flex-col gap-6">
        <GeneralForm settings={db.settings} />
        <TemplatesForm />
      </div>
    </>
  );
}
