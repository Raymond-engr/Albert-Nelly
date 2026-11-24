import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Work from "@/components/showroom/Work";
import Partners from "@/components/showroom/Partners";
import { SceneProvider } from "@/providers/SceneProvider";
import { RegistrationProvider } from "@/providers/RegistrationProvider";
import * as providerModule from "@/providers/SiteContentProvider";

describe("Showroom Media Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://xyzcompany.supabase.co";
  });

  it("renders work section with image when imagePath is present", () => {
    const mockContent = {
      services: [],
      packages: [],
      runningCosts: [],
      work: [
        {
          category: "Design" as const,
          title: "Branding for PayWave",
          challenge: "Outdated look",
          result: "Tripled user trust",
          imagePath: "work/paywave.webp",
        },
      ],
      partnerTiles: [],
      whatsappNumber: "2348149673898",
    };

    vi.spyOn(providerModule, "useSiteContent").mockReturnValue(mockContent);

    const html = renderToStaticMarkup(
      React.createElement(SceneProvider, null, React.createElement(Work))
    );

    expect(html).toContain("Branding for PayWave");
    expect(html).toContain("paywave.webp");
    expect(html).toContain("alt=\"Branding for PayWave\"");
  });

  it("renders partner section with logo when logoPath is present", () => {
    const mockContent = {
      services: [],
      packages: [],
      runningCosts: [],
      work: [],
      partnerTiles: ["TechCabal"],
      partnerLogos: { TechCabal: "partners/techcabal.svg" },
      whatsappNumber: "2348149673898",
    };

    vi.spyOn(providerModule, "useSiteContent").mockReturnValue(mockContent);

    const html = renderToStaticMarkup(
      React.createElement(
        SceneProvider,
        null,
        React.createElement(RegistrationProvider, null, React.createElement(Partners))
      )
    );

    expect(html).toContain("techcabal.svg");
    expect(html).toContain("alt=\"TechCabal\"");
  });
});
