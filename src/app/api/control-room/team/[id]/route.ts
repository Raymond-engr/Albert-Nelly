import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { rowToStaff } from "@/lib/control-room/server/mappers";
import type { Role } from "@/lib/control-room/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("team", "edit");

    let body: { role?: Role };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { role } = body;
    const validRoles: Role[] = ["owner", "finance", "sales", "content"];
    if (!role || !validRoles.includes(role)) {
      throw new HttpError(422, "Valid role is required.");
    }

    const admin = getAdminClient();
    if (!admin) {
      throw new HttpError(500, "Database administration client unavailable.");
    }

    // Check if target is an active owner and demotion would leave no active owner
    const { data: target } = await admin.from("staff").select("*").eq("id", id).single();
    if (!target) throw new HttpError(404, "Team member not found.");

    if (target.role === "owner" && role !== "owner") {
      const { data: owners } = await admin
        .from("staff")
        .select("id")
        .eq("role", "owner")
        .eq("status", "active");

      if (!owners || owners.length <= 1) {
        throw new HttpError(422, "Cannot demote the last active Owner.");
      }
    }

    const { data: updated, error } = await admin
      .from("staff")
      .update({ role })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) throw new HttpError(400, error?.message || "Failed to update role.");

    await supabase.rpc("log_activity", {
      p_action: `Changed a role to ${role}`,
      p_target: updated.name,
    });

    return rowToStaff(updated);
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("team", "edit");

    const admin = getAdminClient();
    if (!admin) {
      throw new HttpError(500, "Database administration client unavailable.");
    }

    const { data: target } = await admin.from("staff").select("*").eq("id", id).single();
    if (!target) throw new HttpError(404, "Team member not found.");

    if (target.role === "owner" && target.status === "active") {
      const { data: owners } = await admin
        .from("staff")
        .select("id")
        .eq("role", "owner")
        .eq("status", "active");

      if (!owners || owners.length <= 1) {
        throw new HttpError(422, "Cannot remove the last active Owner.");
      }
    }

    const { error: staffDelError } = await admin.from("staff").delete().eq("id", id);
    if (staffDelError) throw new HttpError(400, staffDelError.message);

    // Optionally delete from auth if admin client is available
    const fullAdmin = getAdminClient();
    if (fullAdmin) {
      await fullAdmin.auth.admin.deleteUser(id).catch((e) => {
        console.warn("[team.deleteUser]", e);
      });
    }

    await supabase.rpc("log_activity", {
      p_action: "Removed a team member",
      p_target: target.name,
    });

    return { ok: true, id };
  });
}
