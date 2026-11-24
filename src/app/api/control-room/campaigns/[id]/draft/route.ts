import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToCampaign } from "@/lib/control-room/server/mappers";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("campaigns", "edit");

    const { data: updated, error } = await supabase
      .from("campaigns")
      .update({ status: "draft", scheduled_for: null })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) throw new HttpError(error ? 400 : 404, error?.message || "Campaign not found.");

    await supabase.rpc("log_activity", { p_action: "Moved a campaign back to draft", p_target: updated.name });

    return rowToCampaign(updated);
  });
}
