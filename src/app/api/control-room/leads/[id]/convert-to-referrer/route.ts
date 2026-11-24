import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToReferrer } from "@/lib/control-room/server/mappers";
import { logger } from "@/lib/logger";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("referrers", "edit");

    let body: { rate?: number };
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // 1. Fetch target lead
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (leadErr || !lead) {
      throw new HttpError(404, "Lead not found.");
    }

    if (lead.type !== "refer") {
      throw new HttpError(422, "Only referrer leads can be promoted to referrers.");
    }

    // 2. Validate email uniqueness (case-insensitive)
    const normalizedEmail = (lead.email || "").trim().toLowerCase();
    const { data: existingRef } = await supabase
      .from("referrers")
      .select("id, name")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingRef) {
      throw new HttpError(409, `A referrer with email "${lead.email}" already exists (${existingRef.name}).`);
    }

    // 3. Resolve commission rate
    let commissionRate = typeof body.rate === "number" ? body.rate : 10;
    if (commissionRate < 0 || commissionRate > 100) {
      commissionRate = 10;
    }

    // 4. Create referrer row
    const { data: referrer, error: insertErr } = await supabase
      .from("referrers")
      .insert({
        name: lead.name,
        email: normalizedEmail,
        whatsapp: lead.whatsapp || "",
        rate: commissionRate,
        status: "active",
      })
      .select("*")
      .single();

    if (insertErr || !referrer) {
      logger.error("[leads.convert-to-referrer] Insert failed", { error: insertErr });
      throw new HttpError(500, insertErr?.message || "Failed to create referrer record.");
    }

    // 5. Update lead status to contacted
    await supabase
      .from("leads")
      .update({ status: "contacted" })
      .eq("id", id);

    // 6. Log activity
    await supabase.rpc("log_activity", {
      p_action: "Promoted lead to referrer",
      p_target: lead.name,
    });

    return rowToReferrer(referrer);
  });
}
