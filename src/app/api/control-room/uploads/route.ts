import { requireStaff, handle, HttpError } from "@/lib/control-room/server/guard";
import { validateUpload, getStoragePath, getPublicMediaUrl, MEDIA_BUCKET } from "@/lib/media";

export async function POST(req: Request) {
  return handle(async () => {
    // Only owner and content can upload media
    const { supabase, staff } = await requireStaff("work", "edit");
    if (staff.role !== "owner" && staff.role !== "content") {
      throw new HttpError(403, "You do not have permission to upload media.");
    }

    let body: { entityType?: "work" | "partner"; entityId?: string; contentType?: string; size?: number };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }

    const { entityType, entityId, contentType, size } = body;
    if (!entityType || !entityId || !contentType || typeof size !== "number") {
      throw new HttpError(400, "Missing required upload parameters (entityType, entityId, contentType, size).");
    }

    if (entityType !== "work" && entityType !== "partner") {
      throw new HttpError(400, "entityType must be 'work' or 'partner'.");
    }

    const validation = validateUpload(entityType, contentType, size);
    if (!validation.valid) {
      throw new HttpError(400, validation.error || "File validation failed.");
    }

    const storagePath = getStoragePath(entityType, entityId, contentType);

    // Call Supabase storage to generate a signed upload URL
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (uploadErr || !uploadData) {
      throw new HttpError(500, `Storage error: ${uploadErr?.message || "Failed to create signed upload URL."}`);
    }

    // Note: Database record update (image_path / logo_path) is finalized
    // when the form is submitted, preventing orphaned DB references if the client fails to upload.
    await supabase.rpc("log_activity", {
      p_action: `Generated upload URL for ${entityType} media`,
      p_target: storagePath,
    });

    return {
      signedUrl: uploadData.signedUrl,
      token: uploadData.token,
      path: storagePath,
      publicUrl: getPublicMediaUrl(storagePath),
      warning: validation.warning,
    };
  });
}
