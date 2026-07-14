import type { AppointmentStatus } from "./types";

type HasSchedule = {
  startsAt: string;
  status: AppointmentStatus;
};

export function getNextAppointment<T extends HasSchedule>(
  appointments: T[],
): T | null {
  const now = Date.now();
  return (
    appointments
      .filter(
        (a) =>
          new Date(a.startsAt).getTime() > now &&
          a.status !== "cancelled" &&
          a.status !== "completed",
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )[0] ?? null
  );
}

export function getPastAppointments<T extends HasSchedule>(
  appointments: T[],
): T[] {
  const now = Date.now();
  return appointments
    .filter(
      (a) =>
        new Date(a.startsAt).getTime() <= now ||
        a.status === "completed" ||
        a.status === "cancelled",
    )
    .sort(
      (a, b) =>
        new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  requested: "Solicitada",
  pending_payment: "Pendiente de pago",
  confirmed: "Confirmada",
  meeting_enabled: "Lista para sesión",
  completed: "Completada",
  cancelled: "Cancelada",
  rejected: "Rechazada",
};

export const STATUS_HELP: Record<AppointmentStatus, string> = {
  requested: "Esperando que la psicóloga confirme o rechace la solicitud.",
  pending_payment: "Falta coordinar y confirmar el pago para agendar la sesión.",
  confirmed: "La cita está agendada. El enlace de la sesión se habilitará más cerca de la fecha.",
  meeting_enabled: "Ya puedes ingresar a la sesión desde el enlace disponible.",
  completed: "La sesión ya se realizó.",
  cancelled: "Esta cita fue cancelada.",
  rejected: "Esta solicitud fue rechazada.",
};
