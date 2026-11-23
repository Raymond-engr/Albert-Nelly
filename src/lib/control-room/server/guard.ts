import "server-only";
import { createClient } from "@/lib/supabase/server";
import { can, type Area } from "@/lib/control-room/roles";
import type { Staff } from "@/lib/control-room/types";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Throws unless a signed-in, active, 2-step-verified staff member may do `need` in `area`. */
export async function requireStaff(area: Area, need: "view" | "edit" = "view") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new HttpError(401, "Sign in to continue.");
  }

  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.data?.currentLevel !== "aal2") {
    throw new HttpError(401, "Two-step verification is required.");
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id,name,email,role,status")
    .eq("id", user.id)
    .single();

  if (staffError || !staff || staff.status !== "active") {
    throw new HttpError(403, "This account is not active.");
  }

  if (!can(staff.role, area, need)) {
    throw new HttpError(403, "Your role can’t do this.");
  }

  return { supabase, staff: staff as Staff, user };
}

/** Wrap every handler: turns HttpError into { ok: false, error } and hides unexpected errors. */
export async function handle<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const data = await fn();
    return Response.json({ ok: true, data });
  } catch (e: unknown) {
    if (e instanceof HttpError) {
      return Response.json(
        { ok: false, error: e.message, fields: e.fields },
        { status: e.status }
      );
    }
    console.error("[control-room]", e);
    return Response.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
