import { getSupabaseClient } from "../services/supabase/client";
import { APPOINTMENT_SELECT } from "./queries";
import { mapAppointmentRow, type AppointmentRowRaw } from "./mappers";
import type { Appointment } from "./types";

export async function fetchAllAppointmentsAdmin(): Promise<Appointment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .order("starts_at", { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  return (data as unknown as AppointmentRowRaw[]).map(mapAppointmentRow);
}
