import { getSupabaseClient } from "../services/supabase/client";
import { fetchAppointmentsBase } from "./fetchWithProfiles";
import { APPOINTMENT_SELECT } from "./queries";
import {
  mapAppointmentRow,
  toPatientView,
  type AppointmentRowRaw,
} from "./mappers";
import type { PatientAppointmentView } from "./types";

export type CreatePatientAppointmentInput = {
  patientId: string;
  psychologistId: string;
  startsAt: string;
  endsAt: string;
};

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
  } catch {
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
  } catch {
    const all = await fetchPatientAppointments(patientId);
    return all.find((a) => a.id === appointmentId) ?? null;
  }
}

export async function createPatientAppointment(
  input: CreatePatientAppointmentInput,
): Promise<string> {
  const supabase = getSupabaseClient();

  let { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: input.patientId,
      psychologist_id: input.psychologistId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: "requested",
    })
    .select("id")
    .single<{ id: string }>();

  if (error && /requested|appointment_status/i.test(error.message)) {
    const fallback = await supabase
      .from("appointments")
      .insert({
        patient_id: input.patientId,
        psychologist_id: input.psychologistId,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        status: "pending_payment",
      })
      .select("id")
      .single<{ id: string }>();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  if (!data) throw new Error("No se pudo crear la cita");
  return data.id;
}
