"use client";

import { useState, type FormEvent } from "react";
import { leadsApi } from "@/lib/control-room/leads-api";
import { dealsApi } from "@/lib/control-room/deals-api";
import { parseNaira } from "@/lib/control-room/labels";
import { useDb } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import type { Deal, Lead } from "@/lib/control-room/types";
import { Field, inputCls } from "../ui/Field";
import { Overlay } from "../ui/Overlay";
import { btn } from "../ui/kit";

function NewDealForm({ lead, onClose, onCreated }: { lead: Lead | null; onClose: () => void; onCreated?: (d: Deal) => void }) {
  const db = useDb();
  const [title, setTitle] = useState(lead ? `${lead.service ?? "Project"} for ${lead.name}` : "");
  const [client, setClient] = useState(lead?.name ?? "");
  const [service, setService] = useState(lead?.service ?? db.services[0]?.title ?? "");
  const [agreed, setAgreed] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const price = parseNaira(agreed);
    if (title.trim().length < 3) next.title = "Give the deal a short name.";
    if (client.trim().length < 2) next.client = "Who is the client?";
    if (price === null) next.agreed = "Use numbers only, for example 250000.";
    setErrors(next);
    if (Object.keys(next).length || price === null) return;
    setSaving(true);
    const input = { title: title.trim(), client: client.trim(), service, agreed: price };
    const deal = lead ? await leadsApi.convertToDeal(lead.id, input) : await dealsApi.create(input);
    setSaving(false);
    toast("Deal created.");
    onCreated?.(deal);
    onClose();
  };

  const services = db.services.some((s) => s.title === service) ? db.services.map((s) => s.title) : [service, ...db.services.map((s) => s.title)];
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="nd-title" label="Deal name" error={errors.title}>
        <input id="nd-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} />
      </Field>
      <Field id="nd-client" label="Client" error={errors.client}>
        <input id="nd-client" className={inputCls} value={client} onChange={(e) => setClient(e.target.value)} aria-invalid={!!errors.client} />
      </Field>
      <Field id="nd-service" label="Service">
        <select id="nd-service" className={inputCls} value={service} onChange={(e) => setService(e.target.value)}>
          {services.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field id="nd-agreed" label="Agreed price in naira" hint="Leave empty if the price is not agreed yet." error={errors.agreed}>
        <input id="nd-agreed" inputMode="numeric" className={inputCls} value={agreed} onChange={(e) => setAgreed(e.target.value)} placeholder="250000" aria-invalid={!!errors.agreed} />
      </Field>
      <div className="flex justify-end gap-2">
        <button type="button" className={btn("ghost")} onClick={onClose}>Cancel</button>
        <button type="submit" className={btn("brand")} disabled={saving}>{saving ? "Saving…" : "Create deal"}</button>
      </div>
    </form>
  );
}

/** Used from the board ("New deal") and from a lead ("Turn into a deal"). */
export function NewDealModal({ open, onClose, lead, onCreated }: { open: boolean; onClose: () => void; lead?: Lead | null; onCreated?: (d: Deal) => void }) {
  return (
    <Overlay open={open} onClose={onClose} variant="modal" title={lead ? "Turn this lead into a deal" : "New deal"}>
      <NewDealForm lead={lead ?? null} onClose={onClose} onCreated={onCreated} />
    </Overlay>
  );
}
