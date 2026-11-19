"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { NOT_SURE } from "@/data/registration";
import { oneCopy } from "@/data/one";
import { site } from "@/data/site";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";
import type { FieldKey } from "@/lib/validation";
import { useRegistration } from "@/providers/RegistrationProvider";
import type { LeadType } from "@/types/lead";
import s from "./proto.module.css";

const P = oneCopy.panel;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SERVICES = [NOT_SURE, ...oneCopy.services.items.map((x) => x.title)];

/** A painted underline for the success headings. */
const Underline = () => (
  <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
    <path d="M3 8C40 2 80 12 120 6S180 4 197 7" pathLength="1" />
  </svg>
);

/** The panel's contents. All logic (steps, validation, saving, the WhatsApp link, the countdown) is in useRegistrationFlow. */
function Flow() {
  const f = useRegistrationFlow();
  const { isOpen } = useRegistration();
  const head = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const { step, type, values, errors } = f;

  useEffect(() => {
    if (isOpen) head.current?.focus();
  }, [step, isOpen]);

  const title = (text: string, painted = false) => (
    <h2 ref={head} id="reg-title" tabIndex={-1} className={painted ? s.ok : undefined}>
      {text}
      {painted && <Underline />}
    </h2>
  );
  const err = (k: "name" | "email" | "wa" | "consent") => <p className={s.err} id={`reg-${k}-e`} role="alert">{errors[k] ? P.errors[k] : ""}</p>;
  const inv = (k: FieldKey) => ({ "aria-invalid": !!errors[k], "aria-describedby": `reg-${k}-e` });
  const ctx = f.session.ctx;

  const header = (
    <div className={s.phead}>
      {step === "form" && <button type="button" className={s.ib} onClick={f.back}>{P.back}</button>}
      {ctx && <span className={s.chip}>{ctx}</span>}
      <button type="button" className={`${s.ib} ${s.close}`} aria-label={P.close} onClick={f.close}>&times;</button>
    </div>
  );

  let body;
  if (step === "pick") {
    body = (
      <>
        {title(P.pickTitle)}
        {(Object.keys(P.options) as LeadType[]).map((k) => (
          <button key={k} type="button" className={s.choice} onClick={() => f.choose(k)}>
            <b>{P.options[k][0]}</b>
            <span>{P.options[k][1]}</span>
          </button>
        ))}
      </>
    );
  } else if (step === "updated") {
    body = (
      <>
        {title(P.updated.title, true)}
        <p style={{ marginTop: 28 }}>{P.updated.text}</p>
        <button type="button" className={`${s.btn} ${s.ghost} ${s.big}`} onClick={f.close}>{P.updated.close}</button>
      </>
    );
  } else if (step === "done") {
    body = (
      <>
        {title(f.returning ? P.done.back : P.done.title, true)}
        <p style={{ marginTop: 28 }}>{P.done.opening} <b className={s.cd}>{f.seconds}</b>…</p>
        <a className={`${s.btn} ${s.sun} ${s.big}`} href={f.href} target="_blank" rel="noopener noreferrer">{P.done.button}</a>
        <p className={s.hint}>{P.done.hint}</p>
        {f.seconds <= 0 && (
          <div>
            <p>{P.done.fallback}</p>
            <button
              type="button"
              className={`${s.btn} ${s.ghost}`}
              onClick={() => {
                void navigator.clipboard?.writeText(site.whatsappDisplay);
                setCopied(true);
              }}
            >
              {copied ? P.done.copied : `${P.done.copy} ${site.whatsappDisplay}`}
            </button>
          </div>
        )}
      </>
    );
  } else {
    const t = type as LeadType;
    const onSubmit = async (e: FormEvent) => {
      const bad = await f.submit(e);
      if (bad) document.getElementById(`reg-${bad}`)?.focus();
    };
    const svc = SERVICES.includes(values.service) ? values.service : NOT_SURE;
    body = (
      <>
        {title(t === "update" ? P.updateTitle : P.formTitle)}
        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="reg-name">{P.labels.name}</label>
          <input id="reg-name" name="name" autoComplete="name" value={values.name} onChange={(e) => f.setField("name", e.target.value)} {...inv("name")} />
          {err("name")}

          <label htmlFor="reg-email">{P.labels.email}</label>
          <input id="reg-email" name="email" type="email" autoComplete="email" value={values.email} onChange={(e) => f.setField("email", e.target.value)} {...inv("email")} />
          {err("email")}

          <label htmlFor="reg-wa">{P.labels.wa}</label>
          <div className={s.phone}>
            <select aria-label="Country code" value={values.cc} onChange={(e) => f.setField("cc", e.target.value)}>
              {P.countryCodes.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input id="reg-wa" name="wa" inputMode="tel" autoComplete="tel-national" value={values.wa} onChange={(e) => f.setField("wa", e.target.value)} {...inv("wa")} />
          </div>
          {err("wa")}

          {t === "hire" && (
            <>
              <label htmlFor="reg-svc">{P.labels.service}</label>
              <select id="reg-svc" value={svc} onChange={(e) => f.setField("service", e.target.value)}>
                {SERVICES.map((x) => <option key={x}>{x}</option>)}
              </select>
            </>
          )}

          {t === "partner" && (
            <>
              <label htmlFor="reg-business">{P.labels.business}</label>
              <input id="reg-business" name="biz" value={values.business} onChange={(e) => f.setField("business", e.target.value)} {...inv("business")} />
              <p className={s.err} id="reg-business-e" role="alert">{errors.business ?? ""}</p>
              <label htmlFor="reg-cat">{P.labels.category}</label>
              <select id="reg-cat" value={values.category} onChange={(e) => f.setField("category", e.target.value)}>
                {P.categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </>
          )}

          <fieldset className={s.bd}>
            <legend>{P.birthday.legend}</legend>
            <div>
              <select aria-label={P.birthday.day} value={values.day} onChange={(e) => f.setField("day", e.target.value)}>
                <option value="">{P.birthday.day}</option>
                {Array.from({ length: 31 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}
              </select>
              <select aria-label={P.birthday.month} value={values.month} onChange={(e) => f.setField("month", e.target.value)}>
                <option value="">{P.birthday.month}</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <p className={s.hint}>{P.birthday.hint}</p>
          </fieldset>

          <label className={s.chk}>
            <input type="checkbox" id="reg-consent" checked={values.consent} onChange={(e) => f.setField("consent", e.target.checked)} {...inv("consent")} />
            <span>{P.consent}</span>
          </label>
          {err("consent")}

          {/* Honeypot: real visitors never see or fill it. */}
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" value={values.company} onChange={(e) => f.setField("company", e.target.value)} style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} />

          <p className={s.err} id="reg-net" role="alert">{f.netError ? P.netError : ""}</p>
          <button type="submit" disabled={f.saving} className={`${s.btn} ${s.sun} ${s.big} ${f.saving ? s.busy : ""}`}>
            {f.saving ? P.saving : f.netError ? P.retry : t === "update" ? P.submitUpdate : P.submit}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      {header}
      <div className={s.pbody}>{body}</div>
    </>
  );
}

export default function RegistrationPanel() {
  const { isOpen, session, close } = useRegistration();
  const panel = useRef<HTMLElement>(null);

  // While open: the page behind is inert and does not scroll, Escape closes, and Tab stays inside the panel.
  useEffect(() => {
    const regions = [...document.querySelectorAll<HTMLElement>("[data-inert-on-modal]")];
    regions.forEach((el) => (el.inert = isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab" || !panel.current) return;
      const list = [...panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input, select")].filter((x) => x.offsetParent && x.tabIndex >= 0);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      regions.forEach((el) => (el.inert = false));
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <div className={s.t}>
      <div className={`${s.scrim} ${isOpen ? s.on : ""}`} onClick={close} aria-hidden="true" />
      <aside ref={panel} className={`${s.panel} ${isOpen ? s.on : ""}`} role="dialog" aria-modal="true" aria-labelledby="reg-title" inert={!isOpen}>
        <Flow key={session.id} />
      </aside>
    </div>
  );
}
