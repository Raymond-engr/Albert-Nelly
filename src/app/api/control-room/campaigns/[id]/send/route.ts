import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToCampaign } from "@/lib/control-room/server/mappers";
import { getUnsubscribeUrl } from "@/lib/unsubscribe";
import { renderCampaignEmail, renderWelcomeEmail, renderBirthdayEmail } from "@/emails";
import { sendBatch, type BatchEmailItem } from "@/lib/email";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("campaigns", "edit");

    let body: { audienceSize?: number; name?: string; subject?: string; body?: string; template?: string; audience?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body optional if campaign already drafted
    }

    // 1. Fetch current campaign
    const { data: campaign, error: fetchErr } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !campaign) {
      throw new HttpError(404, "Campaign not found.");
    }

    if (campaign.status === "sent") {
      throw new HttpError(400, "Campaign has already been sent.");
    }

    const campaignName = (typeof body.name === "string" ? body.name.trim() : campaign.name) || "Untitled Campaign";
    const subject = (typeof body.subject === "string" ? body.subject.trim() : campaign.subject) || "Announcement from Albert Nelly";
    const emailBody = (typeof body.body === "string" ? body.body : campaign.body) || "";
    const template = (typeof body.template === "string" ? body.template : campaign.template) || "promo";

    let audienceTypes: string[] = campaign.audience_types || [];
    if (typeof body.audience === "string" && body.audience.trim()) {
      audienceTypes = body.audience.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (audienceTypes.length === 0) {
      audienceTypes = ["hire", "refer", "partner", "update"];
    }

    // 2. Query eligible leads: type in audience_types, status <> 'archived', consent = true, unsubscribed_at is null
    const { data: leads, error: leadsErr } = await supabase
      .from("leads")
      .select("id, name, email, type")
      .in("type", audienceTypes)
      .neq("status", "archived")
      .eq("consent", true)
      .is("unsubscribed_at", null);

    if (leadsErr) {
      throw new HttpError(500, `Could not resolve recipients: ${leadsErr.message}`);
    }

    // Deduplicate leads by email
    const uniqueLeadsMap = new Map<string, { id: string; name: string | null; email: string }>();
    for (const lead of leads || []) {
      if (lead.email && !uniqueLeadsMap.has(lead.email.toLowerCase())) {
        uniqueLeadsMap.set(lead.email.toLowerCase(), lead);
      }
    }
    const targetLeads = Array.from(uniqueLeadsMap.values());

    // 3. Mark campaign as sending
    await supabase
      .from("campaigns")
      .update({
        name: campaignName,
        subject,
        body: emailBody,
        template,
        audience_types: audienceTypes,
        status: "sending",
      })
      .eq("id", id);

    if (targetLeads.length === 0) {
      // No recipients eligible
      const { data: updatedEmpty } = await supabase
        .from("campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          scheduled_for: null,
        })
        .eq("id", id)
        .select("*")
        .single();

      await supabase.rpc("log_activity", {
        p_action: "Sent a campaign to 0 people",
        p_target: campaignName,
      });

      return rowToCampaign(updatedEmpty || campaign);
    }

    // 4. Create campaign_recipients rows
    const recipientRowsToInsert = targetLeads.map((l) => ({
      campaign_id: id,
      lead_id: l.id,
    }));

    const { data: insertedRecipients, error: recipientInsertErr } = await supabase
      .from("campaign_recipients")
      .upsert(recipientRowsToInsert, { onConflict: "campaign_id,lead_id" })
      .select("id, lead_id");

    if (recipientInsertErr || !insertedRecipients) {
      throw new HttpError(500, `Could not initialize recipients: ${recipientInsertErr?.message}`);
    }

    const recipientIdMap = new Map<string, string>();
    for (const r of insertedRecipients) {
      recipientIdMap.set(r.lead_id, r.id);
    }

    // 5. Prepare batch items and send
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

    // Record provider_ids on campaign_recipients rows
    for (let i = 0; i < batchResult.results.length; i++) {
      const res = batchResult.results[i];
      const pair = leadRecipientPairs[i];
      if (res?.id && pair) {
        await supabase
          .from("campaign_recipients")
          .update({ provider_id: res.id })
          .eq("id", pair.recipientId);
      }
    }

    // 6. Finalize campaign record
    const { data: finalCampaign, error: finalErr } = await supabase
      .from("campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        scheduled_for: null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (finalErr || !finalCampaign) {
      throw new HttpError(500, "Failed to finalize campaign status.");
    }

    await supabase.rpc("log_activity", {
      p_action: `Sent a campaign to ${targetLeads.length} people`,
      p_target: campaignName,
    });

    return rowToCampaign(finalCampaign);
  });
}
