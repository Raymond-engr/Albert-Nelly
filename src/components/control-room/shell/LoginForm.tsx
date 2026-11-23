"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { auth } from "@/lib/control-room/api";
import { ROLES } from "@/lib/control-room/roles";
import { useHydrated, useSession } from "@/lib/control-room/store";
import type { Role } from "@/lib/control-room/types";
import { Brand } from "../ui/Brand";
import { Field, inputCls } from "../ui/Field";
import { btn } from "../ui/kit";

export function LoginForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const staff = useSession();
  const [step, setStep] = useState<"login" | "code">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("owner");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hydrated && staff) router.replace("/control-room");
  }, [hydrated, staff, router]);

  useEffect(() => {
    firstField.current?.focus();
  }, [step]);

  const toCode = async (e: FormEvent) => {
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
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) {
          setError("Failed to verify authentication factors.");
          setLoading(false);
          return;
        }

        const totp = factors.totp.find((f) => f.status === "verified");
        if (!totp) {
          // No verified MFA factor enrolled yet -> redirect to enrollment
          router.push("/control-room/mfa");
          return;
        }

        setFactorId(totp.id);
        setStep("code");
        setLoading(false);
        return;
      }
    } catch {
      // Supabase unconfigured: allow fallback demo sign-in
    }

    setLoading(false);
    setStep("code");
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6 digits from your authenticator app.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      if (factorId) {
        const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code,
        });
        if (verifyError) {
          setError(verifyError.message || "Invalid 6-digit code. Please try again.");
          setLoading(false);
          return;
        }
        // Session is now aal2 — navigate directly
        router.replace("/control-room");
        return;
      }
    } catch {
      // Demo fallback
    }

    await auth.signIn(role);
    setLoading(false);
    router.replace("/control-room");
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
              <Field id="email" label="Email" error={error.toLowerCase().includes("email") ? error : undefined}>
                <input
                  ref={firstField}
                  id="email"
                  type="email"
                  autoComplete="username"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field id="password" label="Password" error={error.toLowerCase().includes("password") ? error : undefined}>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              {error && !error.toLowerCase().includes("email") && !error.toLowerCase().includes("password") && (
                <div className="text-sm text-danger">{error}</div>
              )}

              <div className="flex justify-end">
                <Link href="/control-room/forgot-password" className="text-xs text-brand hover:underline">
                  Forgot password?
                </Link>
              </div>

              {process.env.NODE_ENV !== "production" && (
                <Field id="role" label="Preview as (development demo)" hint={ROLES.find((r) => r.id === role)?.blurb}>
                  <select id="role" className={inputCls} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </Field>
              )}

              <button type="submit" disabled={loading} className={btn("brand", "md", "w-full")}>
                {loading ? "Checking..." : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} noValidate className="flex flex-col gap-4">
              <div>
                <h1 className="mb-1 font-display text-2xl font-bold">Check your authenticator app</h1>
                <div className="text-[15px] text-ink/70">Enter the 6-digit code for {email.trim() || "your account"}.</div>
              </div>
              <Field id="code" label="6-digit code" error={error || undefined}>
                <input
                  ref={firstField}
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className={inputCls}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <button type="submit" disabled={loading} className={btn("brand", "md", "w-full")}>
                {loading ? "Verifying..." : "Sign in"}
              </button>
              <button
                type="button"
                className={btn("ghost", "md", "w-full")}
                onClick={() => {
                  setError("");
                  setCode("");
                  setStep("login");
                }}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
