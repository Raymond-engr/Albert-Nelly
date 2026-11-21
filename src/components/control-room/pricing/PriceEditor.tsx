"use client";

import { useState } from "react";
import { PRICE_KINDS } from "@/lib/control-room/price";
import { parseNaira } from "@/lib/control-room/labels";
import type { PriceDisplay } from "@/lib/control-room/types";
import { Field, inputCls } from "../ui/Field";

const text = (n: number) => (n ? String(n) : "");

/**
 * Chooses how a price is shown (exact, from, range, per student per term, custom quote, none) and edits its numbers.
 * Calls onChange on every keystroke with the price and whether the numbers are valid. Remount it (key) to reset.
 */
export function PriceEditor({ value, onChange, disabled, id }: { value: PriceDisplay; onChange: (p: PriceDisplay, valid: boolean) => void; disabled?: boolean; id: string }) {
  const [kind, setKind] = useState<PriceDisplay["kind"]>(value.kind);
  const [a, setA] = useState(text("amount" in value ? value.amount : "min" in value ? value.min : 0));
  const [lo, setLo] = useState(text("min" in value ? value.min : 0));
  const [hi, setHi] = useState(text("max" in value ? value.max : 0));
  const [error, setError] = useState("");

  const emit = (k: PriceDisplay["kind"], amount: string, min: string, max: string) => {
    let price: PriceDisplay = { kind: "none" };
    let err = "";
    const one = parseNaira(amount);
    if (k === "exact" || k === "from" || k === "perStudent") {
      price = { kind: k, amount: one ?? 0 };
      if (one === null || one === 0) err = "Enter the amount in naira, for example 150000.";
    } else if (k === "range") {
      const l = parseNaira(min);
      const h = parseNaira(max);
      price = { kind: "range", min: l ?? 0, max: h ?? 0 };
      if (l === null || h === null || l === 0 || h === 0) err = "Enter both prices in naira.";
      else if (l >= h) err = "The lowest price must be below the highest.";
    } else {
      price = { kind: k };
    }
    setError(err);
    onChange(price, !err);
  };

  const meta = PRICE_KINDS.find((p) => p.kind === kind);
  return (
    <div className="flex flex-col gap-3">
      <Field id={`${id}-kind`} label="How the price is shown" hint={meta ? `Looks like: ${meta.example}` : undefined}>
        <select
          id={`${id}-kind`}
          className={inputCls}
          value={kind}
          disabled={disabled}
          onChange={(e) => {
            const k = e.target.value as PriceDisplay["kind"];
            setKind(k);
            emit(k, a, lo, hi);
          }}
        >
          {PRICE_KINDS.map((p) => <option key={p.kind} value={p.kind}>{p.label}</option>)}
        </select>
      </Field>
      {(kind === "exact" || kind === "from" || kind === "perStudent") && (
        <Field id={`${id}-amount`} label="Amount in naira" error={error}>
          <input id={`${id}-amount`} inputMode="numeric" className={inputCls} value={a} disabled={disabled} onChange={(e) => { setA(e.target.value); emit(kind, e.target.value, lo, hi); }} aria-invalid={!!error} />
        </Field>
      )}
      {kind === "range" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={`${id}-min`} label="Lowest price in naira" error={error}>
            <input id={`${id}-min`} inputMode="numeric" className={inputCls} value={lo} disabled={disabled} onChange={(e) => { setLo(e.target.value); emit(kind, a, e.target.value, hi); }} aria-invalid={!!error} />
          </Field>
          <Field id={`${id}-max`} label="Highest price in naira">
            <input id={`${id}-max`} inputMode="numeric" className={inputCls} value={hi} disabled={disabled} onChange={(e) => { setHi(e.target.value); emit(kind, a, lo, e.target.value); }} />
          </Field>
        </div>
      )}
    </div>
  );
}
