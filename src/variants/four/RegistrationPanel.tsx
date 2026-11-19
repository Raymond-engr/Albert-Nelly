"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { copy } from "@/data/copy";
import { chatPrompts as c, countryCodes, leadOptions, months, NOT_SURE, partnerCategories } from "@/data/registration";
import { services } from "@/data/services";
import { site } from "@/data/site";
import { useRegistrationFlow } from "@/hooks/useRegistrationFlow";
import { validateValues, type FieldKey } from "@/lib/validation";
import { useRegistration } from "@/providers/RegistrationProvider";
import type { LeadType } from "@/types/lead";
import s from "./RegistrationPanel.module.css";

type QKey = "name" | "wa" | "email" | "service" | "business" | "category" | "bday" | "consent";
type TextKey = "name" | "wa" | "email" | "business";
type Line = { me?: boolean; text: string };

const FIELD: Record<TextKey, { type: string; ac: string; mode?: "tel" }> = {
  name: { type: "text", ac: "name" },
  wa: { type: "tel", ac: "tel-national", mode: "tel" },
  email: { type: "email", ac: "email" },
  business: { type: "text", ac: "organization" },
};
const isText = (k: QKey | undefined): k is TextKey => k === "name" || k === "wa" || k === "email" || k === "business";
const fieldKey = (k: QKey | undefined): FieldKey | undefined => (isText(k) || k === "consent" ? k : undefined);

/** The questions the chat asks, in order, for each visitor type. */
function questionsFor(t: LeadType): QKey[] {
  const q: QKey[] = ["name"];
  if (t !== "update") q.push("wa");
  q.push("email");
  if (t === "hire") q.push("service");
  if (t === "partner") q.push("business", "category");
  q.push("bday", "consent");
  return q;
}

/** UI skin only. Steps, validation, saving and the WhatsApp link live in useRegistrationFlow. The chat asks one field at a time. */
function Flow() {
  const f = useRegistrationFlow();
  const { isOpen } = useRegistration();
  const head = useRef<HTMLHeadingElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [qi, setQi] = useState(0);
  const { step, type, values, errors, session } = f;
  const qs = type ? questionsFor(type) : [];
  const first = values.name.trim().split(" ")[0];
  const k = step === "form" ? qs[qi] : undefined;
  const errKey = fieldKey(k);
  const msg = f.netError || (errKey ? errors[errKey] : "") || "";

  useEffect(() => {
    if (isOpen) head.current?.focus();
  }, [step, isOpen]);

  // After each answer the next input takes focus (the first question keeps the heading focus, as in every panel).
  useEffect(() => {
    if (step !== "form" || !type || qi === 0) return;
    const key = questionsFor(type)[qi];
    document.getElementById(key === "bday" ? "f-day" : `f-${key}`)?.focus();
  }, [qi, step, type]);

  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [qi, step, type]);

  const ask = (key: QKey) => c[key].replace("{name}", first);
  const answer = (key: QKey): string => {
    switch (key) {
      case "wa": return `${values.cc} ${values.wa.trim()}`;
      case "bday": return values.day && values.month ? `${values.day} ${months[Number(values.month) - 1].slice(0, 3)}` : c.skip;
      case "consent": return c.consentYes;
      case "name":
      case "email":
      case "business": return values[key].trim();
      case "service":
      case "category": return values[key];
    }
  };

  const lines: Line[] = [];
  if (!session.type) {
    lines.push({ text: c.pick });
    if (type) lines.push({ me: true, text: leadOptions[type] });
  }
  const answered = step === "form" ? qi : qs.length;
  for (let i = 0; i < answered; i++) lines.push({ text: ask(qs[i]) }, { me: true, text: answer(qs[i]) });
  if (k) lines.push({ text: ask(k) });

  const next = (e: FormEvent) => {
    e.preventDefault();
    setQi(qi + 1);
  };
  const submitText = (key: TextKey) => (e: FormEvent) => {
    e.preventDefault();
    if (type && validateValues(values, type)[key]) f.blur(key);
    else setQi(qi + 1);
  };
  const skipBirthday = () => {
    f.setField("day", "");
    f.setField("month", "");
    setQi(qi + 1);
  };
  const onSubmit = async (e: FormEvent) => {
    const bad = await f.submit(e);
    if (!bad || !type) return;
    const i = questionsFor(type).indexOf(bad);
    if (i >= 0) setQi(i);
  };

  return (
    <>
      <div className={s.ph}>
        <h2 ref={head} id="reg-title" tabIndex={-1}>{copy.join.cta}</h2>
        <button type="button" className={s.btn} onClick={f.close}>Close</button>
      </div>
      {session.ctx && <div className={s.ctx}><span className="chip">{session.ctx}</span></div>}
      <div ref={log} className={s.log} aria-live="polite">
        {lines.map((l, i) => <div key={i} className={`${s.m} ${l.me ? s.me : s.bot}`}>{l.text}</div>)}
        {step === "done" && (
          <>
            <div className={`${s.m} ${s.bot}`}>
              {f.returning ? c.welcomeBack : c.welcomeNew}, {first}. {c.opening}
              <span aria-live="off">{f.seconds > 0 ? ` in ${f.seconds}…` : "…"}</span>
            </div>
            <div className={`${s.m} ${s.bot}`}>{c.hint}</div>
          </>
        )}
        {step === "updated" && <div className={`${s.m} ${s.bot}`}>{c.welcomeNew}, {first}. {c.updated}</div>}
      </div>
      <div className={s.ui}>
        {step === "pick" && (Object.keys(leadOptions) as LeadType[]).map((o) => (
          <button key={o} type="button" className={s.choice} onClick={() => f.choose(o)}>{leadOptions[o]}</button>
        ))}

        {isText(k) && (
          <form noValidate onSubmit={submitText(k)}>
            {k === "wa" && (
              <select className={s.pre} aria-label="Country code" value={values.cc} onChange={(e) => f.setField("cc", e.target.value)}>
                {countryCodes.map((x) => <option key={x}>{x}</option>)}
              </select>
            )}
            <input
              id={`f-${k}`}
              type={FIELD[k].type}
              inputMode={FIELD[k].mode}
              autoComplete={FIELD[k].ac}
              aria-label={c.placeholders[k]}
              placeholder={c.placeholders[k]}
              value={values[k]}
              onChange={(e) => f.setField(k, e.target.value)}
              aria-invalid={!!errors[k]}
              aria-describedby={errors[k] ? `err-${k}` : undefined}
            />
            <button type="submit" className={s.go}>{c.send}</button>
          </form>
        )}

        {k === "service" && (
          <form onSubmit={next}>
            <select id="f-service" aria-label="Service" value={values.service} onChange={(e) => f.setField("service", e.target.value)}>
              {[...services.map((x) => x.title), NOT_SURE].map((x) => <option key={x}>{x}</option>)}
            </select>
            <button type="submit" className={s.go}>{c.next}</button>
          </form>
        )}

        {k === "category" && (
          <form onSubmit={next}>
            <select id="f-category" aria-label="Category" value={values.category} onChange={(e) => f.setField("category", e.target.value)}>
              {partnerCategories.map((x) => <option key={x}>{x}</option>)}
            </select>
            <button type="submit" className={s.go}>{c.next}</button>
          </form>
        )}

        {k === "bday" && (
          <>
            <form
              onSubmit={(e) => {
                if (values.day && values.month) next(e);
                else {
                  e.preventDefault();
                  skipBirthday();
                }
              }}
            >
              <select id="f-day" aria-label="Day" value={values.day} onChange={(e) => f.setField("day", e.target.value)}>
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
              <select aria-label="Month" value={values.month} onChange={(e) => f.setField("month", e.target.value)}>
                <option value="">Month</option>
                {months.map((m, i) => <option key={m} value={i + 1}>{m.slice(0, 3)}</option>)}
              </select>
              <button type="submit" className={s.go}>{c.next}</button>
            </form>
            <button type="button" className={s.choice} onClick={skipBirthday}>{c.skipHint}</button>
          </>
        )}

        {k === "consent" && (
          <form noValidate className={s.consent} onSubmit={onSubmit}>
            <label className={s.cl} htmlFor="f-consent">
              <input
                id="f-consent"
                type="checkbox"
                checked={values.consent}
                onChange={(e) => f.setField("consent", e.target.checked)}
                aria-invalid={!!errors.consent}
                aria-describedby={errors.consent ? "err-consent" : undefined}
              />
              <span>{c.consentLabel}</span>
            </label>
            <button type="submit" disabled={f.saving} className={s.go}>
              {f.saving ? "Saving…" : f.netError ? "Try again" : type === "update" ? "Keep me updated" : "Continue to WhatsApp"}
            </button>
          </form>
        )}

        {step === "form" && (
          <input className={s.hp} tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" value={values.company} onChange={(e) => f.setField("company", e.target.value)} />
        )}

        {step === "done" && (
          <>
            <a className={s.cta} href={f.href} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>
            <button
              type="button"
              className={s.lnk}
              onClick={() => {
                void navigator.clipboard?.writeText(site.whatsappDisplay);
                setCopied(true);
              }}
            >
              {copied ? `Copied: ${site.whatsappDisplay}` : "Didn’t open? Copy our number"}
            </button>
          </>
        )}
      </div>
      {msg && <p className={s.err} id={errKey ? `err-${errKey}` : undefined} role="alert">{msg}</p>}
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
    <div className={`${s.sheet} ${isOpen ? s.open : ""}`}>
      <div className={s.bd} onClick={close} aria-hidden="true" />
      <aside className={s.panel} role="dialog" aria-modal="true" aria-labelledby="reg-title" inert={!isOpen}>
        <Flow key={session.id} />
      </aside>
    </div>
  );
}
