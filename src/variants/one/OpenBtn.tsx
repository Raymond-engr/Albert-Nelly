"use client";

import type { ReactNode } from "react";
import { useRegistration } from "@/providers/RegistrationProvider";
import type { LeadType } from "@/types/lead";

/**
 * Opens the registration panel through the same provider as main's OpenButton.
 * It only differs in that it takes this variant's own class names instead of main's button styles.
 */
export function OpenBtn({ type, ctx, className, children }: { type?: LeadType; ctx?: string; className?: string; children: ReactNode }) {
  const { open } = useRegistration();
  return (
    <button type="button" className={className} onClick={() => open({ type, ctx, pre: ctx })}>
      {children}
    </button>
  );
}
