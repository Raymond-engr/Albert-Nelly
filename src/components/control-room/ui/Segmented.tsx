/** A row of toggle buttons for filters and tabs. Works with the keyboard and screen readers (aria-pressed). */
export function Segmented<T extends string>({ label, options, value, onChange }: {
  label: string; options: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-card p-1">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`min-h-9 rounded-full px-3.5 text-sm font-semibold ${on ? "bg-ink text-paper" : "text-ink hover:bg-mint"}`}
          >
            {o.label}
            {o.count !== undefined && <span className="ml-1.5 text-xs opacity-70">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
