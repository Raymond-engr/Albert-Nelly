"use client";

import { useRegistration } from "@/providers/RegistrationProvider";

/** Floating button on every page. It opens the registration panel so every chat is saved as a lead. */
export default function WhatsAppFab() {
  const { open } = useRegistration();
  return (
    <button
      type="button"
      data-inert-on-modal
      aria-label="Talk to us on WhatsApp"
      onClick={() => open()}
      style={{ bottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}
      className="fixed right-5 z-30 grid size-[60px] cursor-pointer place-items-center rounded-full border-0 bg-brand shadow-[0_6px_20px_rgba(6,40,30,0.3)] transition hover:-translate-y-0.5"
    >
      {/* Generic chat bubble. The official WhatsApp mark belongs only in buttons, per WhatsApp's brand guidelines. */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#06281E" aria-hidden="true"><path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /></svg>
    </button>
  );
}
