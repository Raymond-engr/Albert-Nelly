import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { supabase } = await requireStaff("packages", "edit");

    const { error } = await supabase.rpc("set_featured_package", { p_id: id });
    if (error) {
      throw new HttpError(400, error.message || "Failed to set featured package.");
    }

    return { ok: true, id };
  });
}
