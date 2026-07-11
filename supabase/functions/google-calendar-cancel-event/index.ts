import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";
import { createAdminClient, getValidAccessToken } from "../_shared/googleIntegration.ts";
import { deleteCalendarEvent } from "../_shared/google.ts";

// Called right after a psychologist cancels an appointment. No-op if
// there's no Google event to remove (never connected, or the appointment
// was cancelled before confirmation) — cancelling in EL CLUB must never
// fail because of Google.
Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const headers = { ...corsHeaders(req.headers.get("origin")), "Content-Type": "application/json" };

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers,
    });
  }

  const { appointmentId } = (await req.json()) as { appointmentId?: string };
  if (!appointmentId) {
    return new Response(JSON.stringify({ error: "appointmentId is required" }), {
      status: 400,
      headers,
    });
  }

  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers,
    });
  }

  const admin = createAdminClient();
  const psychologistId = userData.user.id;

  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .select("id, google_calendar_event_id")
    .eq("id", appointmentId)
    .eq("psychologist_id", psychologistId)
    .maybeSingle();

  if (appointmentError) {
    return new Response(JSON.stringify({ error: appointmentError.message }), {
      status: 500,
      headers,
    });
  }
  if (!appointment?.google_calendar_event_id) {
    return new Response(JSON.stringify({ skipped: true, reason: "no_event" }), { headers });
  }

  try {
    const tokenInfo = await getValidAccessToken(admin, psychologistId);
    if (!tokenInfo) {
      return new Response(JSON.stringify({ skipped: true, reason: "not_connected" }), {
        headers,
      });
    }

    await deleteCalendarEvent({
      accessToken: tokenInfo.accessToken,
      calendarId: tokenInfo.calendarId,
      eventId: appointment.google_calendar_event_id,
    });

    const { error: updateError } = await admin
      .from("appointments")
      .update({ google_calendar_event_id: null })
      .eq("id", appointmentId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ skipped: false }), { headers });
  } catch (error) {
    console.error("google-calendar-cancel-event failed:", error);
    return new Response(
      JSON.stringify({ error: "No se pudo cancelar el evento en Google Calendar" }),
      { status: 502, headers },
    );
  }
});
