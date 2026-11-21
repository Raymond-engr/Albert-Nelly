import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import { copy } from "@/data/copy";
import { formatPrice } from "@/lib/control-room/price";
import type { PriceDisplay } from "@/lib/control-room/types";

/** A frame that says "this is how it looks on the public site". The cards inside use main's own classes (card, chip, note, price, ck). */
export function PreviewFrame({ children, hidden }: { children: ReactNode; hidden?: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-paper p-5">
      <div className="mb-4 flex items-center justify-between gap-2 text-sm font-semibold text-ink/70">
        <span>How it looks on the site</span>
        {hidden && <span className="rounded-full bg-coral/15 px-2.5 py-0.5 text-xs text-danger">Hidden from the site</span>}
      </div>
      <div className="mx-auto max-w-[360px]">{children}</div>
    </div>
  );
}

export function ServicePreview({ title, description, audience, badge, price }: { title: string; description: string; audience: string; badge: string; price: PriceDisplay }) {
  const line = formatPrice(price);
  return (
    <article className="card">
      <i className="mb-3.5 block size-7 rounded-full bg-brand" aria-hidden="true" />
      <h3>{title || "Service name"}</h3>
      {badge && <span className="chip bg-sun text-[#06281E]">{badge}</span>}
      <p>{description || "A short description."}</p>
      <p className="note">For: {audience || "who it suits"}</p>
      {line && <p className="price">{line}</p>}
      <span className={buttonClass("brand")}>Talk to us</span>
    </article>
  );
}

export function PackagePreview({ name, description, audience, price, featured, features, more }: {
  name: string; description: string; audience: string; price: PriceDisplay; featured: boolean; features: string[]; more: string[];
}) {
  const line = formatPrice(price);
  return (
    <article className={`card flex flex-col ${featured ? "bg-mint shadow-[0_0_0_6px_var(--bg),0_0_0_8px_var(--g)]" : ""}`}>
      <h3>{name || "Package name"}</h3>
      <p>{description || "A short description."}</p>
      <p className="note">Suits: {audience || "who it suits"}</p>
      {line && <p className="price">{line}</p>}
      <ul className="ck">{features.map((f, i) => <li key={`${f}-${i}`}>{f}</li>)}</ul>
      {more.length > 0 && (
        <details className="mb-3">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-deep">{copy.schools.more}</summary>
          <ul className="ck">{more.map((f, i) => <li key={`${f}-${i}`}>{f}</li>)}</ul>
        </details>
      )}
      <span className={buttonClass(featured ? "brand" : "outline")}>{copy.schools.cta}</span>
    </article>
  );
}
