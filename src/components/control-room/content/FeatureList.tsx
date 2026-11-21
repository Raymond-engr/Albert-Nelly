"use client";

import { useState } from "react";
import { inputCls } from "../ui/Field";
import { btn } from "../ui/kit";

function swap<T>(items: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= items.length) return items;
  const copy = items.slice();
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

/** An editable checklist: edit in place, reorder, move to the other list, remove, add. Keyboard friendly (no drag and drop). */
export function FeatureList({ label, hint, items, onChange, otherLabel, onSend, disabled }: {
  label: string; hint?: string; items: string[]; onChange: (items: string[]) => void; otherLabel: string; onSend: (index: number) => void; disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, t]);
    setDraft("");
  };
  const small = btn("ghost", "sm", "!px-2 !text-xs");
  return (
    <fieldset className="m-0 min-w-0 rounded-xl border border-line p-3">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      {hint && <div className="mb-2 text-sm text-ink/70">{hint}</div>}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {items.length === 0 && <li className="text-sm text-ink/60">Nothing here yet.</li>}
        {items.map((f, i) => (
          <li key={i} className="flex flex-col gap-1.5 rounded-lg bg-mint/40 p-2">
            <input aria-label={`${label}, item ${i + 1}`} className={inputCls} value={f} disabled={disabled} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} />
            {!disabled && (
              <div className="flex flex-wrap gap-1">
                <button type="button" className={small} disabled={i === 0} onClick={() => onChange(swap(items, i, -1))}>Move up</button>
                <button type="button" className={small} disabled={i === items.length - 1} onClick={() => onChange(swap(items, i, 1))}>Move down</button>
                <button type="button" className={small} onClick={() => onSend(i)}>Move to {otherLabel}</button>
                <button type="button" className={`${small} !text-danger`} onClick={() => onChange(items.filter((_, k) => k !== i))}>Remove</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {!disabled && (
        <div className="mt-3 flex gap-2">
          <input aria-label={`Add to ${label}`} className={inputCls} placeholder="Add a feature" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
          <button type="button" className={btn("outline")} onClick={add}>Add</button>
        </div>
      )}
    </fieldset>
  );
}
