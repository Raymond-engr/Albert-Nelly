import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { handle, HttpError } from "@/lib/control-room/server/guard";

export async function POST() {
  return handle(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new HttpError(401, "Sign in to continue.");
    }

    const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal.data?.currentLevel !== "aal2") {
      throw new HttpError(401, "Two-step verification must be completed first.");
    }

    const admin = getAdminClient();
    if (!admin) {
      throw new HttpError(500, "Database administration client unavailable.");
    }

    const { error: updateError } = await admin
      .from("staff")
      .update({ status: "active", last_seen_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      console.error("[activate]", updateError);
      throw new HttpError(500, "Failed to activate staff account.");
    }

    return { activated: true };
  });
}
