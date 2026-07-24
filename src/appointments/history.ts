import { getSupabaseClient } from "../services/supabase/client";
import { isSafeSchemaError } from "./schemaErrors";

const HISTORY_STATUSES = ["completed", "cancelled", "rejected"] as const;

async function clearAppointmentHistoryFallback(
  userId: string,
): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id")
    .or(`patient_id.eq.${userId},psychologist_id.eq.${userId}`)
    .in("status", HISTORY_STATUSES);

  if (error) throw error;

  const appointmentIds = ((data ?? []) as { id: string }[]).map(
    (row) => row.id,
  );
  if (appointmentIds.length === 0) return 0;

  const { error: paymentError } = await supabase
    .from("payments")
    .delete()
    .in("appointment_id", appointmentIds);

  if (paymentError && !isSafeSchemaError(paymentError)) {
    throw paymentError;
  }

  const { count, error: deleteError } = await supabase
    .from("appointments")
    .delete({ count: "exact" })
    .or(`patient_id.eq.${userId},psychologist_id.eq.${userId}`)
    .in("status", HISTORY_STATUSES);

  if (deleteError) throw deleteError;
  return count ?? appointmentIds.length;
}

export async function clearAppointmentHistory(
  userId: string,
): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("clear_appointment_history", {
    p_user_id: userId,
  });
  if (error) {
    console.warn("clear_appointment_history RPC failed, using fallback", error);
    return clearAppointmentHistoryFallback(userId);
  }
  return (data as number) ?? 0;
}
