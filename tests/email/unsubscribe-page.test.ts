import { describe, it, expect, vi } from "vitest";
import UnsubscribePage from "@/app/unsubscribe/page";
import * as adminModule from "@/lib/supabase/admin";
import { signUnsubscribeToken } from "@/lib/unsubscribe";

describe("Unsubscribe Page Component", () => {
  it("renders success state and sets unsubscribed_at when valid token is provided", async () => {
    const leadId = "test-lead-uuid-123";
    const token = signUnsubscribeToken(leadId);

    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const mockAdmin = {
      from: vi.fn().mockReturnValue({
        update: updateSpy,
      }),
    };

    vi.spyOn(adminModule, "getAdminClient").mockReturnValue(mockAdmin as unknown as ReturnType<typeof adminModule.getAdminClient>);

    const result = await UnsubscribePage({ searchParams: Promise.resolve({ t: token }) });

    // Validate update was invoked
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ unsubscribed_at: expect.any(String) })
    );

    expect(result).toBeDefined();
  });

  it("renders error state when token is missing or invalid", async () => {
    const result = await UnsubscribePage({ searchParams: Promise.resolve({ t: "invalid-token" }) });
    expect(result).toBeDefined();
  });
});
