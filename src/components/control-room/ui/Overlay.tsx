"use client";

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { Icon } from "./Icon";
import { btn } from "./kit";
import s from "./Overlay.module.css";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * A right-hand drawer (detail views) or a centred modal (confirmations, small forms).
 * Escape and a click on the backdrop close it, Tab stays inside, and focus returns to the opener.
 */
export function Overlay({ open, onClose, title, children, footer, variant = "drawer" }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; variant?: "drawer" | "modal";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;

  const trap = (e: ReactKeyboardEvent) => {
    if (e.key !== "Tab" || !panel.current) return;
    const items = panel.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={s.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={trap} className={`${variant === "drawer" ? s.drawer : s.modal} text-ink outline-none`}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="mb-0 font-display text-lg font-bold">{title}</h2>
          <button type="button" className={btn("ghost", "sm", "!px-2")} aria-label="Close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
