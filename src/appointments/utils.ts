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
  paid: "Pendiente de pago",
  confirmed: "Confirmada",
  meeting_enabled: "Lista para sesiÃ³n",
  completed: "Completada",
  cancelled: "Cancelada",
  rejected: "Rechazada",
  refund_pending: "Reembolso",
};
