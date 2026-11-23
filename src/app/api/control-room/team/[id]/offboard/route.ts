import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("team", "edit");

    const admin = getAdminClient();
    if (!admin) throw new HttpError(500, "Database administration client unavailable.");

    // Fetch the target staff member.
    const { data: target } = await admin.from("staff").select("id,name,role,status").eq("id", id).single();
    if (!target) throw new HttpError(404, "Team member not found.");

    if (target.status === "disabled") {
      throw new HttpError(422, "This team member is already disabled.");
    }

    // Last-owner guard: prevent leaving zero active Owners.
    if (target.role === "owner") {
      const { data: owners } = await admin
        .from("staff")
        .select("id")
        .eq("role", "owner")
        .eq("status", "active");

      if (!owners || owners.length <= 1) {
        throw new HttpError(422, "Cannot offboard the last active Owner.");
      }
    }

    // 1. Disable the staff row.
    const { error: staffError } = await admin
      .from("staff")
      .update({ status: "disabled" })
      .eq("id", id);

    if (staffError) {
      logger.error("[team.offboard] Failed to disable staff row", { staffId: id, error: staffError });
      throw new HttpError(500, "Failed to disable team member.");
    }

    // 2. Ban the Supabase Auth user so active sessions are immediately invalidated.
    //    ban_duration: "none" means indefinitely banned.
    const { error: banError } = await admin.auth.admin.updateUserById(id, { ban_duration: "none" });

    if (banError) {
      // The staff row is already disabled; log the auth failure but don't surface it to the caller.
      logger.error("[team.offboard] Staff disabled but auth ban failed", { staffId: id, error: banError });
    }

    await supabase.rpc("log_activity", {
      p_action: "Offboarded a team member",
      p_target: target.name,
    });

    return { ok: true, id, status: "disabled" };
  });
}
