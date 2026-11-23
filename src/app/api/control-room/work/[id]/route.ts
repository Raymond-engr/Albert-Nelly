import { revalidatePath } from "next/cache";
import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToWorkItem } from "@/lib/control-room/server/mappers";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("work", "edit");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.challenge === "string") updates.challenge = body.challenge.trim();
    if (typeof body.result === "string") updates.result = body.result.trim();
    if (body.category === "Design" || body.category === "Development") updates.category = body.category;
    if (body.published !== undefined) updates.published = Boolean(body.published);
    if (body.imagePath !== undefined) updates.image_path = body.imagePath ? String(body.imagePath) : null;

    const { data: updated, error } = await supabase
      .from("work_items")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) throw new HttpError(error ? 400 : 404, error?.message || "Project not found.");

    await supabase.rpc("log_activity", { p_action: "Edited a project", p_target: updated.title });

    revalidatePath("/");
    return rowToWorkItem(updated);
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("work", "edit");

    const { data: before } = await supabase.from("work_items").select("title").eq("id", id).single();
    const { error } = await supabase.from("work_items").delete().eq("id", id);
    if (error) throw new HttpError(400, error.message);

    await supabase.rpc("log_activity", { p_action: "Removed a project", p_target: before?.title || "" });

    revalidatePath("/");
    return { ok: true, id };
  });
}
