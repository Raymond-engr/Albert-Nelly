import { revalidatePath } from "next/cache";
import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToRunningCost } from "@/lib/control-room/server/mappers";
import type { RunningCost } from "@/lib/control-room/types";

export async function PUT(req: Request) {
  return handle(async () => {
    const { supabase } = await requireStaff("packages", "edit");

    let rows: RunningCost[];
    try {
      rows = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    if (!Array.isArray(rows)) {
      throw new HttpError(422, "Expected array of running costs.");
    }

    const inserts = rows.map((r, i) => {
      const item = typeof r.item === "string" ? r.item.trim() : "";
      if (!item) {
        throw new HttpError(422, "Running cost item name cannot be empty.");
      }
      return {
        position: i + 1,
        item,
        amount: Math.floor(Math.max(0, Number(r.amount) || 0)),
      };
    });

    // Delete existing rows after payload is fully validated
    const { error: delError } = await supabase
      .from("running_costs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (delError) {
      throw new HttpError(400, delError.message || "Failed to clear running costs.");
    }

    if (inserts.length > 0) {
      const { data: inserted, error } = await supabase
        .from("running_costs")
        .insert(inserts)
        .select("*")
        .order("position");

      if (error) throw new HttpError(400, error.message);
      await supabase.rpc("log_activity", { p_action: "Updated the yearly running costs", p_target: "" });
      revalidatePath("/");
      return (inserted || []).map(rowToRunningCost);
    }

    await supabase.rpc("log_activity", { p_action: "Updated the yearly running costs", p_target: "" });
    revalidatePath("/");
    return [];
  });
}
