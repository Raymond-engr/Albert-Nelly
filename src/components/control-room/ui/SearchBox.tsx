import { inputCls } from "./Field";
import { Icon } from "./Icon";

export function SearchBox({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string }) {
  return (
    <div className="relative min-w-0">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/60"><Icon name="search" size={18} /></span>
      <input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} pl-10`} />
    </div>
  );
}
