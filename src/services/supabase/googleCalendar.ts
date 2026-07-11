import { getSupabaseClient } from "./client";

export type GoogleConnectionStatus =
  | { connected: false }
  | { connected: true; googleEmail: string; connectedAt: string };

export async function fetchGoogleConnectionStatus(): Promise<GoogleConnectionStatus> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke<GoogleConnectionStatus>(
    "google-oauth-status",
  );
  if (error) throw error;
  if (!data) throw new Error("Respuesta vacía al consultar la conexión con Google");
  return data;
}

export async function startGoogleConnection(): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke<{ authUrl: string }>(
    "google-oauth-connect",
  );
  if (error) throw error;
  if (!data?.authUrl) throw new Error("No se recibió la URL de conexión con Google");
  window.location.href = data.authUrl;
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.functions.invoke("google-oauth-disconnect");
  if (error) throw error;
}

// No-op (not an error) when the psychologist hasn't connected Google —
// confirming/cancelling a session must never fail because of that.
export async function syncGoogleCalendarEvent(appointmentId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.functions.invoke("google-calendar-sync-event", {
    body: { appointmentId },
  });
  if (error) throw error;
}

export async function cancelGoogleCalendarEvent(appointmentId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.functions.invoke("google-calendar-cancel-event", {
    body: { appointmentId },
  });
  if (error) throw error;
}
