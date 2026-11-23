import crypto from "crypto";

function getSecret(): string {
  return process.env.UNSUBSCRIBE_SECRET || "albert-nelly-dev-unsubscribe-secret";
}

/**
 * Creates an HMAC-SHA256 signature for a lead ID.
 * Returns a URL-safe token in format `${leadId}.${signature}`.
 */
export function signUnsubscribeToken(leadId: string): string {
  const secret = getSecret();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(leadId)
    .digest("hex");
  return `${leadId}.${signature}`;
}

/**
 * Verifies an unsubscribe token.
 * Returns the leadId if valid, or null if tampered or invalid.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [leadId, receivedSig] = parts;
  if (!leadId || !receivedSig) return null;

  const secret = getSecret();
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(leadId)
    .digest("hex");

  try {
    const receivedBuf = Buffer.from(receivedSig, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");

    if (receivedBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(receivedBuf, expectedBuf)) return null;

    return leadId;
  } catch {
    return null;
  }
}

/**
 * Builds the full unsubscribe link for an email given the leadId and base site URL.
 */
export function getUnsubscribeUrl(leadId: string, siteUrl?: string): string {
  const base = siteUrl || process.env.SITE_URL || "https://albertnelly.com";
  const token = signUnsubscribeToken(leadId);
  return `${base.replace(/\/$/, "")}/unsubscribe?t=${encodeURIComponent(token)}`;
}
