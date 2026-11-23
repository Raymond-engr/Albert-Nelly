import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToService } from "@/lib/control-room/server/mappers";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("services", "edit");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { data: before } = await supabase.from("services").select("*").eq("id", id).single();
    if (!before) throw new HttpError(404, "Service not found.");

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.description === "string") updates.description = body.description.trim();
    if (typeof body.audience === "string") updates.audience = body.audience.trim();
    if (typeof body.badge === "string") updates.badge = body.badge.trim();
    if (body.price !== undefined) updates.price = body.price;
    if (body.published !== undefined) updates.published = Boolean(body.published);

    const { data: updated, error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      throw new HttpError(400, error?.message || "Failed to update service.");
    }

    const priceChanged = body.price && JSON.stringify(body.price) !== JSON.stringify(before.price);
    const action = priceChanged ? "Changed the price display" : "Edited a service";
    await supabase.rpc("log_activity", { p_action: action, p_target: updated.title });

    return rowToService(updated);
  });
}
