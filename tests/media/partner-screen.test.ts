import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PartnersScreen } from "@/components/control-room/content/PartnersScreen";
import * as storeModule from "@/lib/control-room/store";

describe("PartnersScreen Component - Logo Upload Support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders partner records with logo thumbnail when logoPath is present", () => {
    const mockDb = {
      partners: [
        {
          id: "partner-1",
          name: "Lekki Lens Studio",
          category: "Photography",
          note: "Event photos",
          link: "https://lekkilens.com",
          status: "active" as const,
          published: true,
          logoPath: "partners/partner-1.svg",
        },
      ],
    };

    vi.spyOn(storeModule, "useDb").mockReturnValue(mockDb as unknown as ReturnType<typeof storeModule.useDb>);
    vi.spyOn(storeModule, "useSession").mockReturnValue({
      id: "staff-1",
      name: "Owner",
      email: "owner@example.com",
      role: "owner",
      status: "active",
      lastSeen: null,
    });

    const html = renderToStaticMarkup(React.createElement(PartnersScreen));

    expect(html).toContain("Lekki Lens Studio");
    expect(html).toContain("Partners");
    expect(html).toContain("partners/partner-1.svg");
  });
});
