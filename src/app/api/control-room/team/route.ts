import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/control-room/types";

export async function POST(req: Request) {
  return handle(async () => {
    await requireStaff("team", "edit");

    let body: { name?: string; email?: string; role?: Role };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { name, email, role } = body;
    if (!name || name.trim().length < 2) {
      throw new HttpError(422, "Name must be at least 2 characters.", { name: "Name too short" });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(422, "A valid email address is required.", { email: "Invalid email" });
    }
    const validRoles: Role[] = ["owner", "finance", "sales", "content"];
    if (!role || !validRoles.includes(role)) {
      throw new HttpError(422, "Invalid role specified.", { role: "Invalid role" });
    }

    const admin = getAdminClient();
    if (!admin) {
      throw new HttpError(500, "Database administration client unavailable.");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if staff already exists
    const { data: existingStaff } = await admin
      .from("staff")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingStaff) {
      throw new HttpError(409, "A staff member with this email already exists.", { email: "Already exists" });
    }

    const siteUrl = process.env.SITE_URL || "http://localhost:3000";
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      { redirectTo: `${siteUrl}/control-room/accept-invite` }
    );

    if (inviteError || !inviteData?.user) {
      console.error("[teamApi.invite]", inviteError);
      throw new HttpError(500, inviteError?.message ?? "Failed to send invitation.");
    }

    const newStaff = {
      id: inviteData.user.id,
      name: name.trim(),
      email: normalizedEmail,
      role,
      status: "invited" as const,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await admin.from("staff").insert(newStaff);
    if (insertError) {
      console.error("[teamApi.insert]", insertError);
      throw new HttpError(500, "Failed to record invited staff member.");
    }

    return newStaff;
  });
}
