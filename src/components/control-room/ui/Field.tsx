import type { ReactNode } from "react";

/** Shared input look: 12 px corners, 44 px tall. Use with <input>, <select> and <textarea>. */
export const inputCls =
  "min-h-11 w-full rounded-xl border-[1.5px] border-line bg-paper px-3.5 text-[15px] text-ink placeholder:text-ink/50 focus:border-deep disabled:opacity-60";

/** Label, control, hint and error message. The control must use the same `id`. */
export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {children}
      {hint && !error && <div id={`${id}-hint`} className="text-sm text-ink/70">{hint}</div>}
      {error && <div id={`${id}-err`} role="alert" className="text-sm text-danger">{error}</div>}
    </div>
  );
}
