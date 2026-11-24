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

export interface WelcomeEmailProps {
  name?: string;
  unsubscribeUrl?: string;
}

export function WelcomeEmail({
  name = "Friend",
  unsubscribeUrl = "https://albertnelly.com/unsubscribe",
}: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Albert Nelly — thank you for connecting</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>Albert Nelly</Text>
          </Section>

          {/* Banner */}
          <Section style={heroBanner}>
            <Heading as="h1" style={heroHeading}>
              Welcome, {name}.
            </Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={paragraph}>
              Thanks for connecting with us. We design and build websites, apps, brands, and digital art for founders, businesses, and schools.
            </Text>
            <Text style={paragraph}>
              We share honest project breakdowns, design experiments, and practical software engineering lessons.
            </Text>
            <Text style={paragraph}>
              Whenever you want to discuss a new idea or project, feel free to reach out directly on WhatsApp.
            </Text>
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

export default WelcomeEmail;

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
