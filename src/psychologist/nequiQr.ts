import { getSupabaseClient } from "../services/supabase/client";

const BUCKET = "nequi-qr-codes";

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
