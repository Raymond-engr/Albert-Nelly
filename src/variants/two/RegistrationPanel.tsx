"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/Button";
import { countryCodes, leadHeadings, leadOptions, months, NOT_SURE, partnerCategories } from "@/data/registration";
import { services } from "@/data/services";
import { site } from "@/data/site";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";
import type { FieldKey } from "@/lib/validation";
import { leadMessage } from "@/lib/whatsapp";
import { useRegistration } from "@/providers/RegistrationProvider";
import type { LeadType } from "@/types/lead";
import s from "./RegistrationPanel.module.css";

/** UI skin only. Steps, validation, saving and the WhatsApp link live in useRegistrationFlow. */
function Flow() {
  const f = useRegistrationFlow();
  const { isOpen } = useRegistration();
  const head = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const { step, type, values, errors } = f;

  useEffect(() => {
    if (isOpen) head.current?.focus();
  }, [step, isOpen]);

  const chip = f.session.ctx ? <span className={s.chip}>{f.session.ctx}</span> : null;
  const heading = (text: string) => <h2 ref={head} id="reg-title" tabIndex={-1}>{text}</h2>;
  const err = (k: FieldKey) => (errors[k] ? <small className={s.err} id={`err-${k}`}>{errors[k]}</small> : null);
  const inv = (k: FieldKey) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `err-${k}` : undefined });

  if (step === "pick") {
    return (
      <>
        {chip}
        {heading("What brings you here?")}
        <div className={s.choices}>
          {(Object.keys(leadOptions) as LeadType[]).map((k) => (
            <button key={k} type="button" className={s.ch} onClick={() => f.choose(k)}>{leadOptions[k]}</button>
          ))}
        </div>
      </>
    );
  }

  if (step === "updated") {
    return (
      <>
        {heading(`You’re on the list, ${f.firstName}.`)}
        <p>We’ll send a short welcome email. No chat needed.</p>
        <button type="button" className={buttonClass("brand")} onClick={f.close}>Back to the site</button>
      </>
    );
  }

  if (step === "done") {
    return (
      <>
        {heading(`${f.returning ? "Welcome back" : "You’re in"}, ${f.firstName}.`)}
        <p>{f.seconds > 0 ? `Opening WhatsApp in ${f.seconds}…` : "Didn’t open? Use the button below, or copy our number."}</p>
        <div className={s.bubble}>{leadMessage(type as LeadType, values, f.session.ctx)}</div>
        <p className={s.sm}>WhatsApp can’t send this for you. When it opens, tap Send.</p>
        <a className={buttonClass("sun", false, "w-full")} href={f.href} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>
        <button
          type="button"
          className={buttonClass("outline", false, "mt-2.5 w-full")}
          onClick={() => {
            void navigator.clipboard?.writeText(site.whatsappDisplay);
            setCopied(true);
          }}
        >
          {copied ? `Copied: ${site.whatsappDisplay}` : "Copy our number"}
        </button>
      </>
    );
  }

  // step === "form"
  const t = type as LeadType;
  const onSubmit = async (e: FormEvent) => {
    const bad = await f.submit(e);
    if (bad) document.getElementById(`f-${bad}`)?.focus();
  };

  return (
    <>
      {chip}
      {heading(leadHeadings[t])}
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="f-name">Name</label>
        <input id="f-name" autoComplete="name" value={values.name} onChange={(e) => f.setField("name", e.target.value)} onBlur={() => f.blur("name")} {...inv("name")} />
        {err("name")}

        <label htmlFor="f-email">Email</label>
        <input id="f-email" type="email" autoComplete="email" value={values.email} onChange={(e) => f.setField("email", e.target.value)} onBlur={() => f.blur("email")} {...inv("email")} />
        {err("email")}

        {t !== "update" && (
          <>
            <label htmlFor="f-wa">WhatsApp number</label>
            <div className={s.row}>
              <select aria-label="Country code" value={values.cc} onChange={(e) => f.setField("cc", e.target.value)}>
                {countryCodes.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input id="f-wa" type="tel" inputMode="tel" autoComplete="tel-national" value={values.wa} onChange={(e) => f.setField("wa", e.target.value)} onBlur={() => f.blur("wa")} {...inv("wa")} />
            </div>
            {err("wa")}
          </>
        )}

        {t === "hire" && (
          <>
            <label htmlFor="f-service">What do you need?</label>
            <select id="f-service" value={values.service} onChange={(e) => f.setField("service", e.target.value)}>
              {[...services.map((x) => x.title), NOT_SURE].map((x) => <option key={x}>{x}</option>)}
            </select>
          </>
        )}

        {t === "partner" && (
          <>
            <label htmlFor="f-business">Business name</label>
            <input id="f-business" autoComplete="organization" value={values.business} onChange={(e) => f.setField("business", e.target.value)} onBlur={() => f.blur("business")} {...inv("business")} />
            {err("business")}
            <label htmlFor="f-category">Category</label>
            <select id="f-category" value={values.category} onChange={(e) => f.setField("category", e.target.value)}>
              {partnerCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </>
        )}

        <label htmlFor="f-day">Birthday (optional)</label>
        <div className={s.two}>
          <select id="f-day" aria-label="Day" value={values.day} onChange={(e) => f.setField("day", e.target.value)}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select>
          <select aria-label="Month" value={values.month} onChange={(e) => f.setField("month", e.target.value)}>
            <option value="">Month</option>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <span className={s.sm}>So we can send you a birthday surprise.</span>

        <label className={s.consent} htmlFor="f-consent">
          <input id="f-consent" type="checkbox" checked={values.consent} onChange={(e) => f.setField("consent", e.target.checked)} {...inv("consent")} />
          I agree to be contacted by Albert Nelly.
        </label>
        {err("consent")}

        <input className={s.hp} tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" value={values.company} onChange={(e) => f.setField("company", e.target.value)} />

        {f.netError && <p className={s.err} role="alert">{f.netError}</p>}
        <button type="submit" disabled={f.saving} className={buttonClass("sun", false, "mt-[18px] w-full")}>
          {f.saving ? "Saving…" : f.netError ? "Try again" : "Save and continue"}
        </button>
        {f.saving && <span className={s.ld} aria-hidden="true" />}
      </form>
    </>
  );
}

export default function RegistrationPanel() {
  const { isOpen, session, close } = useRegistration();

  // While open: the page behind is inert and does not scroll, and Escape closes.
  useEffect(() => {
    const regions = [...document.querySelectorAll<HTMLElement>("[data-inert-on-modal]")];
    regions.forEach((el) => (el.inert = isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      regions.forEach((el) => (el.inert = false));
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <>
      <div className={`${s.scrim} ${isOpen ? s.on : ""}`} onClick={close} aria-hidden="true" />
      <aside className={`${s.panel} ${isOpen ? s.on : ""}`} role="dialog" aria-modal="true" aria-labelledby="reg-title" inert={!isOpen}>
        <button type="button" className={s.x} aria-label="Close" onClick={close}>×</button>
        <Flow key={session.id} />
      </aside>
    </>
  );
}
