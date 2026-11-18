"use client";

import type { ReactNode } from "react";
import { buttonClass, type ButtonVariant } from "@/components/ui/Button";
import { useRegistration } from "@/providers/RegistrationProvider";
import type { LeadType } from "@/types/lead";

type Props = {
  /** Preselects the visitor type and skips step 1. Omit to start at "What brings you here?" */
  type?: LeadType;
  /** Chip shown at the top of the panel, e.g. a service or package name. */
  ctx?: string;
  /** Preselected service in the dropdown. Defaults to ctx. */
  pre?: string;
  variant?: ButtonVariant;
  big?: boolean;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

/** The one way any button in any slot opens the registration panel. */
export function OpenButton({ type, ctx, pre, variant = "outline", big, className, onClick, children }: Props) {
  const { open } = useRegistration();
  return (
    <button
      type="button"
      className={buttonClass(variant, big, className)}
      onClick={() => {
        onClick?.();
        open({ type, ctx, pre });
      }}
    >
      {children}
    </button>
  );
}
