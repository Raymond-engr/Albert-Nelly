import { naira } from "./format";
import type { PriceDisplay } from "./types";

/**
 * The six ways a price can be shown on the site. `formatPrice` produces the exact line the Showroom shows.
 * TODO(integration): main's data/services.ts and data/packages.ts hold the price as a plain string today.
 * After the backend exists, build that string with formatPrice() on the server (see the handover, "Public site reads the database").
 */
export const PRICE_KINDS: { kind: PriceDisplay["kind"]; label: string; example: string }[] = [
  { kind: "exact", label: "Exact price", example: "₦250,000" },
  { kind: "from", label: "Starting from", example: "from ₦150,000" },
  { kind: "range", label: "A range", example: "₦20,000 to ₦80,000" },
  { kind: "perStudent", label: "Per student per term", example: "₦1,500 per student per term" },
  { kind: "custom", label: "Custom quote", example: "Custom quote after consultation" },
  { kind: "none", label: "No price", example: "No price line is shown" },
];

export function formatPrice(p: PriceDisplay): string | null {
  switch (p.kind) {
    case "exact": return naira(p.amount);
    case "from": return `from ${naira(p.amount)}`;
    case "range": return `${naira(p.min)} to ${naira(p.max)}`;
    case "perStudent": return `${naira(p.amount)} per student per term`;
    case "custom": return "Custom quote after consultation";
    case "none": return null;
  }
}
