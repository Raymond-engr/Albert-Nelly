import { revalidatePath } from "next/cache";
import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToSettings } from "@/lib/control-room/server/mappers";

export async function PATCH(req: Request) {
  return handle(async () => {
    const { supabase } = await requireStaff("settings", "edit");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.whatsappNumber === "string") updates.whatsapp_number = body.whatsappNumber.trim();
    if (body.birthdayDiscount !== undefined) updates.birthday_discount = Number(body.birthdayDiscount);
    if (body.commissionMin !== undefined) updates.commission_min = Number(body.commissionMin);
    if (body.commissionMax !== undefined) updates.commission_max = Number(body.commissionMax);

    const { data: updated, error } = await supabase
      .from("settings")
      .update(updates)
      .eq("id", true)
      .select("*")
      .single();

    if (error || !updated) throw new HttpError(400, error?.message || "Failed to update settings.");

    await supabase.rpc("log_activity", { p_action: "Changed the settings", p_target: "" });

    revalidatePath("/");
    return rowToSettings(updated);
  });
}
