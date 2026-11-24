"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { auth } from "@/lib/control-room/api";
import { ROLES } from "@/lib/control-room/roles";
import { useHydrated, useSession } from "@/lib/control-room/store";
import type { Role } from "@/lib/control-room/types";
import { Brand } from "../ui/Brand";
import { Field, inputCls } from "../ui/Field";
import { btn } from "../ui/kit";

/**
 * Two steps: email and password, then a 6-digit code. In the prototype anything is accepted.
 * TODO(integration): step 1 -> supabase.auth.signInWithPassword(); step 2 -> supabase.auth.mfa.challengeAndVerify().
 * There is no sign-up here on purpose: staff are invited by the Owner (see docs/CONTROL_ROOM_HANDOVER.md).
 */
export function LoginForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const staff = useSession();
  const [step, setStep] = useState<"login" | "code">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("owner");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hydrated && staff) router.replace("/control-room");
  }, [hydrated, staff, router]);

  useEffect(() => {
    firstField.current?.focus();
  }, [step]);

  const toCode = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("That email looks incomplete. Check the @ and the dot.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setError("");
    setStep("code");
  };
  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6 digits from your authenticator app.");
      return;
    }
    setError("");
    await auth.signIn(role);
  };

  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(60%_45%_at_50%_30%,var(--mint),transparent_70%)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <div className="card">
          {step === "login" ? (
            <form onSubmit={toCode} noValidate className="flex flex-col gap-4">
              <div>
                <h1 className="mb-1 font-display text-2xl font-bold">Sign in</h1>
                <div className="text-[15px] text-ink/70">The Control Room is for the Albert Nelly team.</div>
              </div>
              <Field id="email" label="Email" error={error.includes("email") ? error : undefined}>
                <input ref={firstField} id="email" type="email" autoComplete="username" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field id="password" label="Password" error={error.includes("password") ? error : undefined}>
                <input id="password" type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <Field id="role" label="Preview as (prototype only)" hint={ROLES.find((r) => r.id === role)?.blurb}>
                <select id="role" className={inputCls} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </Field>
              <button type="submit" className={btn("brand", "md", "w-full")}>Continue</button>
            </form>
          ) : (
            <form onSubmit={verify} noValidate className="flex flex-col gap-4">
              <div>
                <h1 className="mb-1 font-display text-2xl font-bold">Check your authenticator app</h1>
                <div className="text-[15px] text-ink/70">Enter the 6-digit code for {email.trim()}.</div>
              </div>
              <Field id="code" label="6-digit code" error={error || undefined}>
                <input ref={firstField} id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={inputCls} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              </Field>
              <button type="submit" className={btn("brand", "md", "w-full")}>Sign in</button>
              <button type="button" className={btn("ghost", "md", "w-full")} onClick={() => { setError(""); setStep("login"); }}>Back</button>
            </form>
          )}
          <div className="mt-5 rounded-xl bg-sun/20 p-3 text-sm">
            Prototype: any email and password work, then any 6 digits. Nothing is sent to a server.
          </div>
        </div>
      </div>
    </main>
  );
}
