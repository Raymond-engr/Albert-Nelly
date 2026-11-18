"use client";

import { useRegistration } from "@/providers/RegistrationProvider";
import s from "./WhatsAppFab.module.css";

/** A labelled pill instead of a bare icon. Opens the panel, so every chat is saved as a lead. */
export default function WhatsAppFab() {
  const { open } = useRegistration();
  return (
    <button type="button" data-inert-on-modal className={s.fab} aria-label="Chat with us on WhatsApp" onClick={() => open()}>
      {/* Generic chat bubble. The official WhatsApp mark belongs only in buttons, per WhatsApp's brand guidelines. */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      </svg>
      Chat with us
    </button>
  );
}
