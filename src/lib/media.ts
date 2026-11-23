export const MEDIA_BUCKET = "site-media";

export const LIMITS = {
  work: {
    maxBytes: 500 * 1024, // 500 KB hard limit
    budgetBytes: 150 * 1024, // 150 KB recommended
    allowedMime: ["image/webp", "image/png", "image/jpeg"],
    defaultExt: "webp",
  },
  partner: {
    maxBytes: 100 * 1024, // 100 KB hard limit
    budgetBytes: 100 * 1024,
    allowedMime: ["image/svg+xml", "image/webp", "image/png"],
    defaultExt: "webp",
  },
} as const;

export function validateUpload(
  entityType: "work" | "partner",
  contentType: string,
  size: number
): { valid: boolean; error?: string; warning?: string } {
  const config = LIMITS[entityType];
  if (!config) {
    return { valid: false, error: "Invalid entity type." };
  }

  const normalizedMime = contentType.toLowerCase().split(";")[0].trim();
  if (!config.allowedMime.includes(normalizedMime as never)) {
    return {
      valid: false,
      error: `Unsupported file type "${normalizedMime}". Allowed formats: ${config.allowedMime.join(", ")}`,
    };
  }

  if (size > config.maxBytes) {
    const limitKb = Math.round(config.maxBytes / 1024);
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${limitKb} KB.`,
    };
  }

  const warning =
    entityType === "work" && size > config.budgetBytes
      ? `File size is ${Math.round(size / 1024)} KB. Recommended budget for screenshots is 150 KB.`
      : undefined;

  return { valid: true, warning };
}

export function getStoragePath(
  entityType: "work" | "partner",
  entityId: string,
  contentType: string
): string {
  let ext = "webp";
  const mime = contentType.toLowerCase();
  if (mime.includes("svg")) ext = "svg";
  else if (mime.includes("png")) ext = "png";
  else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";

  const folder = entityType === "work" ? "work" : "partners";
  return `${folder}/${entityId}.${ext}`;
}

export function getPublicMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const cleanPath = path.replace(/^\//, "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return `/${cleanPath}`;

  const cleanBase = supabaseUrl.replace(/\/$/, "");
  return `${cleanBase}/storage/v1/object/public/${MEDIA_BUCKET}/${cleanPath}`;
}
