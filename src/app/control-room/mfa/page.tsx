"use client";

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
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.replace("/control-room/login");
          return;
        }

        // Check existing factors
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) {
          if (!cancelled) {
            setError(factorsError.message || "Failed to inspect authentication factors.");
            setEnrolling(false);
          }
          return;
        }

        // If user already has a verified TOTP factor, they don't need a new enrollment
        const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");
        if (verifiedTotp) {
          if (!cancelled) {
            setFactorId(verifiedTotp.id);
            setAlreadyEnrolled(true);
            setEnrolling(false);
          }
          return;
        }

        // Clean up any stale unverified factors from aborted attempts / page reloads
        const unverified = factors?.all?.filter((f) => f.status === "unverified") || [];
        if (unverified.length > 0) {
          await Promise.allSettled(
            unverified.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id }))
          );
        }

        // Fresh enrollment
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
        });

        if (cancelled) return;

        if (enrollError) {
          setError(enrollError.message || "Failed to generate authenticator keys.");
          setEnrolling(false);
          return;
        }

        if (data) {
          setFactorId(data.id);
          setQrCode(data.totp.qr_code);
          setSecret(data.totp.secret);
          setEnrolling(false);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to initialize MFA enrollment.");
          setEnrolling(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router, retryKey]);

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6 digits from your authenticator app.");
      return;
    }
    if (!factorId) {
      setError("No authentication factor found. Please reload.");
      return;
    }

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

      // Best effort activation on server
      try {
        await fetch("/api/control-room/me/activate", { method: "POST" });
      } catch {
        // Continue even if database migration pending
      }

      router.replace("/control-room");
    } catch {
      setError("Failed to verify code. Please try again.");
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError("");
    setEnrolling(true);
    setRetryKey((k) => k + 1);
  };

  // Extract raw SVG if the QR code is an SVG data URI or raw SVG markup
  const svgMarkup = qrCode?.startsWith("<svg")
    ? qrCode
    : qrCode?.startsWith("data:image/svg+xml;utf-8,")
    ? decodeURIComponent(qrCode.replace(/^data:image\/svg\+xml;utf-8,/, ""))
    : null;

  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(60%_45%_at_50%_30%,var(--mint),transparent_70%)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <div className="card">
          <h1 className="mb-1 font-display text-2xl font-bold">
            {alreadyEnrolled ? "Two-step verification" : "Set up two-step verification"}
          </h1>
          <p className="mb-4 text-[15px] text-ink/70">
            {alreadyEnrolled
              ? "Enter the 6-digit code from your authenticator app to access the Control Room."
              : "Scan this QR code with Google Authenticator, Authy, or Apple Keychain to protect your staff account."}
          </p>

          {enrolling ? (
            <div className="py-12 text-center text-sm text-ink/60">
              Generating your secure keys...
            </div>
          ) : (
            <form onSubmit={verifyCode} className="flex flex-col gap-4">
              {error && !qrCode && !secret && !alreadyEnrolled && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                  <p className="font-semibold">{error}</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-2 text-xs font-bold underline"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {svgMarkup ? (
                <div
                  className="flex justify-center rounded-2xl bg-white p-4 shadow-xs [&>svg]:h-[180px] [&>svg]:w-[180px] [&>svg]:block"
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              ) : qrCode ? (
                <div className="flex justify-center rounded-2xl bg-white p-4 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="TOTP QR Code" width={180} height={180} className="h-[180px] w-[180px]" />
                </div>
              ) : null}

              {secret && (
                <div className="rounded-xl border border-line bg-card p-3 text-center">
                  <div className="text-xs text-ink/60">Cannot scan? Enter secret key manually:</div>
                  <code className="mt-1 block font-mono text-xs font-bold select-all">{secret}</code>
                </div>
              )}

              <Field
                id="code"
                label="Enter 6-digit confirmation code"
                error={error && (qrCode || secret || alreadyEnrolled) ? error : undefined}
              >
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
                {loading
                  ? "Verifying..."
                  : alreadyEnrolled
                  ? "Verify & Continue"
                  : "Activate Two-Step Verification"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
