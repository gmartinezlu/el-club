import { getSupabaseClient } from "../services/supabase/client";
import { fetchAppointmentsBase } from "./fetchWithProfiles";
import { APPOINTMENT_SELECT } from "./queries";
import {
  mapAppointmentRow,
  toPsychologistView,
  type AppointmentRowRaw,
} from "./mappers";
import type {
  PsychologistAppointmentView,
  PsychologistPatientSummary,
} from "./types";

type PsychologistNoteRow = {
  appointment_id: string;
  notes: string | null;
};

async function attachPsychologistNotes(
  psychologistId: string,
  appointments: PsychologistAppointmentView[],
): Promise<PsychologistAppointmentView[]> {
  if (appointments.length === 0) return appointments;

  const supabase = getSupabaseClient();
  const appointmentIds = appointments.map((appointment) => appointment.id);
  const { data, error } = await supabase
    .from("psychologist_session_notes")
    .select("appointment_id, notes")
    .eq("psychologist_id", psychologistId)
    .in("appointment_id", appointmentIds);

  if (error) throw error;

  const notesMap = new Map(
    ((data ?? []) as PsychologistNoteRow[]).map((row) => [
      row.appointment_id,
      row.notes,
    ]),
  );

  return appointments.map((appointment) => ({
    ...appointment,
    psychologistNotes: notesMap.get(appointment.id) ?? null,
  }));
}

async function fetchPsychologistAppointmentsJoined(
  psychologistId: string,
): Promise<PsychologistAppointmentView[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("psychologist_id", psychologistId)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  return (data as unknown as AppointmentRowRaw[])
    .map(mapAppointmentRow)
    .map(toPsychologistView);
}

export async function fetchPsychologistAppointments(
  psychologistId: string,
): Promise<PsychologistAppointmentView[]> {
  let appointments: PsychologistAppointmentView[];
  try {
    appointments = await fetchPsychologistAppointmentsJoined(psychologistId);
  } catch {
    const base = await fetchAppointmentsBase({
      column: "psychologist_id",
      value: psychologistId,
    });
    appointments = base.map(toPsychologistView);
  }

  return attachPsychologistNotes(psychologistId, appointments);
}

export async function fetchBusyStartTimes(
  psychologistId: string,
  fromIso: string,
  toIso: string,
): Promise<Set<number>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("starts_at")
    .eq("psychologist_id", psychologistId)
    .gte("starts_at", fromIso)
    .lt("starts_at", toIso)
    .not("status", "in", "(cancelled,rejected)");

  if (error) throw error;
  return new Set(
    ((data ?? []) as { starts_at: string }[]).map((row) =>
      new Date(row.starts_at).getTime(),
    ),
  );
}

export function buildPatientSummaries(
  appointments: PsychologistAppointmentView[],
): PsychologistPatientSummary[] {
  const now = Date.now();
  const map = new Map<string, PsychologistPatientSummary>();

  for (const apt of appointments) {
    const existing = map.get(apt.patientId);
    const isUpcoming =
      new Date(apt.startsAt).getTime() > now &&
      apt.status !== "cancelled" &&
      apt.status !== "completed";

    if (!existing) {
      map.set(apt.patientId, {
        patientId: apt.patientId,
        fullName: apt.patientName,
        avatarUrl: apt.patientAvatarUrl,
        nextSessionAt: isUpcoming ? apt.startsAt : null,
        sessionsCount: 1,
      });
      continue;
    }

    existing.sessionsCount += 1;
    if (isUpcoming) {
      if (
        !existing.nextSessionAt ||
        new Date(apt.startsAt).getTime() <
          new Date(existing.nextSessionAt).getTime()
      ) {
        existing.nextSessionAt = apt.startsAt;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "es"),
  );
}

export async function updateAppointmentStatus(
  appointmentId: string,
  psychologistId: string,
  status: PsychologistAppointmentView["status"],
  extra?: { googleMeetUrl?: string },
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      status,
      ...(extra?.googleMeetUrl !== undefined
        ? { google_meet_url: extra.googleMeetUrl }
        : {}),
    })
    .eq("id", appointmentId)
    .eq("psychologist_id", psychologistId);

  if (error) throw error;
}

export async function updateAppointmentMeetUrl(
  appointmentId: string,
  psychologistId: string,
  googleMeetUrl: string | null,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("appointments")
    .update({ google_meet_url: googleMeetUrl })
    .eq("id", appointmentId)
    .eq("psychologist_id", psychologistId);

  if (error) throw error;
}

export async function updateAppointmentPsychologistNotes(
  appointmentId: string,
  psychologistId: string,
  notes: string | null,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("psychologist_session_notes").upsert(
    {
      appointment_id: appointmentId,
      psychologist_id: psychologistId,
      notes,
    },
    { onConflict: "appointment_id" },
  );

  if (error) throw error;
}
