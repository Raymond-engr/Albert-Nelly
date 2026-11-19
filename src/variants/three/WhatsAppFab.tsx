"use client";

import { useRegistration } from "@/providers/RegistrationProvider";
import s from "./WhatsAppFab.module.css";

/** Floating button on every page. It opens the registration panel so every chat is saved as a lead. */
export default function WhatsAppFab() {
  const { open } = useRegistration();
  return (
    <button type="button" data-inert-on-modal className={s.fab} onClick={() => open()}>
      Chat with us
    </button>
  );
}
