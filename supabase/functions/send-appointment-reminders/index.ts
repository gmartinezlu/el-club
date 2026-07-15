import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

type ReminderKey = "24h" | "1h";

type AppointmentRow = {
  id: string;
  patient_id: string;
  psychologist_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
};

type UserRow = {
  id: string;
  full_name: string | null;
  whatsapp_phone?: string | null;
};

type PsychologistRow = {
  user_id: string;
  professional_whatsapp: string | null;
};

const REMINDERS: Array<{
  key: ReminderKey;
  label: string;
  fromMinutes: number;
  toMinutes: number;
}> = [
  { key: "24h", label: "mañana", fromMinutes: 23.5 * 60, toMinutes: 24.5 * 60 },
  { key: "1h", label: "en una hora", fromMinutes: 45, toMinutes: 75 },
];

function env(name: string): string | null {
  return Deno.env.get(name) || null;
}

function requiredEnv(name: string): string {
  const value = env(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function formatSession(startsAt: string): string {
  return new Date(startsAt).toLocaleString("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: env("APP_TIME_ZONE") ?? "America/Bogota",
  });
}

function normalizePhone(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 10 ? `+${digits}` : null;
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = env("RESEND_API_KEY");
  const from = env("RESEND_FROM_EMAIL");
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

async function sendWhatsapp({ to, body }: { to: string; body: string }) {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_WHATSAPP_FROM");
  if (!sid || !token || !from) return { skipped: true, reason: "not_configured" };

  const params = new URLSearchParams({
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    To: `whatsapp:${to}`,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );

  if (!response.ok) {
    throw new Error(`Twilio failed: ${response.status} ${await response.text()}`);
  }
  return { skipped: false };
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const headers = { ...corsHeaders(req.headers.get("origin")), "Content-Type": "application/json" };
  const runSecret = env("REMINDER_RUN_SECRET");
  if (runSecret && req.headers.get("x-run-secret") !== runSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers,
    });
  }

  const admin = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"));
  const now = new Date();
  const results: Array<Record<string, unknown>> = [];

  for (const reminder of REMINDERS) {
    const from = new Date(now.getTime() + reminder.fromMinutes * 60_000).toISOString();
    const to = new Date(now.getTime() + reminder.toMinutes * 60_000).toISOString();

    const { data: appointments, error } = await admin
      .from("appointments")
      .select("id, patient_id, psychologist_id, starts_at, ends_at, status")
      .in("status", ["confirmed", "meeting_enabled"])
      .gte("starts_at", from)
      .lt("starts_at", to);

    if (error) throw error;

    for (const appointment of (appointments ?? []) as AppointmentRow[]) {
      const { data: delivery } = await admin
        .from("appointment_reminder_deliveries")
        .select("id, email_sent_at, whatsapp_sent_at, whatsapp_skipped_reason")
        .eq("appointment_id", appointment.id)
        .eq("reminder_key", reminder.key)
        .maybeSingle();

      if (delivery?.email_sent_at && (delivery.whatsapp_sent_at || delivery.whatsapp_skipped_reason)) {
        results.push({ appointmentId: appointment.id, reminder: reminder.key, skipped: "already_sent" });
        continue;
      }

      const { data: users, error: usersError } = await admin
        .from("users")
        .select("id, full_name, whatsapp_phone")
        .in("id", [appointment.patient_id, appointment.psychologist_id]);
      if (usersError) throw usersError;

      const userMap = new Map((users ?? []).map((user: UserRow) => [user.id, user]));
      const patient = userMap.get(appointment.patient_id);
      const psychologist = userMap.get(appointment.psychologist_id);

      const { data: psychRow } = await admin
        .from("psychologists")
        .select("user_id, professional_whatsapp")
        .eq("user_id", appointment.psychologist_id)
        .maybeSingle<PsychologistRow>();

      const { data: patientAuth } = await admin.auth.admin.getUserById(appointment.patient_id);
      const { data: psychologistAuth } = await admin.auth.admin.getUserById(appointment.psychologist_id);

      const sessionText = formatSession(appointment.starts_at);
      const patientName = patient?.full_name?.trim() || "paciente";
      const psychologistName = psychologist?.full_name?.trim() || "psicóloga";
      const title = `Recordatorio de cita ${reminder.label}`;
      const patientBody = `Tienes sesión con ${psychologistName} ${reminder.label}: ${sessionText}.`;
      const psychBody = `Tienes sesión con ${patientName} ${reminder.label}: ${sessionText}.`;

      await admin.from("notifications").insert([
        { user_id: appointment.patient_id, title, body: patientBody },
        { user_id: appointment.psychologist_id, title, body: psychBody },
      ]);

      let emailSent = false;
      let whatsappSent = false;
      let whatsappSkippedReason: string | null = null;
      let errorMessage: string | null = null;

      try {
        const emails = [
          patientAuth.user?.email
            ? sendEmail({
                to: patientAuth.user.email,
                subject: title,
                html: `<p>${patientBody}</p><p>Entra a El Club para ver el detalle de tu cita.</p>`,
              })
            : Promise.resolve({ skipped: true }),
          psychologistAuth.user?.email
            ? sendEmail({
                to: psychologistAuth.user.email,
                subject: title,
                html: `<p>${psychBody}</p><p>Entra a El Club para ver tu agenda.</p>`,
              })
            : Promise.resolve({ skipped: true }),
        ];
        const emailResults = await Promise.all(emails);
        emailSent = emailResults.some((item) => !item.skipped);

        const patientPhone = normalizePhone(patient?.whatsapp_phone);
        const psychologistPhone = normalizePhone(psychRow?.professional_whatsapp);
        const whatsappResults = await Promise.all([
          patientPhone
            ? sendWhatsapp({ to: patientPhone, body: patientBody })
            : Promise.resolve({ skipped: true, reason: "patient_phone_missing" }),
          psychologistPhone
            ? sendWhatsapp({ to: psychologistPhone, body: psychBody })
            : Promise.resolve({ skipped: true, reason: "psychologist_phone_missing" }),
        ]);
        whatsappSent = whatsappResults.some((item) => !item.skipped);
        if (!whatsappSent) {
          whatsappSkippedReason =
            whatsappResults
              .map((item) => ("reason" in item ? item.reason : null))
              .filter(Boolean)
              .join(",") || "not_configured";
        }
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : "Unknown reminder error";
      }

      await admin.from("appointment_reminder_deliveries").upsert(
        {
          appointment_id: appointment.id,
          reminder_key: reminder.key,
          email_sent_at: emailSent ? new Date().toISOString() : null,
          whatsapp_sent_at: whatsappSent ? new Date().toISOString() : null,
          whatsapp_skipped_reason: whatsappSkippedReason,
          error: errorMessage,
        },
        { onConflict: "appointment_id,reminder_key" },
      );

      results.push({
        appointmentId: appointment.id,
        reminder: reminder.key,
        emailSent,
        whatsappSent,
        whatsappSkippedReason,
        error: errorMessage,
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers,
  });
});
