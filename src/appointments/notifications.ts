import { getSupabaseClient } from "../services/supabase/client";
import type { AppointmentStatus } from "./types";

type AppointmentEvent =
  | "requested"
  | "pending_payment"
  | "confirmed"
  | "meeting_enabled"
  | "cancelled"
  | "rejected";

export async function sendAppointmentEventNotification({
  appointmentId,
  event,
}: {
  appointmentId: string;
  event: AppointmentEvent;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.functions.invoke("send-appointment-event", {
    body: { appointmentId, event },
  });

  if (error) {
    console.warn("Appointment email notification skipped", error);
  }
}

export function isNotifiableAppointmentStatus(
  status: AppointmentStatus,
): status is AppointmentEvent {
  return [
    "requested",
    "pending_payment",
    "confirmed",
    "meeting_enabled",
    "cancelled",
    "rejected",
  ].includes(status);
}
