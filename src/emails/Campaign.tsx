import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Hr,
  Preview,
} from "@react-email/components";

export interface CampaignEmailProps {
  headline?: string;
  body?: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
}

export function CampaignEmail({
  headline = "Updates from Albert Nelly",
  body = "Your message content goes here.",
  ctaText = "Talk to us on WhatsApp",
  ctaUrl = "https://wa.me/2348149673898",
  unsubscribeUrl = "https://albertnelly.com/unsubscribe",
}: CampaignEmailProps) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Html lang="en">
      <Head />
      <Preview>{headline}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>Albert Nelly</Text>
          </Section>

          {/* Banner */}
          <Section style={heroBanner}>
            <Heading as="h1" style={heroHeading}>
              {headline}
            </Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={paragraph}>
                {p}
              </Text>
            ))}

            <Section style={btnContainer}>
              <Link href={ctaUrl} style={primaryButton}>
                {ctaText}
              </Link>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Albert Nelly. You are receiving this email because you registered on our website.{" "}
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default CampaignEmail;

const main: React.CSSProperties = {
  backgroundColor: "#FAF8F5",
  fontFamily: "Arial, Helvetica, sans-serif",
  padding: "20px 0",
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #E5E7EB",
};

const header: React.CSSProperties = {
  padding: "20px 24px",
  borderBottom: "1px solid #F3F4F6",
};

const logoText: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#06281E",
  margin: 0,
};

const heroBanner: React.CSSProperties = {
  backgroundColor: "#E9F8F0",
  padding: "32px 24px",
};

const heroHeading: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: "bold",
  color: "#06281E",
  margin: 0,
  lineHeight: "1.2",
};

const content: React.CSSProperties = {
  padding: "24px",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#06281E",
  margin: "0 0 16px 0",
};

const btnContainer: React.CSSProperties = {
  marginTop: "24px",
  marginBottom: "16px",
};

const primaryButton: React.CSSProperties = {
  backgroundColor: "#F7B733",
  color: "#06281E",
  fontWeight: "bold",
  fontSize: "15px",
  padding: "12px 24px",
  borderRadius: "9999px",
  textDecoration: "none",
  display: "inline-block",
};

const divider: React.CSSProperties = {
  borderTop: "1px solid #E9F8F0",
  margin: 0,
};

const footer: React.CSSProperties = {
  padding: "20px 24px",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#42594E",
  lineHeight: "1.5",
  margin: 0,
};

const footerLink: React.CSSProperties = {
  color: "#06281E",
  textDecoration: "underline",
};
