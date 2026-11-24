import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToDeal, shouldRedactCommission } from "@/lib/control-room/server/mappers";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  return handle(async () => {
    const { supabase, staff, user } = await requireStaff("deals", "edit");

    let body: {
      title?: string;
      client?: string;
      service?: string;
      agreed?: number;
      leadId?: string | null;
      referrerId?: string | null;
    };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { title, client, service, agreed = 0, leadId, referrerId } = body;
    if (!title || title.trim().length < 2) {
      throw new HttpError(422, "Deal name is required.", { title: "Title required" });
    }
    if (!client || client.trim().length < 2) {
      throw new HttpError(422, "Client name is required.", { client: "Client required" });
    }
    if (!service) {
      throw new HttpError(422, "Service is required.", { service: "Service required" });
    }
    if (agreed < 0) {
      throw new HttpError(422, "Agreed price cannot be negative.", { agreed: "Invalid price" });
    }

    let commissionRate: number | null = null;
    if (referrerId) {
      const { data: ref } = await supabase
        .from("referrers")
        .select("rate")
        .eq("id", referrerId)
        .maybeSingle();
      if (ref && ref.rate != null) {
        commissionRate = Number(ref.rate);
      }
    }

    const newDeal = {
      title: title.trim(),
      client: client.trim(),
      service: service.trim(),
      agreed: Math.floor(agreed),
      stage: "new",
      lead_id: leadId || null,
      referrer_id: referrerId || null,
      commission_rate: commissionRate,
      owner_id: user.id,
      notes: "",
    };

    const { data: created, error } = await supabase.from("deals").insert(newDeal).select("*").single();

    if (error || !created) {
      logger.error("[deals.create]", { error });
      throw new HttpError(400, error?.message || "Failed to create deal.");
    }

    await supabase.rpc("log_activity", { p_action: "Created a deal", p_target: created.title });

    return rowToDeal(created, shouldRedactCommission(staff.role));
  });
}
