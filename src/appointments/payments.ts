import { getSupabaseClient } from "../services/supabase/client";

const BUCKET = "payment-proofs";

function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadPaymentProof({
  patientId,
  appointmentId,
  file,
}: {
  patientId: string;
  appointmentId: string;
  file: File;
}): Promise<string> {
  const supabase = getSupabaseClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const safeName = sanitizeFileName(file.name) || `proof.${extension}`;
  const path = `${patientId}/${appointmentId}-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  return path;
}

export async function createSignedPaymentProofUrl(path: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 10);

  if (error) throw error;
  return data.signedUrl;
}

export async function markPatientPaid({
  appointmentId,
  patientId,
  proofPath,
}: {
  appointmentId: string;
  patientId: string;
  proofPath: string | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      payment_marked_paid_at: new Date().toISOString(),
      ...(proofPath ? { payment_proof_url: proofPath } : {}),
    })
    .eq("id", appointmentId)
    .eq("patient_id", patientId);

  if (error) throw error;
}

export async function markAppointmentPendingPayment(
  appointmentId: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("mark_appointment_pending_payment", {
    p_appointment_id: appointmentId,
  });

  if (error) throw error;
}

export async function confirmPaymentReceived(
  appointmentId: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("confirm_payment_received", {
    p_appointment_id: appointmentId,
  });

  if (error) throw error;
}

export async function releaseUnpaidAppointment(
  appointmentId: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("release_unpaid_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) throw error;
}
