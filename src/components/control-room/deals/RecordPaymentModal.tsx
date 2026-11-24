"use client";

import { useState, type FormEvent } from "react";
import { naira } from "@/lib/control-room/format";
import { paymentsApi } from "@/lib/control-room/deals-api";
import { PAYMENT_CATEGORY_LABEL, parseNaira, todayInput } from "@/lib/control-room/labels";
import { toast } from "@/lib/control-room/toast";
import type { Deal, PaymentCategory } from "@/lib/control-room/types";
import { Field, inputCls } from "../ui/Field";
import { Overlay } from "../ui/Overlay";
import { Segmented } from "../ui/Segmented";
import { btn } from "../ui/kit";

export type PaymentSuggestion = { direction: "in" | "out"; category: PaymentCategory; amount: number };
const CATEGORIES: Record<"in" | "out", PaymentCategory[]> = { in: ["deposit", "balance", "other"], out: ["commission", "expense", "other"] };

function PaymentForm({ deal, remaining, suggestion, onClose }: { deal: Deal; remaining: number; suggestion?: PaymentSuggestion; onClose: () => void }) {
  const [direction, setDirection] = useState<"in" | "out">(suggestion?.direction ?? "in");
  const [category, setCategory] = useState<PaymentCategory>(suggestion?.category ?? "deposit");
  const [amount, setAmount] = useState(suggestion ? String(suggestion.amount) : "");
  const [date, setDate] = useState(todayInput);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const value = parseNaira(amount);
  const over = direction === "in" && value !== null && value > remaining && remaining > 0;

  const changeDirection = (d: "in" | "out") => {
    setDirection(d);
    setCategory(CATEGORIES[d][0]);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!value || value <= 0) next.amount = "Enter an amount above zero, in whole naira.";
    if (!date) next.date = "Pick the date of the payment.";
    else if (date > todayInput()) next.date = "The date can’t be in the future.";
    setErrors(next);
    if (Object.keys(next).length || !value) return;
    setSaving(true);
    try {
      await paymentsApi.record({ dealId: deal.id, direction, amount: value, category, date, note: note.trim() });
      toast(`${direction === "in" ? "Payment in" : "Payment out"} recorded.`);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="text-sm text-ink/70">For “{deal.title}”. Payments can’t be edited later. To fix a mistake, record a correcting payment.</div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Direction</span>
        <Segmented<"in" | "out"> label="Direction" value={direction} onChange={changeDirection} options={[{ value: "in", label: "Money in" }, { value: "out", label: "Money out" }]} />
      </div>
      <Field id="pay-amount" label="Amount in naira" error={errors.amount} hint={over ? `This is more than the ${naira(remaining)} still to collect.` : undefined}>
        <input id="pay-amount" inputMode="numeric" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!errors.amount} />
      </Field>
      <Field id="pay-category" label="Category">
        <select id="pay-category" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as PaymentCategory)}>
          {CATEGORIES[direction].map((c) => <option key={c} value={c}>{PAYMENT_CATEGORY_LABEL[c]}</option>)}
        </select>
      </Field>
      <Field id="pay-date" label="Date" error={errors.date}>
        <input id="pay-date" type="date" className={inputCls} value={date} max={todayInput()} onChange={(e) => setDate(e.target.value)} aria-invalid={!!errors.date} />
      </Field>
      <Field id="pay-note" label="Note (optional)">
        <input id="pay-note" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bank transfer, second instalment" />
      </Field>
      <div className="flex justify-end gap-2">
        <button type="button" className={btn("ghost")} onClick={onClose}>Cancel</button>
        <button type="submit" className={btn("brand")} disabled={saving}>{saving ? "Saving…" : "Record payment"}</button>
      </div>
    </form>
  );
}

/** TODO(integration): only owner and finance may call paymentsApi.record. The server must check, not just this screen. */
export function RecordPaymentModal({ open, onClose, deal, remaining, suggestion }: { open: boolean; onClose: () => void; deal: Deal; remaining: number; suggestion?: PaymentSuggestion }) {
  return (
    <Overlay open={open} onClose={onClose} variant="modal" title="Record a payment">
      <PaymentForm deal={deal} remaining={remaining} suggestion={suggestion} onClose={onClose} />
    </Overlay>
  );
}
