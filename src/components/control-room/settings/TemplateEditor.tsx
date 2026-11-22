"use client";

import { useRef } from "react";
import { fill, insertToken, sampleValues, VARIABLES, type TemplateKind } from "@/lib/control-room/templates";
import { Field, inputCls } from "../ui/Field";

/** A text box with buttons that insert variables like {name} where the cursor is, and a live preview with sample values. */
export function TemplateEditor({ id, label, hint, value, onChange, kind, discount, disabled, rows = 3 }: {
  id: string; label: string; hint?: string; value: string; onChange: (v: string) => void; kind: TemplateKind; discount?: number; disabled?: boolean; rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const insert = (token: string) => {
    const el = ref.current;
    const { text, caret } = insertToken(value, token, el?.selectionStart ?? value.length, el?.selectionEnd ?? value.length);
    onChange(text);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };
  return (
    <Field id={id} label={label} hint={hint}>
      <textarea ref={ref} id={id} rows={rows} className={`${inputCls} py-2.5`} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      {!disabled && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink/70">Insert:</span>
          {VARIABLES[kind].map((v) => (
            <button key={v.token} type="button" onClick={() => insert(v.token)} className="min-h-9 rounded-full border border-line bg-mint px-3 text-sm font-semibold text-deep">
              {v.label} <span className="font-normal">{v.token}</span>
            </button>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-line bg-cloud p-3 text-sm"><span className="font-semibold">Preview: </span>{fill(value, sampleValues(kind, discount))}</div>
    </Field>
  );
}
