import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToDeal, shouldRedactCommission } from "@/lib/control-room/server/mappers";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase, staff } = await requireStaff("deals", "edit");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.client === "string") updates.client = body.client.trim();
    if (typeof body.service === "string") updates.service = body.service.trim();
    if (typeof body.notes === "string") updates.notes = body.notes;
    if (body.agreed !== undefined) updates.agreed = Math.floor(Number(body.agreed) || 0);
    if (body.referrerId !== undefined) updates.referrer_id = body.referrerId || null;

    if (body.commissionRate !== undefined) {
      if (staff.role === "sales" || staff.role === "content") {
        throw new HttpError(403, "Your role cannot modify commission rates.");
      }
      updates.commission_rate = body.commissionRate != null ? Number(body.commissionRate) : null;
    }

    let query = supabase.from("deals").update(updates).eq("id", id);
    if (typeof body.updatedAt === "string") {
      query = query.eq("updated_at", body.updatedAt);
    }

    const { data: updated, error } = await query.select("*").single();

    if (error || !updated) {
      if (body.updatedAt) {
        throw new HttpError(409, "Someone else changed this deal. Please reload to see their changes.");
      }
      throw new HttpError(error ? 400 : 404, error?.message || "Deal not found.");
    }

    await supabase.rpc("log_activity", { p_action: "Edited a deal", p_target: updated.title });

    return rowToDeal(updated, shouldRedactCommission(staff.role));
  });
}
