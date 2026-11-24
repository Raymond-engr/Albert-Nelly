import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Staff } from "@/lib/control-room/types";

/**
 * Fire-and-forget server-side activity logger.
 * Calls the `log_activity` RPC which inserts into `public.activity_log`
 * with the acting staff's identity from the JWT.
 *
 * Never awaited by callers — a logging failure must never block a mutation.
 */
export function serverLogActivity(
  supabase: SupabaseClient,
  _staff: Staff,
  action: string,
  target = ""
): void {
  void Promise.resolve(
    supabase.rpc("log_activity", { p_action: action, p_target: target })
  ).then(({ error }) => {
    if (error) console.error("[activity]", error.message);
  }).catch((err: unknown) => {
    console.error("[activity]", err);
  });
}
