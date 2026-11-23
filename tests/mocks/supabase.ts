import { vi } from "vitest";

export interface MockStaff {
  id: string;
  name: string;
  email: string;
  role: "owner" | "finance" | "sales" | "content";
  status: "active" | "invited" | "disabled";
}

export function createMockSupabase(options?: {
  user?: { id: string; email: string } | null;
  aal?: "aal1" | "aal2";
  staff?: MockStaff | null;
  queryResults?: Record<string, { data: unknown; error: unknown }>;
}) {
  const user =
    options?.user === undefined ? { id: "user-123", email: "staff@albertnelly.com" } : options.user;
  const aal = options?.aal || "aal2";
  const staff =
    options?.staff === undefined
      ? {
          id: "user-123",
          name: "Test User",
          email: "staff@albertnelly.com",
          role: "owner" as const,
          status: "active" as const,
        }
      : options.staff;

  const createQueryChain = (table: string) => {
    const chain: Record<string, unknown> = {};

    chain.select = vi.fn().mockReturnValue(chain);
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockImplementation(() => {
      if (table === "staff") {
        if (!staff) return Promise.resolve({ data: null, error: { message: "Staff not found" } });
        return Promise.resolve({ data: staff, error: null });
      }
      const custom = options?.queryResults?.[table];
      if (custom) return Promise.resolve(custom);
      return Promise.resolve({ data: { id: "test-id" }, error: null });
    });

    chain.then = (onfulfilled: (res: unknown) => unknown) => {
      const custom = options?.queryResults?.[table] || { data: [], error: null };
      return Promise.resolve(custom).then(onfulfilled);
    };

    return chain;
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: aal, nextLevel: aal },
          error: null,
        }),
      },
    },
    from: vi.fn().mockImplementation((table: string) => createQueryChain(table)),
  };
}
