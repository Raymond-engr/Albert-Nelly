"use client";

import { useRegistration } from "@/providers/RegistrationProvider";

/** Floating button on every page. It opens the registration panel so every chat is saved as a lead. */
export default function WhatsAppFab() {
  const { open } = useRegistration();
  return (
    <button
      type="button"
      data-inert-on-modal
      aria-label="Start a conversation"
      onClick={() => open()}
      style={{ bottom: "calc(18px + env(safe-area-inset-bottom, 0px))", right: "max(18px, env(safe-area-inset-right))" }}
      className="fixed z-30 grid size-[58px] cursor-pointer place-items-center rounded-full border-0 bg-brand shadow-[0_6px_20px_rgba(6,40,30,0.25)] transition hover:-translate-y-0.5"
    >
      {/* Generic chat bubble. The official WhatsApp mark belongs only in buttons, per WhatsApp's brand guidelines. */}
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#06281E" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg>
    </button>
  );
}
