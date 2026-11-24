import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getUnsubscribeUrl } from "@/lib/unsubscribe";
import { renderCampaignEmail, renderWelcomeEmail, renderBirthdayEmail } from "@/emails";
import { sendBatch, type BatchEmailItem } from "@/lib/email";
import { logger } from "@/lib/logger";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, demo: true, processed: 0 });
  }

  const now = new Date().toISOString();

  // Find campaigns scheduled for now or in the past
  const { data: scheduledCampaigns, error: fetchErr } = await admin
    .from("campaigns")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processedCount = 0;

  for (const campaign of scheduledCampaigns) {
    const id = campaign.id;
    const subject = campaign.subject || "Announcement from Albert Nelly";
    const emailBody = campaign.body || "";
    const template = campaign.template || "promo";
    const audienceTypes = campaign.audience_types?.length
      ? campaign.audience_types
      : ["hire", "refer", "partner", "update"];

    // Mark as sending
    await admin
      .from("campaigns")
      .update({ status: "sending" })
      .eq("id", id);

    // Resolve eligible leads
    const { data: leads, error: leadsErr } = await admin
      .from("leads")
      .select("id, name, email, type")
      .in("type", audienceTypes)
      .neq("status", "archived")
      .eq("consent", true)
      .is("unsubscribed_at", null);

    if (leadsErr) {
      logger.error(`[cron] Could not fetch leads for campaign ${id}:`, { error: leadsErr });
      continue;
    }

    // Deduplicate by email
    const uniqueLeadsMap = new Map<string, { id: string; name: string | null; email: string }>();
    for (const lead of leads || []) {
      if (lead.email && !uniqueLeadsMap.has(lead.email.toLowerCase())) {
        uniqueLeadsMap.set(lead.email.toLowerCase(), lead);
      }
    }
    const targetLeads = Array.from(uniqueLeadsMap.values());

    if (targetLeads.length === 0) {
      await admin
        .from("campaigns")
        .update({
          status: "sent",
          sent_at: now,
          scheduled_for: null,
        })
        .eq("id", id);
      processedCount++;
      continue;
    }

    // Initialize recipient rows
    const recipientRowsToInsert = targetLeads.map((l) => ({
      campaign_id: id,
      lead_id: l.id,
    }));

    const { data: insertedRecipients } = await admin
      .from("campaign_recipients")
      .upsert(recipientRowsToInsert, { onConflict: "campaign_id,lead_id" })
      .select("id, lead_id");

    const recipientIdMap = new Map<string, string>();
    for (const r of insertedRecipients || []) {
      recipientIdMap.set(r.lead_id, r.id);
    }

    // Prepare batch items
    const batchItems: BatchEmailItem[] = [];
    const leadRecipientPairs: Array<{ recipientId: string; leadId: string }> = [];

    for (const lead of targetLeads) {
      const recipientId = recipientIdMap.get(lead.id) || lead.id;
      const unsubscribeUrl = getUnsubscribeUrl(lead.id);

      let renderedHtml = "";
      let renderedText = "";

      if (template === "welcome") {
        const res = await renderWelcomeEmail({ name: lead.name || "Friend", unsubscribeUrl });
        renderedHtml = res.html;
        renderedText = res.text;
      } else if (template === "birthday") {
        const res = await renderBirthdayEmail({ name: lead.name || "Friend", discount: 10, unsubscribeUrl });
        renderedHtml = res.html;
        renderedText = res.text;
      } else {
        const res = await renderCampaignEmail({
          headline: subject,
          body: emailBody,
          unsubscribeUrl,
        });
        renderedHtml = res.html;
        renderedText = res.text;
      }

      batchItems.push({
        to: lead.email,
        subject,
        html: renderedHtml,
        text: renderedText,
        unsubscribeUrl,
        tags: [
          { name: "campaign_id", value: id },
          { name: "recipient_id", value: recipientId },
        ],
      });

      leadRecipientPairs.push({ recipientId, leadId: lead.id });
    }

    const batchResult = await sendBatch(batchItems);

    // Save provider IDs
    for (let i = 0; i < batchResult.results.length; i++) {
      const res = batchResult.results[i];
      const pair = leadRecipientPairs[i];
      if (res?.id && pair) {
        await admin
          .from("campaign_recipients")
          .update({ provider_id: res.id })
          .eq("id", pair.recipientId);
      }
    }

    // Finalize campaign
    await admin
      .from("campaigns")
      .update({
        status: "sent",
        sent_at: now,
        scheduled_for: null,
      })
      .eq("id", id);

    processedCount++;
  }

  return NextResponse.json({ ok: true, processed: processedCount });
}
