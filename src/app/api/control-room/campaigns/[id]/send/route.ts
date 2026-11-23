import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToCampaign } from "@/lib/control-room/server/mappers";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("campaigns", "edit");

    let body: { audienceSize?: number; name?: string; subject?: string; body?: string; template?: string; audience?: string };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const updates: Record<string, unknown> = {
      status: "sent",
      scheduled_for: null,
      sent_at: new Date().toISOString(),
    };
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.subject === "string") updates.subject = body.subject.trim();
    if (typeof body.body === "string") updates.body = body.body;
    if (typeof body.template === "string") updates.template = body.template;
    if (typeof body.audience === "string") {
      updates.audience_types = body.audience.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const { data: updated, error } = await supabase
      .from("campaigns")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) throw new HttpError(error ? 400 : 404, error?.message || "Campaign not found.");

    const count = body.audienceSize || 0;
    await supabase.rpc("log_activity", {
      p_action: `Sent a campaign to ${count} people`,
      p_target: updated.name,
    });

    return rowToCampaign(updated);
  });
}
