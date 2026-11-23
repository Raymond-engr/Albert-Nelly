import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  validateUpload,
  getStoragePath,
  getPublicMediaUrl,
  MEDIA_BUCKET,
} from "@/lib/media";

describe("Media Helpers", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://xyzcompany.supabase.co";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
  });

  it("validates allowed work screenshot formats and sizes", () => {
    // Valid 100 KB WebP
    const res1 = validateUpload("work", "image/webp", 100 * 1024);
    expect(res1.valid).toBe(true);
    expect(res1.warning).toBeUndefined();

    // Valid 200 KB WebP (triggers advisory warning)
    const res2 = validateUpload("work", "image/webp", 200 * 1024);
    expect(res2.valid).toBe(true);
    expect(res2.warning).toContain("Recommended budget for screenshots is 150 KB");

    // Over 500 KB (rejected)
    const res3 = validateUpload("work", "image/webp", 550 * 1024);
    expect(res3.valid).toBe(false);
    expect(res3.error).toContain("exceeds the maximum limit");

    // Disallowed MIME type
    const res4 = validateUpload("work", "image/gif", 50 * 1024);
    expect(res4.valid).toBe(false);
    expect(res4.error).toContain("Unsupported file type");
  });

  it("validates allowed partner logo formats and sizes", () => {
    // Valid SVG
    const res1 = validateUpload("partner", "image/svg+xml", 40 * 1024);
    expect(res1.valid).toBe(true);

    // Over 100 KB logo rejected
    const res2 = validateUpload("partner", "image/png", 120 * 1024);
    expect(res2.valid).toBe(false);
    expect(res2.error).toContain("exceeds the maximum limit");

    // Disallowed MIME
    const res3 = validateUpload("partner", "image/jpeg", 50 * 1024);
    expect(res3.valid).toBe(false);
  });

  it("derives deterministic storage paths based on entity type and content type", () => {
    expect(getStoragePath("work", "w123", "image/webp")).toBe("work/w123.webp");
    expect(getStoragePath("work", "w123", "image/png")).toBe("work/w123.png");
    expect(getStoragePath("partner", "p456", "image/svg+xml")).toBe("partners/p456.svg");
    expect(getStoragePath("partner", "p456", "image/webp")).toBe("partners/p456.webp");
  });

  it("resolves public storage URLs cleanly", () => {
    const url = getPublicMediaUrl("work/w123.webp");
    expect(url).toBe(`https://xyzcompany.supabase.co/storage/v1/object/public/${MEDIA_BUCKET}/work/w123.webp`);

    // Absolute URLs returned as-is
    expect(getPublicMediaUrl("https://cdn.example.com/pic.png")).toBe("https://cdn.example.com/pic.png");
    expect(getPublicMediaUrl(null)).toBeNull();
  });
});
