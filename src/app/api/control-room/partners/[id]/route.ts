import { revalidatePath } from "next/cache";
import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToPartner } from "@/lib/control-room/server/mappers";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("partners", "edit");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.category === "string") updates.category = body.category.trim();
    if (typeof body.note === "string") updates.note = body.note.trim();
    if (typeof body.link === "string") updates.link = body.link.trim();
    if (body.status === "active" || body.status === "pending") updates.status = body.status;
    if (body.published !== undefined) updates.published = Boolean(body.published);
    if (body.logoPath !== undefined) updates.logo_path = body.logoPath ? String(body.logoPath) : null;

    const { data: current } = await supabase.from("partners").select("status").eq("id", id).single();
    const effectiveStatus = updates.status || current?.status;
    if (updates.published === true && effectiveStatus !== "active") {
      throw new HttpError(422, "Partners must be active before they can be published.");
    }

    const { data: updated, error } = await supabase
      .from("partners")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) throw new HttpError(error ? 400 : 404, error?.message || "Partner not found.");

    await supabase.rpc("log_activity", { p_action: "Edited a partner", p_target: updated.name });

    revalidatePath("/");
    return rowToPartner(updated);
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("partners", "edit");

    const { data: before } = await supabase.from("partners").select("name").eq("id", id).single();
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) throw new HttpError(400, error.message);

    await supabase.rpc("log_activity", { p_action: "Removed a partner", p_target: before?.name || "" });

    revalidatePath("/");
    return { ok: true, id };
  });
}
