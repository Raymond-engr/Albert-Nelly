"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { LeadType } from "@/types/lead";

export type OpenOptions = { type?: LeadType; ctx?: string; pre?: string };
type Session = { id: number; type: LeadType | null; ctx: string; pre: string };
type RegCtx = { isOpen: boolean; session: Session; open: (o?: OpenOptions) => void; close: () => void };
const Ctx = createContext<RegCtx | null>(null);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [session, setSession] = useState<Session>({ id: 0, type: null, ctx: "", pre: "" });
  const lastFocus = useRef<HTMLElement | null>(null);

  const open = useCallback((o: OpenOptions = {}) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    // A new session id remounts the flow, which resets every step and field.
    setSession((s) => ({ id: s.id + 1, type: o.type ?? null, ctx: o.ctx ?? "", pre: o.pre ?? o.ctx ?? "" }));
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    lastFocus.current?.focus();
  }, []);

  const value = useMemo(() => ({ isOpen, session, open, close }), [isOpen, session, open, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRegistration(): RegCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRegistration must be used inside <RegistrationProvider> (the Showroom renders it).");
  return ctx;
}
