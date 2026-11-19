const NGN = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

/** 1250000 -> "₦1,250,000" */
export const naira = (n: number) => NGN.format(n);
/** 1250000 -> "₦1.3M", 45000 -> "₦45K" */
export function compactNaira(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1_000_000) return `${sign}₦${(a / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (a >= 1_000) return `${sign}₦${Math.round(a / 1_000)}K`;
  return `${sign}₦${a}`;
}

export const shortDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const longDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const dayMonth = (day: number, month: number) =>
  new Date(2000, month - 1, day).toLocaleDateString("en-GB", { day: "numeric", month: "long" });

export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
export function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const LEAD_TYPE_LABEL = { hire: "Hire", refer: "Referrer", partner: "Partner", update: "Updates" } as const;
