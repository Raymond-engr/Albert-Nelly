import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sendEmail, sendBatch, getDefaultFrom } from "@/lib/email";

describe("Email Transport Provider", () => {
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM = "Albert Nelly <hello@test.com>";
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalKey;
    process.env.EMAIL_FROM = originalFrom;
    vi.restoreAllMocks();
  });

  it("returns default from address", () => {
    expect(getDefaultFrom()).toBe("Albert Nelly <hello@test.com>");
  });

  it("handles mock transport gracefully when RESEND_API_KEY is not set", async () => {
    const result = await sendEmail({
      to: "recipient@example.com",
      subject: "Test Subject",
      html: "<p>Hello World</p>",
      unsubscribeUrl: "https://albertnelly.com/unsubscribe?t=test",
    });

    expect(result.id).toMatch(/^mock_/);
    expect(result.error).toBeUndefined();
  });

  it("handles mock batch transport gracefully", async () => {
    const items = [
      { to: "user1@example.com", subject: "S1", html: "<p>1</p>" },
      { to: "user2@example.com", subject: "S2", html: "<p>2</p>" },
    ];

    const result = await sendBatch(items);
    expect(result.results.length).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
    expect(result.results[0].id).toMatch(/^mock_batch_/);
  });

  it("returns empty batch results when items array is empty", async () => {
    const result = await sendBatch([]);
    expect(result.results).toEqual([]);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
  });
});
