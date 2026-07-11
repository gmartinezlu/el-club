import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";
import { createAdminClient, getValidAccessToken } from "../_shared/googleIntegration.ts";
import { createCalendarEventWithMeet } from "../_shared/google.ts";

// Called right after the psychologist confirms an appointment. If she
// hasn't connected Google, this is a no-op (2.7 manual fallback keeps
// working) rather than an error — confirming a session must never fail
// just because Google isn't connected.
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

  // RLS on `appointments` already scopes selects to the owning
  // psychologist/patient/admin, but we filter explicitly here too since
  // this query runs with the service role (RLS bypassed).
  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .select("id, patient_id, psychologist_id, starts_at, ends_at, status")
    .eq("id", appointmentId)
    .eq("psychologist_id", psychologistId)
    .maybeSingle();

  if (appointmentError) {
    return new Response(JSON.stringify({ error: appointmentError.message }), {
      status: 500,
      headers,
    });
  }
  if (!appointment) {
    return new Response(JSON.stringify({ error: "Appointment not found" }), {
      status: 404,
      headers,
    });
  }

  try {
    const tokenInfo = await getValidAccessToken(admin, psychologistId);
    if (!tokenInfo) {
      return new Response(JSON.stringify({ skipped: true, reason: "not_connected" }), {
        headers,
      });
    }

    const { data: patientAuth, error: patientAuthError } =
      await admin.auth.admin.getUserById(appointment.patient_id);
    if (patientAuthError || !patientAuth.user?.email) {
      throw new Error("No se pudo obtener el correo del paciente");
    }

    const { data: psychologistProfile } = await admin
      .from("users")
      .select("full_name")
      .eq("id", psychologistId)
      .maybeSingle();

    const event = await createCalendarEventWithMeet({
      accessToken: tokenInfo.accessToken,
      calendarId: tokenInfo.calendarId,
      summary: `Sesión con ${psychologistProfile?.full_name ?? "tu psicóloga"} — EL CLUB`,
      description: "Sesión agendada a través de EL CLUB.",
      startIso: appointment.starts_at,
      endIso: appointment.ends_at,
      attendeeEmail: patientAuth.user.email,
    });

    const { error: updateError } = await admin
      .from("appointments")
      .update({
        google_meet_url: event.meetUrl,
        google_calendar_event_id: event.eventId,
      })
      .eq("id", appointmentId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ skipped: false, meetUrl: event.meetUrl }), {
      headers,
    });
  } catch (error) {
    console.error("google-calendar-sync-event failed:", error);
    return new Response(
      JSON.stringify({ error: "No se pudo crear el evento en Google Calendar" }),
      { status: 502, headers },
    );
  }
});
