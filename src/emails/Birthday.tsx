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

export interface BirthdayEmailProps {
  name?: string;
  discount?: number;
  unsubscribeUrl?: string;
}

const PARTNER_IDEAS = [
  { title: "Photographers", line: "Capture the day properly.", cta: "See photographers" },
  { title: "Birthday flyer designers", line: "A flyer worth sharing.", cta: "See flyers" },
  { title: "Portrait artists", line: "A painted keepsake.", cta: "See portraits" },
  { title: "Surprise event planners", line: "A surprise they will remember.", cta: "Plan a surprise" },
];

export function BirthdayEmail({
  name = "Friend",
  discount = 10,
  unsubscribeUrl = "https://albertnelly.com/unsubscribe",
}: BirthdayEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Happy Birthday from Albert Nelly! A special perk inside</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>Albert Nelly</Text>
          </Section>

          {/* Banner */}
          <Section style={heroBanner}>
            <Heading as="h1" style={heroHeading}>
              Happy birthday, {name}!
            </Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={paragraph}>
              Wishing you a wonderful birthday from all of us at Albert Nelly. We hope the coming year brings you bold projects, growth, and joy.
            </Text>

            {/* Birthday Voucher Box */}
            <Section style={voucherBox}>
              <Text style={voucherTitle}>{discount}% off your next project</Text>
              <Text style={voucherSubtitle}>Reply on WhatsApp to claim it.</Text>
            </Section>

            {/* Partner Showcase Cards */}
            <Section style={partnerSection}>
              {PARTNER_IDEAS.map((idea) => (
                <div key={idea.title} style={partnerCard}>
                  <Text style={partnerTitle}>{idea.title}</Text>
                  <Text style={partnerLine}>{idea.line}</Text>
                  <Link href="https://wa.me/2348149673898" style={partnerCta}>
                    {idea.cta}
                  </Link>
                </div>
              ))}
            </Section>

            <Section style={btnContainer}>
              <Link href="https://wa.me/2348149673898" style={primaryButton}>
                Talk to us on WhatsApp
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

export default BirthdayEmail;

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

const voucherBox: React.CSSProperties = {
  margin: "20px 0",
  padding: "16px",
  borderRadius: "12px",
  border: "2px solid #12B76A",
  backgroundColor: "#E9F8F0",
};

const voucherTitle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#06281E",
  margin: "0 0 4px 0",
};

const voucherSubtitle: React.CSSProperties = {
  fontSize: "14px",
  color: "#42594E",
  margin: 0,
};

const partnerSection: React.CSSProperties = {
  margin: "20px 0",
};

const partnerCard: React.CSSProperties = {
  border: "1px solid #CFE0D6",
  borderRadius: "10px",
  padding: "14px",
  marginBottom: "12px",
};

const partnerTitle: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: "15px",
  color: "#06281E",
  margin: "0 0 4px 0",
};

const partnerLine: React.CSSProperties = {
  fontSize: "13px",
  color: "#42594E",
  margin: "0 0 8px 0",
};

const partnerCta: React.CSSProperties = {
  display: "inline-block",
  borderRadius: "9999px",
  border: "1px solid #06281E",
  padding: "6px 14px",
  fontSize: "13px",
  fontWeight: "bold",
  color: "#06281E",
  textDecoration: "none",
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
