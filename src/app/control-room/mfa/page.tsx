"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Brand } from "@/components/control-room/ui/Brand";
import { Field, inputCls } from "@/components/control-room/ui/Field";
import { btn } from "@/components/control-room/ui/kit";
import { createClient } from "@/lib/supabase/client";

export default function MfaEnrollmentPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);

  useEffect(() => {
    async function enroll() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.replace("/control-room/login");
          return;
        }

        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
        });

        if (enrollError) {
          setError(enrollError.message);
          setEnrolling(false);
          return;
        }

        if (data) {
          setFactorId(data.id);
          setQrCode(data.totp.qr_code);
          setSecret(data.totp.secret);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to initialize MFA enrollment.");
      } finally {
        setEnrolling(false);
      }
    }
    enroll();
  }, [router]);

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6 digits from your authenticator app.");
      return;
    }
    if (!factorId) return;

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

      if (verifyError) {
        setError(verifyError.message || "Invalid verification code.");
        setLoading(false);
        return;
      }

      // Activate staff account on server
      await fetch("/api/control-room/me/activate", { method: "POST" });

      router.replace("/control-room");
    } catch {
      setError("Failed to verify code. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(60%_45%_at_50%_30%,var(--mint),transparent_70%)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <div className="card">
          <h1 className="mb-1 font-display text-2xl font-bold">Set up two-step verification</h1>
          <p className="mb-4 text-[15px] text-ink/70">
            Scan this QR code with Google Authenticator, Authy, or Apple Keychain to protect your staff account.
          </p>

          {enrolling ? (
            <div className="py-12 text-center text-sm text-ink/60">Generating your secure keys...</div>
          ) : (
            <form onSubmit={verifyCode} className="flex flex-col gap-4">
              {qrCode && (
                <div className="flex justify-center rounded-2xl bg-white p-4 shadow-xs">
                  <Image src={qrCode} alt="TOTP QR Code" width={180} height={180} unoptimized />
                </div>
              )}

              {secret && (
                <div className="rounded-xl border border-line bg-card p-3 text-center">
                  <div className="text-xs text-ink/60">Cannot scan? Enter secret key manually:</div>
                  <code className="mt-1 block font-mono text-xs font-bold select-all">{secret}</code>
                </div>
              )}

              <Field id="code" label="Enter 6-digit confirmation code" error={error || undefined}>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className={inputCls}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </Field>

              <button type="submit" disabled={loading} className={btn("brand", "md", "w-full")}>
                {loading ? "Verifying..." : "Activate Two-Step Verification"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
