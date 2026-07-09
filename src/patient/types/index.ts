export type {
  AppointmentStatus,
  PatientAppointmentView as PatientAppointment,
} from "../../appointments/types";

export type MoodEntry = {
  date: string;
  mood: number;
  note?: string;
};
