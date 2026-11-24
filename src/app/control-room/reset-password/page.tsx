"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Brand } from "@/components/control-room/ui/Brand";
import { Field, inputCls } from "@/components/control-room/ui/Field";
import { btn } from "@/components/control-room/ui/kit";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password.");
        setLoading(false);
        return;
      }

      router.replace("/control-room/login");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(60%_45%_at_50%_30%,var(--mint),transparent_70%)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <div className="card">
          <h1 className="mb-1 font-display text-2xl font-bold">Set New Password</h1>
          <p className="mb-4 text-[15px] text-ink/70">
            Please enter and confirm your new password below.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field id="password" label="New password (min 8 characters)" error={error || undefined}>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <Field id="confirm-password" label="Confirm new password">
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className={inputCls}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>

            <button type="submit" disabled={loading} className={btn("brand", "md", "w-full")}>
              {loading ? "Updating password..." : "Update Password & Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
