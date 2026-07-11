import type {
  Appointment,
  AppointmentStatus,
  PatientAppointmentView,
  PsychologistAppointmentView,
  UserProfileSnippet,
} from "./types";

type ProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
} | null;

type PartyRow = {
  user_id?: string;
  profile?: ProfileRow;
  users?: ProfileRow;
} | null;

export type AppointmentRowRaw = {
  id: string;
  patient_id: string;
  psychologist_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  google_meet_url: string | null;
  notes_psychologist?: string | null;
  payment_proof_url?: string | null;
  payment_deadline?: string | null;
  payment_marked_paid_at?: string | null;
  psychologist?: PartyRow;
  patient?: PartyRow;
};

function readProfile(party: PartyRow): UserProfileSnippet {
  const profile = party?.profile ?? party?.users ?? null;
  return {
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export function mapAppointmentRow(row: AppointmentRowRaw): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    psychologistId: row.psychologist_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    googleMeetUrl: row.google_meet_url,
    psychologistNotes: row.notes_psychologist ?? null,
    paymentProofUrl: row.payment_proof_url ?? null,
    paymentDeadline: row.payment_deadline ?? null,
    paymentMarkedPaidAt: row.payment_marked_paid_at ?? null,
    psychologist: readProfile(row.psychologist ?? null),
    patient: readProfile(row.patient ?? null),
  };
}

export function toPatientView(appointment: Appointment): PatientAppointmentView {
  return {
    id: appointment.id,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    status: appointment.status,
    googleMeetUrl: appointment.googleMeetUrl,
    paymentProofUrl: appointment.paymentProofUrl,
    paymentDeadline: appointment.paymentDeadline,
    paymentMarkedPaidAt: appointment.paymentMarkedPaidAt,
    psychologistId: appointment.psychologistId,
    psychologistName:
      appointment.psychologist.fullName?.trim() || "Tu psicÃ³loga",
    psychologistAvatarUrl: appointment.psychologist.avatarUrl,
  };
}

export function toPsychologistView(
  appointment: Appointment,
): PsychologistAppointmentView {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    status: appointment.status,
    googleMeetUrl: appointment.googleMeetUrl,
    psychologistNotes: appointment.psychologistNotes,
    paymentProofUrl: appointment.paymentProofUrl,
    paymentDeadline: appointment.paymentDeadline,
    paymentMarkedPaidAt: appointment.paymentMarkedPaidAt,
    patientName: appointment.patient.fullName?.trim() || "Persona",
    patientAvatarUrl: appointment.patient.avatarUrl,
  };
}
