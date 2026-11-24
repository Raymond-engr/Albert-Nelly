import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToDeal, shouldRedactCommission } from "@/lib/control-room/server/mappers";
import { DEAL_STAGE_LABEL, type DealStage } from "@/lib/control-room/types";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase, staff } = await requireStaff("deals", "edit");

    let body: { stage?: DealStage };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { stage } = body;
    const validStages: DealStage[] = [
      "new",
      "conversation",
      "quote",
      "deposit",
      "progress",
      "delivered",
      "closed",
      "lost",
    ];

    if (!stage || !validStages.includes(stage)) {
      throw new HttpError(422, "Invalid deal stage provided.");
    }

    const { data: updated, error } = await supabase
      .from("deals")
      .update({ stage })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      throw new HttpError(error ? 400 : 404, error?.message || "Deal not found.");
    }

    const stageLabel = DEAL_STAGE_LABEL[stage] || stage;
    await supabase.rpc("log_activity", {
      p_action: `Moved a deal to ${stageLabel}`,
      p_target: updated.title,
    });

    return rowToDeal(updated, shouldRedactCommission(staff.role));
  });
}
