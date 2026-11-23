import { revalidatePath } from "next/cache";
import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { rowToWorkItem } from "@/lib/control-room/server/mappers";

export async function POST(req: Request) {
  return handle(async () => {
    const { supabase } = await requireStaff("work", "edit");

    let body: { category?: "Design" | "Development"; title?: string; challenge?: string; result?: string; published?: boolean; imagePath?: string | null };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { category, title, challenge, result, published = true, imagePath } = body;
    if (!category || (category !== "Design" && category !== "Development")) {
      throw new HttpError(422, "Category must be Design or Development.");
    }
    if (!title || title.trim().length < 2) {
      throw new HttpError(422, "Title is required.");
    }

    const { count } = await supabase.from("work_items").select("*", { count: "exact", head: true });
    const position = (count || 0) + 1;

    const { data: created, error } = await supabase
      .from("work_items")
      .insert({
        position,
        category,
        title: title.trim(),
        challenge: challenge?.trim() || "",
        result: result?.trim() || "",
        published: Boolean(published),
        image_path: imagePath ? String(imagePath) : null,
      })
      .select("*")
      .single();

    if (error || !created) throw new HttpError(400, error?.message || "Failed to create work item.");

    await supabase.rpc("log_activity", { p_action: "Added a project to Selected work", p_target: created.title });

    revalidatePath("/");
    return rowToWorkItem(created);
  });
}
