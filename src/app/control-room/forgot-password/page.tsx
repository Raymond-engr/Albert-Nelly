"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Brand } from "@/components/control-room/ui/Brand";
import { Field, inputCls } from "@/components/control-room/ui/Field";
import { btn } from "@/components/control-room/ui/kit";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const siteUrl = process.env.SITE_URL || window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${siteUrl}/control-room/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(60%_45%_at_50%_30%,var(--mint),transparent_70%)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <div className="card">
          <h1 className="mb-1 font-display text-2xl font-bold">Reset Password</h1>
          <p className="mb-4 text-[15px] text-ink/70">
            Enter your staff email address and we will send you a password reset link.
          </p>

          {success ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-brand/10 p-4 text-sm text-brand">
                Password reset link sent! Check your email inbox to choose a new password.
              </div>
              <Link href="/control-room/login" className={btn("ghost", "md", "w-full text-center")}>
                Back to Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field id="email" label="Staff email address" error={error || undefined}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <button type="submit" disabled={loading} className={btn("brand", "md", "w-full")}>
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>

              <Link href="/control-room/login" className={btn("ghost", "md", "w-full text-center")}>
                Back to Sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
