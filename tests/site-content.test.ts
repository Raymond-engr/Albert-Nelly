import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockFrom = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe("getSiteContent", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns fallback static content if env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const { getSiteContent, defaultSiteContent } = await import("@/lib/site-content");
    const content = await getSiteContent();

    expect(content.services).toEqual(defaultSiteContent.services);
    expect(content.packages).toEqual(defaultSiteContent.packages);
    expect(content.partnerTiles).toEqual(defaultSiteContent.partnerTiles);
  });

  it("correctly maps and formats database content when queries succeed", async () => {
    mockFrom.mockImplementation((table: string) => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);

      if (table === "services") {
        chain.then = (fn: (res: unknown) => unknown) =>
          Promise.resolve({
            data: [
              {
                id: "1",
                scene: "wire",
                title: "UI Design",
                description: "Clean UI",
                audience: "Founders",
                price: { kind: "from", amount: 200000 },
                published: true,
              },
            ],
            error: null,
          }).then(fn);
      } else if (table === "packages") {
        chain.then = (fn: (res: unknown) => unknown) =>
          Promise.resolve({
            data: [
              {
                id: "p1",
                name: "Gold",
                description: "All in one",
                audience: "High schools",
                price: { kind: "exact", amount: 500000 },
                featured: true,
                features: ["A", "B"],
                more: ["C"],
              },
            ],
            error: null,
          }).then(fn);
      } else if (table === "running_costs") {
        chain.then = (fn: (res: unknown) => unknown) =>
          Promise.resolve({
            data: [{ id: "c1", item: "Hosting", amount: 25000 }],
            error: null,
          }).then(fn);
      } else if (table === "work_items") {
        chain.then = (fn: (res: unknown) => unknown) =>
          Promise.resolve({
            data: [
              {
                id: "w1",
                category: "Design",
                title: "Project Alpha",
                challenge: "Scale",
                result: "10x",
                published: true,
              },
            ],
            error: null,
          }).then(fn);
      } else if (table === "partners") {
        chain.then = (fn: (res: unknown) => unknown) =>
          Promise.resolve({
            data: [
              { id: "pr1", name: "Studio XYZ", status: "active", published: true },
            ],
            error: null,
          }).then(fn);
      } else if (table === "settings") {
        chain.maybeSingle = vi.fn().mockResolvedValue({
          data: { whatsapp_number: "+234 803 123 4567" },
          error: null,
        });
      }

      return chain;
    });

    const { getSiteContent } = await import("@/lib/site-content");
    const content = await getSiteContent();

    expect(content.services[0].title).toBe("UI Design");
    expect(content.services[0].price).toBe("from ₦200,000");

    expect(content.packages[0].name).toBe("Gold");
    expect(content.packages[0].price).toBe("₦500,000");
    expect(content.packages[0].featured).toBe(true);

    expect(content.runningCosts[0].item).toBe("Hosting");
    expect(content.runningCosts[0].amount).toBe("₦25,000");

    expect(content.work[0].title).toBe("Project Alpha");
    expect(content.partnerTiles).toContain("Studio XYZ");
    expect(content.whatsappNumber).toBe("2348031234567");
  });

  it("falls back to default content if a query throws an error", async () => {
    mockFrom.mockImplementation(() => {
      throw new Error("Connection failed");
    });

    const { getSiteContent, defaultSiteContent } = await import("@/lib/site-content");
    const content = await getSiteContent();

    expect(content).toEqual(defaultSiteContent);
  });
});
