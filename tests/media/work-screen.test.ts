import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkScreen } from "@/components/control-room/content/WorkScreen";
import * as storeModule from "@/lib/control-room/store";

describe("WorkScreen Component - Media Upload Support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders work items with image thumbnail when imagePath is present", () => {
    const mockDb = {
      work: [
        {
          id: "work-1",
          title: "Apex Logistics Portal",
          category: "Development" as const,
          challenge: "Tracking delays",
          result: "Reduced by 40%",
          published: true,
          imagePath: "work/work-1.webp",
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

    const html = renderToStaticMarkup(React.createElement(WorkScreen));

    expect(html).toContain("Apex Logistics Portal");
    expect(html).toContain("Selected work");
    expect(html).toContain("work/work-1.webp");
  });
});
