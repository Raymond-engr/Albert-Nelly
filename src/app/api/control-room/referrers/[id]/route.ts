import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToReferrer } from "@/lib/control-room/server/mappers";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("referrers", "edit");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.email === "string") updates.email = body.email.trim().toLowerCase();
    if (typeof body.whatsapp === "string") updates.whatsapp = body.whatsapp.trim();
    if (body.rate !== undefined) updates.rate = Number(body.rate) || 0;
    if (body.status === "active" || body.status === "paused") updates.status = body.status;

    const { data: updated, error } = await supabase
      .from("referrers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) throw new HttpError(error ? 400 : 404, error?.message || "Referrer not found.");

    await supabase.rpc("log_activity", { p_action: "Edited a referrer", p_target: updated.name });

    return rowToReferrer(updated);
  });
}
