export type AppointmentStatus =
  | "requested"
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "meeting_enabled"
  | "completed"
  | "cancelled"
  | "rejected"
  | "refund_pending";

export type UserProfileSnippet = {
  fullName: string | null;
  avatarUrl: string | null;
};

export type Appointment = {
  id: string;
  patientId: string;
  psychologistId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  googleMeetUrl: string | null;
  psychologistNotes: string | null;
  psychologist: UserProfileSnippet;
  patient: UserProfileSnippet;
};

/** Vista paciente: datos de la psicÃ³loga */
export type PatientAppointmentView = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  googleMeetUrl: string | null;
  psychologistId: string;
  psychologistName: string;
  psychologistAvatarUrl: string | null;
};

/** Vista psicÃ³loga: datos del paciente */
export type PsychologistAppointmentView = {
  id: string;
  patientId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  googleMeetUrl: string | null;
  psychologistNotes: string | null;
  patientName: string;
  patientAvatarUrl: string | null;
};

export type PsychologistPatientSummary = {
  patientId: string;
  fullName: string;
  avatarUrl: string | null;
  nextSessionAt: string | null;
  sessionsCount: number;
};
