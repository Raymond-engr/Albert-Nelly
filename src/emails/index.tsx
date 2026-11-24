import * as React from "react";
import { render } from "@react-email/render";
import { WelcomeEmail, type WelcomeEmailProps } from "./Welcome";
import { BirthdayEmail, type BirthdayEmailProps } from "./Birthday";
import { CampaignEmail, type CampaignEmailProps } from "./Campaign";

export async function renderWelcomeEmail(props: WelcomeEmailProps): Promise<{ html: string; text: string }> {
  const html = await render(<WelcomeEmail {...props} />);
  const text = await render(<WelcomeEmail {...props} />, { plainText: true });
  return { html, text };
}

export async function renderBirthdayEmail(props: BirthdayEmailProps): Promise<{ html: string; text: string }> {
  const html = await render(<BirthdayEmail {...props} />);
  const text = await render(<BirthdayEmail {...props} />, { plainText: true });
  return { html, text };
}

export async function renderCampaignEmail(props: CampaignEmailProps): Promise<{ html: string; text: string }> {
  const html = await render(<CampaignEmail {...props} />);
  const text = await render(<CampaignEmail {...props} />, { plainText: true });
  return { html, text };
}

export { WelcomeEmail, BirthdayEmail, CampaignEmail };
