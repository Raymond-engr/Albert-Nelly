"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { countryCodes, leadOptions, months, NOT_SURE, partnerCategories } from "@/data/registration";
import { services } from "@/data/services";
import { site } from "@/data/site";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";
import type { FieldKey } from "@/lib/validation";
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

  const chip = f.session.ctx ? <p className={s.chip}>{f.session.ctx}</p> : null;
  const heading = (text: string) => <h2 ref={head} id="reg-title" tabIndex={-1}>{text}</h2>;
  const err = (k: FieldKey) => (errors[k] ? <div className={s.er} id={`err-${k}`}>{errors[k]}</div> : null);
  const inv = (k: FieldKey) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `err-${k}` : undefined });

  if (step === "pick") {
    return (
      <>
        {chip}
        {heading("What brings you here?")}
        {(Object.keys(leadOptions) as LeadType[]).map((k) => (
          <button key={k} type="button" className={s.ch} onClick={() => f.choose(k)}>{leadOptions[k]}</button>
        ))}
      </>
    );
  }

  if (step === "updated") {
    return (
      <>
        <p className={s.big}>✓</p>
        {heading("You’re on the list.")}
        <p className={s.lead}>We’ll send you news and the odd surprise. Nothing else.</p>
        <button type="button" className={s.b} onClick={f.close}>Close</button>
      </>
    );
  }

  if (step === "done") {
    return (
      <>
        {heading(`${f.returning ? "Welcome back. " : ""}You’re in. ${f.seconds > 0 ? `Opening WhatsApp in ${f.seconds}…` : "Opening WhatsApp…"}`)}
        <p className={s.lead}>WhatsApp can’t send the message for you. When it opens, tap Send and we’ll reply there.</p>
        <a className={`${s.b} ${s.g} ${s.bg}`} href={f.href} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>
        <button
          type="button"
          className={`${s.b} ${s.bg}`}
          onClick={() => {
            void navigator.clipboard?.writeText(site.whatsappDisplay);
            setCopied(true);
          }}
        >
          {copied ? `Copied: ${site.whatsappDisplay}` : "Didn’t open? Copy our number"}
        </button>
      </>
    );
  }

  const t = type as LeadType;
  const onSubmit = async (e: FormEvent) => {
    const bad = await f.submit(e);
    if (bad) document.getElementById(`f-${bad}`)?.focus();
  };

  return (
    <>
      {chip}
      {heading(leadOptions[t])}
      {f.netError && <div className={s.er} role="alert">{f.netError}</div>}
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="f-name">Your name</label>
        <input id="f-name" autoComplete="name" value={values.name} onChange={(e) => f.setField("name", e.target.value)} onBlur={() => f.blur("name")} {...inv("name")} />
        {err("name")}

        <label htmlFor="f-email">Email</label>
        <input id="f-email" type="email" autoComplete="email" value={values.email} onChange={(e) => f.setField("email", e.target.value)} onBlur={() => f.blur("email")} {...inv("email")} />
        {err("email")}

        {t !== "update" && (
          <>
            <label htmlFor="f-wa">WhatsApp number</label>
            <div className={s.two}>
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
            <label htmlFor="f-category">Business category</label>
            <select id="f-category" value={values.category} onChange={(e) => f.setField("category", e.target.value)}>
              {partnerCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </>
        )}

        <label htmlFor="f-month">Birthday (optional)</label>
        <div className={s.two}>
          <select id="f-month" aria-label="Month" value={values.month} onChange={(e) => f.setField("month", e.target.value)} className={s.grow}>
            <option value="">Month</option>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select id="f-day" aria-label="Day" value={values.day} onChange={(e) => f.setField("day", e.target.value)} className={s.day}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select>
        </div>
        <p className={s.hint}>So we can send you a birthday surprise.</p>

        <label className={s.ck} htmlFor="f-consent">
          <input id="f-consent" type="checkbox" checked={values.consent} onChange={(e) => f.setField("consent", e.target.checked)} {...inv("consent")} />
          <span>I agree to be contacted by Albert Nelly.</span>
        </label>
        {err("consent")}

        <input className={s.hp} tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" value={values.company} onChange={(e) => f.setField("company", e.target.value)} />

        <button type="submit" disabled={f.saving} className={`${s.b} ${s.g} ${s.bg}`}>
          {f.saving ? "Saving…" : f.netError ? "Try again" : t === "update" ? "Keep me updated" : "Save and open WhatsApp"}
        </button>
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
        <button type="button" className={`${s.b} ${s.x}`} aria-label="Close" onClick={close}>✕</button>
        <Flow key={session.id} />
      </aside>
    </>
  );
}
