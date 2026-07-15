import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";

type AppointmentEvent =
  | "requested"
  | "pending_payment"
  | "confirmed"
  | "meeting_enabled"
  | "cancelled"
  | "rejected";

type AppointmentRow = {
  id: string;
  patient_id: string;
  psychologist_id: string;
  starts_at: string;
  ends_at: string;
  google_meet_url: string | null;
};

function optionalEnv(name: string): string | null {
  return Deno.env.get(name) || null;
}

function formatSession(startsAt: string): string {
  return new Date(startsAt).toLocaleString("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: optionalEnv("APP_TIME_ZONE") ?? "America/Bogota",
  });
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = optionalEnv("RESEND_API_KEY");
  const from = optionalEnv("RESEND_FROM_EMAIL");
  if (!apiKey || !from) return { skipped: true };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    throw new Error(`Resend failed: ${response.status} ${await response.text()}`);
  }
  return { skipped: false };
}

function buildMessage(event: AppointmentEvent, sessionText: string, meetUrl: string | null) {
  switch (event) {
    case "requested":
      return {
        target: "psychologist" as const,
        subject: "Nueva solicitud de cita en El Club",
        body: `Tienes una nueva solicitud de cita para ${sessionText}.`,
      };
    case "pending_payment":
      return {
        target: "patient" as const,
        subject: "Tu cita está pendiente de pago",
        body: `Tu psicóloga aceptó la cita de ${sessionText}. Coordina y confirma el pago para asegurarla.`,
      };
    case "confirmed":
      return {
        target: "patient" as const,
        subject: "Tu cita fue confirmada",
        body: `Tu cita de ${sessionText} quedó confirmada.`,
      };
    case "meeting_enabled":
      return {
        target: "both" as const,
        subject: "Tu sesión ya tiene enlace",
        body: `Tu sesión de ${sessionText} ya está lista.${meetUrl ? ` Enlace: ${meetUrl}` : ""}`,
      };
    case "cancelled":
      return {
        target: "both" as const,
        subject: "Cita cancelada",
        body: `La cita de ${sessionText} fue cancelada.`,
      };
    case "rejected":
      return {
        target: "patient" as const,
        subject: "Solicitud de cita no disponible",
        body: `La solicitud de cita de ${sessionText} no pudo ser aceptada. Puedes elegir otro horario o perfil.`,
      };
  }
}

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

  const { appointmentId, event } = (await req.json()) as {
    appointmentId?: string;
    event?: AppointmentEvent;
  };
  if (!appointmentId || !event) {
    return new Response(JSON.stringify({ error: "appointmentId and event are required" }), {
      status: 400,
      headers,
    });
  }

  const userClient = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers,
    });
  }

  const admin = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .select("id, patient_id, psychologist_id, starts_at, ends_at, google_meet_url")
    .eq("id", appointmentId)
    .maybeSingle<AppointmentRow>();

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
  if (
    userData.user.id !== appointment.patient_id &&
    userData.user.id !== appointment.psychologist_id
  ) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers,
    });
  }

  const message = buildMessage(event, formatSession(appointment.starts_at), appointment.google_meet_url);
  const recipients: string[] = [];
  if (message.target === "patient" || message.target === "both") recipients.push(appointment.patient_id);
  if (message.target === "psychologist" || message.target === "both") recipients.push(appointment.psychologist_id);

  const results = [];
  for (const userId of recipients) {
    const { data } = await admin.auth.admin.getUserById(userId);
    if (!data.user?.email) {
      results.push({ userId, skipped: "missing_email" });
      continue;
    }
    const result = await sendEmail({
      to: data.user.email,
      subject: message.subject,
      html: `<p>${message.body}</p><p>Entra a El Club para ver el detalle.</p>`,
    });
    results.push({ userId, ...result });
  }

  return new Response(JSON.stringify({ ok: true, results }), { headers });
});
