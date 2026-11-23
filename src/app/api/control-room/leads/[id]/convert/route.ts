import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToDeal } from "@/lib/control-room/server/mappers";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("leads", "edit");

    let body: { title?: string; client?: string; service?: string; agreed?: number };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { title, client, service, agreed = 0 } = body;
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

    const { data: dealId, error: rpcError } = await supabase.rpc("convert_lead_to_deal", {
      p_lead: id,
      p_title: title.trim(),
      p_client: client.trim(),
      p_service: service.trim(),
      p_agreed: Math.floor(agreed),
    });

    if (rpcError || !dealId) {
      console.error("[leads.convert]", rpcError);
      throw new HttpError(400, rpcError?.message || "Failed to convert lead to deal.");
    }

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      throw new HttpError(500, "Deal converted but failed to retrieve created deal.");
    }

    return rowToDeal(deal);
  });
}
