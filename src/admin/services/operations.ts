import { fetchAllAppointmentsAdmin } from "../../appointments/admin";
import type { AppointmentStatus } from "../../appointments/types";
import { getSupabaseClient } from "../../services/supabase/client";

export type AdminSupportTicket = {
  id: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  userName: string;
  adminResponse: string | null;
  respondedAt: string | null;
};

export type AdminActivityRow = {
  id: string;
  title: string;
  description: string;
  status: AppointmentStatus;
  createdAt: string;
};

function profileName(profile: { fullName: string | null }): string {
  return profile.fullName?.trim() || "Sin nombre";
}

type SupportTicketRow = {
  id: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  admin_response: string | null;
  responded_at: string | null;
  user?: {
    full_name: string | null;
  } | null;
};

export async function fetchAdminSupportTickets(): Promise<
  AdminSupportTicket[]
> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select(
      `
        id,
        subject,
        body,
        status,
        created_at,
        admin_response,
        responded_at,
        user:users!support_tickets_user_id_fkey (
          full_name
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as SupportTicketRow[]).map((row) => ({
    id: row.id,
    subject: row.subject,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    userName: row.user?.full_name?.trim() || "Usuario",
    adminResponse: row.admin_response,
    respondedAt: row.responded_at,
  }));
}

export async function respondSupportTicket({
  ticketId,
  response,
  status = "closed",
}: {
  ticketId: string;
  response: string;
  status?: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("respond_support_ticket", {
    p_ticket_id: ticketId,
    p_response: response,
    p_status: status,
  });

  if (error) throw error;
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ status })
    .eq("id", ticketId);

  if (error) throw error;
}

export async function fetchAdminActivity(): Promise<AdminActivityRow[]> {
  const appointments = await fetchAllAppointmentsAdmin();
  return appointments.slice(0, 40).map((appointment) => ({
    id: appointment.id,
    title: `${profileName(appointment.patient)} con ${profileName(
      appointment.psychologist,
    )}`,
    description: appointment.googleMeetUrl
      ? "Sesion con enlace Meet asociado"
      : "Sesion sin enlace Meet",
    status: appointment.status,
    createdAt: appointment.startsAt,
  }));
}
