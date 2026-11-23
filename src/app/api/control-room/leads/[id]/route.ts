import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToLead } from "@/lib/control-room/server/mappers";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("leads", "edit");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    if (body.status === "deal") {
      throw new HttpError(422, "Leads cannot be moved to 'deal' status directly. Use the convert endpoint.");
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.notes === "string") updates.notes = body.notes;
    if (Array.isArray(body.tags)) updates.tags = body.tags;
    if (typeof body.status === "string") updates.status = body.status;
    if (body.ownerId !== undefined) updates.owner_id = body.ownerId || null;

    let query = supabase.from("leads").update(updates).eq("id", id);
    if (typeof body.updatedAt === "string") {
      query = query.eq("updated_at", body.updatedAt);
    }

    const { data: updated, error } = await query.select("*").single();

    if (error || !updated) {
      if (body.updatedAt) {
        throw new HttpError(409, "Someone else changed this lead. Please reload to see their changes.");
      }
      throw new HttpError(error ? 400 : 404, error?.message || "Lead not found.");
    }

    const action = body.status === "archived" ? "Archived a lead" : "Edited a lead";
    await supabase.rpc("log_activity", { p_action: action, p_target: updated.name });

    return rowToLead(updated);
  });
}
