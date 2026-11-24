import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToCampaign } from "@/lib/control-room/server/mappers";

export async function POST() {
  return handle(async () => {
    const { supabase, user } = await requireStaff("campaigns", "edit");

    const newCampaign = {
      name: "Untitled campaign",
      subject: "",
      template: "promo" as const,
      audience_types: ["hire", "refer", "partner", "update"],
      status: "draft" as const,
      body: "",
      created_by: user.id,
    };

    const { data: created, error } = await supabase
      .from("campaigns")
      .insert(newCampaign)
      .select("*")
      .single();

    if (error || !created) throw new HttpError(400, error?.message || "Failed to create campaign.");

    await supabase.rpc("log_activity", { p_action: "Started a campaign", p_target: created.name });

    return rowToCampaign(created);
  });
}
