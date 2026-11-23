import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToPayment } from "@/lib/control-room/server/mappers";
import type { PaymentCategory } from "@/lib/control-room/types";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase, staff } = await requireStaff("deals", "edit");

    if (staff.role !== "owner" && staff.role !== "finance") {
      throw new HttpError(403, "Only owner and finance may record payments.");
    }

    let body: {
      direction?: "in" | "out";
      amount?: number;
      category?: PaymentCategory;
      date?: string;
      note?: string;
    };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { direction, amount, category, date, note = "" } = body;
    if (!direction || (direction !== "in" && direction !== "out")) {
      throw new HttpError(422, "Direction must be 'in' or 'out'.");
    }
    if (!amount || amount <= 0) {
      throw new HttpError(422, "Payment amount must be greater than zero.");
    }
    const validCategories: PaymentCategory[] = ["deposit", "balance", "commission", "expense", "other"];
    if (!category || !validCategories.includes(category)) {
      throw new HttpError(422, "Invalid payment category.");
    }
    if (!date) {
      throw new HttpError(422, "Payment date is required.");
    }

    const paidOn = date.includes("T") ? date.slice(0, 10) : date;

    const { data: paymentId, error: rpcError } = await supabase.rpc("record_payment", {
      p_deal: id,
      p_direction: direction,
      p_amount: Math.floor(amount),
      p_category: category,
      p_note: note.trim(),
      p_paid_on: paidOn,
    });

    if (rpcError || !paymentId) {
      console.error("[payments.record]", rpcError);
      throw new HttpError(400, rpcError?.message || "Failed to record payment.");
    }

    const { data: payment, error: payError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (payError || !payment) {
      throw new HttpError(500, "Payment recorded but failed to retrieve record.");
    }

    return rowToPayment(payment);
  });
}
