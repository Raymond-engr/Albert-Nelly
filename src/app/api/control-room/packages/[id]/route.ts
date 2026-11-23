import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToPackage } from "@/lib/control-room/server/mappers";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("packages", "edit");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    if (body.featured === true) {
      await supabase.rpc("set_featured_package", { p_id: id });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.description === "string") updates.description = body.description.trim();
    if (typeof body.audience === "string") updates.audience = body.audience.trim();
    if (body.price !== undefined) updates.price = body.price;
    if (Array.isArray(body.features)) updates.features = body.features;
    if (Array.isArray(body.more)) updates.more = body.more;
    if (body.featured === false) updates.featured = false;

    const { data: updated, error } = await supabase
      .from("packages")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      throw new HttpError(400, error?.message || "Failed to update package.");
    }

    await supabase.rpc("log_activity", { p_action: "Edited a school package", p_target: updated.name });

    return rowToPackage(updated);
  });
}
