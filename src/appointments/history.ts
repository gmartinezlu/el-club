import { getSupabaseClient } from "../services/supabase/client";

export async function clearAppointmentHistory(
  userId: string,
): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("clear_appointment_history", {
    p_user_id: userId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}
