/** An on/off toggle. Always pair it with visible text that says what the state is ("Shown on the site"). */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full border border-line transition ${checked ? "bg-brand" : "bg-cloud"} disabled:opacity-60`}
    >
      <span className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-paper shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}
