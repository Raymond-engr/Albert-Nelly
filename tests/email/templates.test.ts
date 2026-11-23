import { describe, it, expect } from "vitest";
import {
  renderWelcomeEmail,
  renderBirthdayEmail,
  renderCampaignEmail,
} from "@/emails";

describe("Email Templates Rendering", () => {
  it("renders Welcome email to HTML and plain text", async () => {
    const { html, text } = await renderWelcomeEmail({
      name: "Tunde",
      unsubscribeUrl: "https://albertnelly.com/unsubscribe?t=abc",
    });

    expect(html).toContain("Welcome");
    expect(html).toContain("Tunde");
    expect(html).toContain("https://albertnelly.com/unsubscribe?t=abc");
    expect(html).toContain("Albert Nelly");
    expect(text.toUpperCase()).toContain("TUNDE");
  });

  it("renders Birthday email with discount voucher and partner ideas", async () => {
    const { html, text } = await renderBirthdayEmail({
      name: "Chidinma",
      discount: 15,
      unsubscribeUrl: "https://albertnelly.com/unsubscribe?t=xyz",
    });

    expect(html).toContain("Happy birthday");
    expect(html).toContain("Chidinma");
    expect(html).toContain("off your next project");
    expect(html).toContain("Photographers");
    expect(html).toContain("Portrait artists");
    expect(text).toContain("15% off your next project");
  });

  it("renders Campaign email with custom headline, body paragraphs, and cta", async () => {
    const { html, text } = await renderCampaignEmail({
      headline: "Q4 Web Design Showcase",
      body: "We just launched our new portfolio.\n\nTake a look at the projects.",
      ctaText: "Check our work",
      ctaUrl: "https://albertnelly.com/#work",
      unsubscribeUrl: "https://albertnelly.com/unsubscribe?t=123",
    });

    expect(html).toContain("Q4 Web Design Showcase");
    expect(html).toContain("We just launched our new portfolio.");
    expect(html).toContain("Take a look at the projects.");
    expect(html).toContain("Check our work");
    expect(text.toUpperCase()).toContain("Q4 WEB DESIGN SHOWCASE");
  });
});
