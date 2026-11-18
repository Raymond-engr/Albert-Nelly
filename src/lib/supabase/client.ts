import { createBrowserClient } from "@supabase/ssr";

/** Browser client (Control Room login, realtime). Uses the publishable key only. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars are missing. See .env.example.");
  return createBrowserClient(url, key);
}
