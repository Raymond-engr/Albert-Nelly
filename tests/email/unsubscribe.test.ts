import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { signUnsubscribeToken, verifyUnsubscribeToken, getUnsubscribeUrl } from "@/lib/unsubscribe";

describe("Unsubscribe Token Management", () => {
  const originalEnv = process.env.UNSUBSCRIBE_SECRET;

  beforeEach(() => {
    process.env.UNSUBSCRIBE_SECRET = "test-secret-key-12345";
  });

  afterEach(() => {
    process.env.UNSUBSCRIBE_SECRET = originalEnv;
  });

  it("signs and successfully verifies a valid lead ID", () => {
    const leadId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
    const token = signUnsubscribeToken(leadId);

    expect(token).toContain(leadId);
    expect(token).toContain(".");

    const verifiedId = verifyUnsubscribeToken(token);
    expect(verifiedId).toBe(leadId);
  });

  it("rejects tampered tokens", () => {
    const leadId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
    const token = signUnsubscribeToken(leadId);

    // Tamper with leadId part
    const tamperedLead = token.replace("3fa85f64", "00000000");
    expect(verifyUnsubscribeToken(tamperedLead)).toBeNull();

    // Tamper with signature part
    const tamperedSig = token.slice(0, -4) + "abcd";
    expect(verifyUnsubscribeToken(tamperedSig)).toBeNull();
  });

  it("rejects tokens signed with a different secret", () => {
    const leadId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
    const token = signUnsubscribeToken(leadId);

    // Switch secret
    process.env.UNSUBSCRIBE_SECRET = "another-secret-key-99999";
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });

  it("handles malformed and empty tokens gracefully", () => {
    expect(verifyUnsubscribeToken("")).toBeNull();
    expect(verifyUnsubscribeToken("invalid-token-without-dot")).toBeNull();
    expect(verifyUnsubscribeToken("too.many.dots.here")).toBeNull();
    expect(verifyUnsubscribeToken(null as unknown as string)).toBeNull();
  });

  it("generates correct unsubscribe URL", () => {
    const leadId = "11111111-2222-3333-4444-555555555555";
    const url = getUnsubscribeUrl(leadId, "https://albertnelly.com");
    expect(url).toMatch(/^https:\/\/albertnelly\.com\/unsubscribe\?t=/);
    expect(url).toContain(encodeURIComponent(signUnsubscribeToken(leadId)));
  });
});
