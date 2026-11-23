import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToReferrer } from "@/lib/control-room/server/mappers";

export async function POST(req: Request) {
  return handle(async () => {
    const { supabase } = await requireStaff("referrers", "edit");

    let body: { name?: string; email?: string; whatsapp?: string; rate?: number; status?: "active" | "paused" };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { name, email, whatsapp, rate = 0, status = "active" } = body;
    if (!name || name.trim().length < 2) throw new HttpError(422, "Name is required.");
    if (!email || !email.includes("@")) throw new HttpError(422, "Valid email is required.");
    if (!whatsapp) throw new HttpError(422, "WhatsApp number is required.");

    const { data: created, error } = await supabase
      .from("referrers")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        rate: Number(rate) || 0,
        status,
      })
      .select("*")
      .single();

    if (error || !created) throw new HttpError(400, error?.message || "Failed to create referrer.");

    await supabase.rpc("log_activity", { p_action: "Added a referrer", p_target: created.name });

    return rowToReferrer(created);
  });
}
