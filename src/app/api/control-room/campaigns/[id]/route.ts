import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToCampaign } from "@/lib/control-room/server/mappers";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("campaigns", "edit");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const updates: Record<string, unknown> = {};
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

    await supabase.rpc("log_activity", { p_action: "Saved a campaign draft", p_target: updated.name });

    return rowToCampaign(updated);
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("campaigns", "edit");

    const { data: before } = await supabase.from("campaigns").select("name, status").eq("id", id).single();
    if (!before) throw new HttpError(404, "Campaign not found.");

    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) throw new HttpError(400, error.message);

    await supabase.rpc("log_activity", { p_action: "Deleted a campaign", p_target: before.name });

    return { ok: true, id };
  });
}
