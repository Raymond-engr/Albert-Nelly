import { Resend } from "resend";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  unsubscribeUrl?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export interface BatchEmailItem extends EmailOptions {
  to: string;
}

export interface SendResult {
  id: string;
  error?: string;
}

export interface BatchSendResult {
  results: SendResult[];
  successCount: number;
  failureCount: number;
}

let resendClient: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function getDefaultFrom(): string {
  return process.env.EMAIL_FROM || "Albert Nelly <hello@albertnelly.com>";
}

/**
 * Normalizes headers and attaches List-Unsubscribe when unsubscribeUrl is provided.
 */
function prepareHeaders(options: EmailOptions): Record<string, string> {
  const headers: Record<string, string> = { ...(options.headers || {}) };
  if (options.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${options.unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  return headers;
}

/**
 * Sends a single email via Resend or logs in mock mode if unconfigured.
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  const client = getClient();
  const from = options.from || getDefaultFrom();
  const headers = prepareHeaders(options);

  if (!client) {
    const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    // Mock transport for offline/test environments
    return { id: mockId };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      headers,
      tags: options.tags,
    });

    if (error || !data) {
      return { id: "", error: error?.message || "Failed to send email" };
    }

    return { id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected email delivery error";
    return { id: "", error: message };
  }
}

/**
 * Sends a batch of emails, partitioning into chunks of 100 to stay within provider limits.
 */
export async function sendBatch(items: BatchEmailItem[]): Promise<BatchSendResult> {
  if (items.length === 0) {
    return { results: [], successCount: 0, failureCount: 0 };
  }

  const client = getClient();
  const chunkSize = 100;
  const allResults: SendResult[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    if (!client) {
      // Mock mode for tests and demo environments
      for (let k = 0; k < chunk.length; k++) {
        const mockId = `mock_batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        allResults.push({ id: mockId });
      }
      continue;
    }

    try {
      const payload = chunk.map((item) => ({
        from: item.from || getDefaultFrom(),
        to: item.to,
        subject: item.subject,
        html: item.html,
        text: item.text,
        replyTo: item.replyTo,
        headers: prepareHeaders(item),
        tags: item.tags,
      }));

      const { data, error } = await client.batch.send(payload);

      if (error || !data) {
        const errMsg = error?.message || "Batch send failed";
        for (let k = 0; k < chunk.length; k++) {
          allResults.push({ id: "", error: errMsg });
        }
      } else {
        for (const res of data.data) {
          allResults.push({ id: res.id });
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Batch send exception";
      for (let k = 0; k < chunk.length; k++) {
        allResults.push({ id: "", error: errMsg });
      }
    }
  }

  const successCount = allResults.filter((r) => !!r.id && !r.error).length;
  const failureCount = allResults.length - successCount;

  return { results: allResults, successCount, failureCount };
}
