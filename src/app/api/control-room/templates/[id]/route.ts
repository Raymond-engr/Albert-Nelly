import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToTemplate } from "@/lib/control-room/server/mappers";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("settings", "edit");

    let body: { body?: string };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    if (typeof body.body !== "string") {
      throw new HttpError(422, "Template body is required.");
    }

    const { data: updated, error } = await supabase
      .from("message_templates")
      .update({ body: body.body })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) throw new HttpError(error ? 400 : 404, error?.message || "Template not found.");

    await supabase.rpc("log_activity", { p_action: "Edited a message template", p_target: updated.label });

    return rowToTemplate(updated);
  });
}
