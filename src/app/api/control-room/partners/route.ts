import { revalidatePath } from "next/cache";
import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToPartner } from "@/lib/control-room/server/mappers";

export async function POST(req: Request) {
  return handle(async () => {
    const { supabase } = await requireStaff("partners", "edit");

    let body: { name?: string; category?: string; note?: string; link?: string; status?: "active" | "pending"; published?: boolean; logoPath?: string | null };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { name, category, note = "", link = "", status = "pending", published = false, logoPath } = body;
    if (!name || name.trim().length < 2) throw new HttpError(422, "Partner name is required.");
    if (!category || category.trim().length < 2) throw new HttpError(422, "Category is required.");

    // Partner published cannot be true unless status is active
    if (published && status !== "active") {
      throw new HttpError(422, "Partners must be active before they can be published.");
    }

    const { count } = await supabase.from("partners").select("*", { count: "exact", head: true });
    const position = (count || 0) + 1;

    const { data: created, error } = await supabase
      .from("partners")
      .insert({
        position,
        name: name.trim(),
        category: category.trim(),
        note: note.trim(),
        link: link.trim(),
        status,
        published: Boolean(published),
        logo_path: logoPath ? String(logoPath) : null,
      })
      .select("*")
      .single();

    if (error || !created) throw new HttpError(400, error?.message || "Failed to create partner.");

    await supabase.rpc("log_activity", { p_action: "Added a partner", p_target: created.name });

    revalidatePath("/");
    return rowToPartner(created);
  });
}
