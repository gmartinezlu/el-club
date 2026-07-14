import { getSupabaseClient } from "../services/supabase/client";
import { fetchAppointmentsBase } from "./fetchWithProfiles";
import { APPOINTMENT_SELECT } from "./queries";
import { isSafeSchemaError } from "./schemaErrors";
import {
  mapAppointmentRow,
  toPatientView,
  type AppointmentRowRaw,
} from "./mappers";
import type { PatientAppointmentView } from "./types";

async function fetchPatientAppointmentsJoined(
  patientId: string,
): Promise<PatientAppointmentView[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("patient_id", patientId)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  return (data as unknown as AppointmentRowRaw[])
    .map(mapAppointmentRow)
    .map(toPatientView);
}

export async function fetchPatientAppointments(
  patientId: string,
): Promise<PatientAppointmentView[]> {
  try {
    return await fetchPatientAppointmentsJoined(patientId);
  } catch (error) {
    // Only fallback for safe schema errors (missing columns/relations)
    if (!isSafeSchemaError(error)) {
      throw error; // Re-throw network or permission errors
    }
    // Safe to ignore: try fallback query
    const base = await fetchAppointmentsBase({
      column: "patient_id",
      value: patientId,
    });
    return base.map(toPatientView);
  }
}

export async function fetchPatientAppointmentById(
  patientId: string,
  appointmentId: string,
): Promise<PatientAppointmentView | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("patient_id", patientId)
      .eq("id", appointmentId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return toPatientView(
      mapAppointmentRow(data as unknown as AppointmentRowRaw),
    );
  } catch (error) {
    // Only fallback for safe schema errors (missing columns/relations)
    if (!isSafeSchemaError(error)) {
      throw error; // Re-throw network or permission errors
    }
    // Safe to ignore: try fallback query
    const all = await fetchPatientAppointments(patientId);
    return all.find((a) => a.id === appointmentId) ?? null;
  }
}

/**
 * Book appointment atomically using Supabase RPC.
 * Prevents double-booking by verifying slot availability, creating appointment,
 * and removing slot in a single transaction.
 */
export async function bookAppointmentAtomically({
  patientId,
  psychologistId,
  slotId,
}: {
  patientId: string;
  psychologistId: string;
  slotId: string;
}): Promise<string> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("book_appointment", {
    p_patient_id: patientId,
    p_psychologist_id: psychologistId,
    p_slot_id: slotId,
  });

  if (error) throw error;
  if (!data || !Array.isArray(data) || data.length === 0)
    throw new Error("Invalid RPC response");

  const result = data[0] as {
    success: boolean;
    appointment_id: string | null;
    error_message: string | null;
  };

  if (!result.success) {
    throw new Error(
      result.error_message || "No se pudo reservar el horario disponible",
    );
  }

  if (!result.appointment_id) {
    throw new Error("No se recibió ID de cita del servidor");
  }

  return result.appointment_id;
}
