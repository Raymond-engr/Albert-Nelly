import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import { initials } from "@/lib/control-room/format";
import type { IconName } from "@/lib/control-room/types";
import { Icon } from "./Icon";

/* Small building blocks shared by every Control Room screen. Tokens and buttons come from main (globals.css, ui/Button). */

export type BtnVariant = "brand" | "outline" | "dark" | "sun" | "ghost" | "danger";
/** Class string for a button or a link that looks like one. Main's pill buttons, with a denser size for admin screens. */
export function btn(variant: BtnVariant = "outline", size: "sm" | "md" = "md", extra = "") {
  const sz = size === "sm" ? "!min-h-9 !px-4 !text-sm" : "!min-h-11 !px-5";
  const base =
    variant === "ghost" ? buttonClass("outline", false, "!border-transparent hover:!bg-mint")
    : variant === "danger" ? buttonClass("outline", false, "!border-danger !text-danger")
    : buttonClass(variant);
  return `${base} ${sz} ${extra}`.trim();
}

const TONES = {
  neutral: "bg-cloud text-ink",
  green: "bg-mint text-deep",
  sun: "bg-sun/25 text-ink",
  coral: "bg-coral/15 text-danger",
  dark: "bg-ink text-paper",
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <section className={`rounded-2xl border border-line bg-card ${pad ? "p-5" : ""} ${className}`}>{children}</section>;
}

export function CardHeader({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="mb-0 font-display text-base font-semibold tracking-normal">{title}</h2>
        {hint && <div className="text-sm text-ink/70">{hint}</div>}
      </div>
      {action}
    </div>
  );
}

export type StatProps = { label: string; value: string; hint?: string; icon: IconName; href?: string };
export function Stat({ label, value, hint, icon, href }: StatProps) {
  const body = (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-card p-4 transition hover:border-brand">
      <div className="flex items-center justify-between text-sm text-ink/70">
        <span>{label}</span>
        <Icon name={icon} size={18} />
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-ink/70">{hint}</div>}
    </div>
  );
  return href ? <Link href={href} className="block text-ink no-underline">{body}</Link> : body;
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="mb-1 font-display text-[28px] leading-tight font-bold sm:text-[32px]">{title}</h1>
        {description && <div className="text-[15px] text-ink/70">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({ icon = "search", title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-line bg-card px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-mint text-deep"><Icon name={icon} size={22} /></span>
      <h2 className="mb-0 font-display text-lg font-semibold tracking-normal">{title}</h2>
      {children && <div className="max-w-md text-[15px] text-ink/70">{children}</div>}
      {action}
    </div>
  );
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span aria-hidden="true" className="inline-grid shrink-0 place-items-center rounded-full bg-mint font-display text-xs font-bold text-deep" style={{ width: size, height: size }}>
      {initials(name)}
    </span>
  );
}

/** Row of a simple list card: avatar or icon, two lines of text, something on the right. */
export function ListRow({ href, lead, title, sub, right }: { href?: string; lead?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  const inner = (
    <>
      {lead}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>
        {sub && <span className="block truncate text-sm text-ink/70">{sub}</span>}
      </span>
      {right}
    </>
  );
  const cls = "flex items-center gap-3 py-3 text-ink no-underline";
  return href ? <Link href={href} className={`${cls} hover:bg-mint/50`}>{inner}</Link> : <div className={cls}>{inner}</div>;
}
