import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

interface WebhookPayload {
  type: string;
  created_at?: string;
  data: {
    email_id?: string;
    id?: string;
    created_at?: string;
    tags?: Record<string, string> | Array<{ name: string; value: string }>;
  };
}

function parseTags(rawTags: unknown): Record<string, string> {
  if (!rawTags) return {};
  if (Array.isArray(rawTags)) {
    const map: Record<string, string> = {};
    for (const item of rawTags) {
      if (item && typeof item.name === "string" && typeof item.value === "string") {
        map[item.name] = item.value;
      }
    }
    return map;
  }
  if (typeof rawTags === "object") {
    return rawTags as Record<string, string>;
  }
  return {};
}

export async function POST(req: Request) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;

  if (secret) {
    const signature = req.headers.get("svix-signature") || req.headers.get("x-webhook-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.type;
  const emailId = payload.data?.email_id || payload.data?.id;
  const tags = parseTags(payload.data?.tags);
  const recipientId = tags.recipient_id;
  const now = new Date().toISOString();

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, demo: true });
  }

  // 1. Delivery & Engagement updates on campaign_recipients
  if (recipientId || emailId) {
    const updates: Record<string, unknown> = {};

    if (eventType === "email.delivered") {
      updates.delivered_at = now;
    } else if (eventType === "email.opened") {
      updates.opened_at = now;
    } else if (eventType === "email.clicked") {
      updates.clicked_at = now;
    } else if (eventType === "email.bounced") {
      updates.bounced_at = now;
    }

    if (Object.keys(updates).length > 0) {
      const query = admin.from("campaign_recipients").update(updates);
      if (recipientId) {
        await query.eq("id", recipientId);
      } else if (emailId) {
        await query.eq("provider_id", emailId);
      }
    }

    // Check birthday_sends table for email.opened
    if (emailId && eventType === "email.opened") {
      await admin
        .from("birthday_sends")
        .update({ opened_at: now })
        .eq("provider_id", emailId);
    }
  }

  // 2. Unsubscribe on hard bounces or spam complaints
  if (eventType === "email.bounced" || eventType === "email.complained") {
    if (recipientId) {
      // Find lead_id from recipient
      const { data: rec } = await admin
        .from("campaign_recipients")
        .select("lead_id")
        .eq("id", recipientId)
        .maybeSingle();

      if (rec?.lead_id) {
        await admin
          .from("leads")
          .update({ unsubscribed_at: now })
          .eq("id", rec.lead_id);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
