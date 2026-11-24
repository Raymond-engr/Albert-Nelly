"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { COUNTDOWN_SECONDS } from "@/data/registration";
import { toPayload, submitLead } from "@/lib/leads";
import { validateValues, type FieldErrors, type FieldKey } from "@/lib/validation";
import { leadMessage, waLink } from "@/lib/whatsapp";
import { useRegistration } from "@/providers/RegistrationProvider";
import type { LeadType, LeadValues } from "@/types/lead";

export type FlowStep = "pick" | "form" | "done" | "updated";

/**
 * All registration LOGIC lives here: steps, validation, saving, the WhatsApp link and
 * the countdown. The panel component is only a skin. Swap the skin freely, keep this.
 * Mount it under <RegistrationFlow key={session.id}> so it resets on every open.
 */
export function useRegistrationFlow() {
  const { session, close } = useRegistration();
  const [step, setStep] = useState<FlowStep>(session.type ? "form" : "pick");
  const [type, setType] = useState<LeadType | null>(session.type);
  const [values, setValues] = useState<LeadValues>({
    name: "", email: "", cc: "+234", wa: "", service: session.pre, business: "",
    category: "Photography", day: "", month: "", consent: false, company: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [netError, setNetError] = useState("");
  const [returning, setReturning] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);

  const href = useMemo(() => (type ? waLink(leadMessage(type, values, session.ctx)) : ""), [type, values, session.ctx]);

  // Countdown, then try to open WhatsApp. If the browser blocks it, the big button is still on screen.
  useEffect(() => {
    if (step !== "done" || !href) return;
    let n = COUNTDOWN_SECONDS;
    const t = setInterval(() => {
      n -= 1;
      setSeconds(n);
      if (n <= 0) {
        clearInterval(t);
        window.open(href, "_blank", "noopener");
      }
    }, 1000);
    return () => clearInterval(t);
  }, [step, href]);

  const choose = (t: LeadType) => {
    setType(t);
    setStep("form");
  };

  const setField = <K extends keyof LeadValues>(key: K, value: LeadValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  /** Validate one field when the visitor leaves it. */
  const blur = (key: FieldKey) => {
    if (!type) return;
    const all = validateValues(values, type);
    setErrors((e) => ({ ...e, [key]: all[key] }));
  };

  /** Returns the first invalid field key (so the UI can focus it), or undefined when saved. */
  const submit = async (ev: FormEvent): Promise<FieldKey | undefined> => {
    ev.preventDefault();
    if (!type || saving) return;
    const errs = validateValues(values, type);
    setErrors(errs);
    const first = Object.keys(errs)[0] as FieldKey | undefined;
    if (first) return first;
    setSaving(true);
    setNetError("");
    const res = await submitLead(toPayload(type, values, session.ctx));
    setSaving(false);
    if (!res.ok) {
      setNetError(res.error);
      return;
    }
    setReturning(res.returning);
    setStep(type === "update" ? "updated" : "done");
  };

  return {
    session, step, type, values, errors, saving, netError, returning, seconds, href,
    firstName: values.name.trim().split(" ")[0],
    choose, setField, blur, submit, back: () => setStep("pick"), close,
  };
}
