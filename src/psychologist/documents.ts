import { getSupabaseClient } from "../services/supabase/client";

const BUCKET = "psychologist-documents";

function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadPsychologistDocument({
  userId,
  file,
}: {
  userId: string;
  file: File;
}): Promise<string> {
  const supabase = getSupabaseClient();
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()
    : "pdf";
  const safeName = sanitizeFileName(file.name) || `document.${extension}`;
  const path = `${userId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("psychologists")
    .update({
      document_url: path,
      application_submitted_at: new Date().toISOString(),
      application_status: "pending",
      is_approved: false,
    })
    .eq("user_id", userId);

  if (updateError) throw updateError;

  return path;
}

export async function createSignedDocumentUrl(path: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 10);

  if (error) throw error;
  return data.signedUrl;
}
