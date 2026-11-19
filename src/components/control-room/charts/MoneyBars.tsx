import { naira } from "@/lib/control-room/format";
import { Icon } from "../ui/Icon";

/**
 * Money in (solid green) and money out (striped dark) per month. The two are told apart by pattern and icon,
 * not by colour alone. Pure SVG, no chart library.
 */
export function MoneyBars({ data }: { data: { label: string; in: number; out: number }[] }) {
  const W = 360, H = 170, pad = 22, base = H - 24;
  const max = Math.max(1, ...data.flatMap((d) => [d.in, d.out]));
  const slot = (W - 2 * pad) / data.length;
  const bw = Math.min(16, slot / 2 - 3);
  const h = (v: number) => (v / max) * (H - 60);
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Money in and money out for the last six months" className="h-auto w-full">
        <defs>
          <pattern id="cr-out" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" className="fill-paper" />
            <rect width="2.5" height="6" className="fill-ink" />
          </pattern>
        </defs>
        <line x1={pad} x2={W - pad} y1={base} y2={base} className="stroke-line" />
        {data.map((d, i) => {
          const cx = pad + slot * i + slot / 2;
          return (
            <g key={d.label}>
              <rect x={cx - bw - 1} y={base - h(d.in)} width={bw} height={h(d.in)} rx="3" className="fill-brand" />
              <rect x={cx + 1} y={base - h(d.out)} width={bw} height={h(d.out)} rx="3" fill="url(#cr-out)" className="stroke-ink" strokeWidth="1" />
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" className="fill-ink" opacity="0.7">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/70">
        <span className="inline-flex items-center gap-1"><Icon name="arrowDown" size={14} /> Money in (solid)</span>
        <span className="inline-flex items-center gap-1"><Icon name="arrowUp" size={14} /> Money out (striped)</span>
      </figcaption>
      <table className="sr-only">
        <caption>Money in and out per month</caption>
        <thead><tr><th>Month</th><th>In</th><th>Out</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.label}><td>{d.label}</td><td>{naira(d.in)}</td><td>{naira(d.out)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
