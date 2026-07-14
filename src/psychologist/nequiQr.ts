import { getSupabaseClient } from "../services/supabase/client";

const BUCKET = "nequi-qr-codes";
const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadNequiQr({
  userId,
  file,
}: {
  userId: string;
  file: File;
}): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Solo se permiten imágenes PNG, JPEG o WebP.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("La imagen no debe superar 2 MB.");
  }

  const supabase = getSupabaseClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const safeName = sanitizeFileName(file.name) || `qr.${extension}`;
  const path = `${userId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
