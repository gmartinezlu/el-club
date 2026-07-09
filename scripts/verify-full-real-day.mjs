import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split("=")),
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const adminEmail = process.env.TEST_ADMIN_EMAIL ?? "luisaxoart@gmail.com";
const adminPassword = process.env.TEST_ADMIN_PASSWORD;
const password = process.env.TEST_NEW_USER_PASSWORD ?? "ElClubDiaReal2026!";
const stamp = Date.now();
const patientEmail = `paciente.dia.real.${stamp}@example.com`;
const psychologistEmail = `psicologa.dia.real.${stamp}@example.com`;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
}

if (!adminPassword) {
  throw new Error("Set TEST_ADMIN_PASSWORD.");
}

const results = [];
const created = {
  patientEmail,
  psychologistEmail,
  password,
  patientId: null,
  psychologistId: null,
  appointmentId: null,
  withdrawalId: null,
};

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

function formatError(error) {
  if (!error) return "";
  return [error.message, error.code].filter(Boolean).join(" | ");
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function signUpAndSignIn(client, email, role, fullName, metadata = {}) {
  const signup = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
        ...metadata,
      },
    },
  });
  if (signup.error) throw signup.error;

  const login = await client.auth.signInWithPassword({ email, password });
  if (login.error) throw login.error;
  return login.data.user.id;
}

const patient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});
const psychologist = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});
const admin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

try {
  created.patientId = await signUpAndSignIn(
    patient,
    patientEmail,
    "patient",
    "Paciente Dia Real",
  );
  record("patient signup/login", true, created.patientId);
} catch (error) {
  record("patient signup/login", false, formatError(error));
}

try {
  created.psychologistId = await signUpAndSignIn(
    psychologist,
    psychologistEmail,
    "psychologist",
    "Psicologa Dia Real",
    {
      professional_title: "Psicologa clinica",
      license_number: `TP-${stamp}`,
      university: "Universidad de prueba",
      experience_years: "7",
      clinical_approach: "Acompanamiento integrativo con enfoque humano.",
      application_notes: "Postulacion creada para prueba real completa.",
    },
  );
  record("psychologist signup/login", true, created.psychologistId);
} catch (error) {
  record("psychologist signup/login", false, formatError(error));
}

const adminLogin = await admin.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
});
record("admin login", !adminLogin.error, formatError(adminLogin.error));

if (created.psychologistId) {
  const path = `${created.psychologistId}/dia-real-${stamp}.pdf`;
  const pdfBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0x45, 0x4f,
    0x46,
  ]);
  const upload = await psychologist.storage
    .from("psychologist-documents")
    .upload(path, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
  record("psychologist uploads document", !upload.error, formatError(upload.error) || path);

  const updateDocument = await psychologist
    .from("psychologists")
    .update({
      document_url: path,
      application_status: "pending",
      is_approved: false,
      application_submitted_at: new Date().toISOString(),
    })
    .eq("user_id", created.psychologistId);
  record(
    "document path saved and review reset",
    !updateDocument.error,
    formatError(updateDocument.error),
  );
}

if (created.psychologistId) {
  const approval = await admin.rpc("review_psychologist_application", {
    p_psychologist_id: created.psychologistId,
    p_status: "approved",
    p_review_notes: "Aprobada para prueba real completa.",
  });
  record("admin approves psychologist", !approval.error, formatError(approval.error));
}

if (created.psychologistId) {
  const profile = await psychologist
    .from("psychologists")
    .update({
      bio: "Acompano procesos de ansiedad, duelo y autoestima con calidez.",
      specialties: ["Ansiedad", "Duelo", "Autoestima"],
      languages: ["Espanol"],
    })
    .eq("user_id", created.psychologistId);
  record("psychologist completes profile", !profile.error, formatError(profile.error));
}

const startsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10);
startsAt.setUTCHours(16, 0, 0, 0);
const endsAt = addMinutes(startsAt, 50);

if (created.psychologistId) {
  const slot = await psychologist.from("availability").insert({
    psychologist_id: created.psychologistId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });
  record("psychologist creates availability", !slot.error, formatError(slot.error));
}

if (created.patientId && created.psychologistId) {
  const onboarding = await patient
    .from("patients")
    .update({
      main_concern: "Ansiedad y estres",
      emotional_goals: ["Dormir mejor", "Regular emociones"],
      therapy_preferences: ["Espacio calido", "Herramientas practicas"],
      current_mood: 6,
      urgency: "medium",
      support_style: "cercano",
      onboarding_notes: "Prueba real completa.",
      onboarding_completed: true,
    })
    .eq("user_id", created.patientId);
  record("patient completes onboarding", !onboarding.error, formatError(onboarding.error));

  const appointment = await patient
    .from("appointments")
    .insert({
      patient_id: created.patientId,
      psychologist_id: created.psychologistId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "pending_payment",
    })
    .select("id")
    .single();
  created.appointmentId = appointment.data?.id ?? null;
  record(
    "patient books appointment",
    !appointment.error,
    formatError(appointment.error) || created.appointmentId,
  );
}

if (created.appointmentId) {
  const payment = await patient.rpc("confirm_demo_payment", {
    p_appointment_id: created.appointmentId,
  });
  record("patient confirms demo payment", !payment.error, formatError(payment.error));

  const paymentRow = await patient
    .from("payments")
    .select("amount_cents, platform_fee_cents, psychologist_fee_cents, status")
    .eq("appointment_id", created.appointmentId)
    .single();
  const splitOk =
    paymentRow.data?.amount_cents === 11000000 &&
    paymentRow.data?.platform_fee_cents === 2000000 &&
    paymentRow.data?.psychologist_fee_cents === 9000000 &&
    paymentRow.data?.status === "approved";
  record(
    "payment split 110/20/90",
    !paymentRow.error && splitOk,
    formatError(paymentRow.error) || JSON.stringify(paymentRow.data),
  );
}

if (created.appointmentId && created.psychologistId) {
  const meet = await psychologist
    .from("appointments")
    .update({
      google_meet_url: "https://meet.google.com/abc-defg-hij",
      status: "meeting_enabled",
    })
    .eq("id", created.appointmentId)
    .eq("psychologist_id", created.psychologistId);
  record("psychologist enables Meet", !meet.error, formatError(meet.error));

  const note = await psychologist.from("psychologist_session_notes").upsert(
    {
      appointment_id: created.appointmentId,
      psychologist_id: created.psychologistId,
      notes: "Notas privadas de prueba real.",
    },
    { onConflict: "appointment_id" },
  );
  record("psychologist saves private notes", !note.error, formatError(note.error));

  const complete = await psychologist
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", created.appointmentId)
    .eq("psychologist_id", created.psychologistId);
  record("psychologist completes session", !complete.error, formatError(complete.error));
}

let threadId = null;
if (created.patientId && created.psychologistId) {
  const thread = await patient
    .from("crisis_chat_threads")
    .insert({
      patient_id: created.patientId,
      psychologist_id: created.psychologistId,
    })
    .select("id")
    .single();
  threadId = thread.data?.id ?? null;
  record("patient gets crisis chat", !thread.error, formatError(thread.error) || threadId);
}

if (threadId && created.patientId && created.psychologistId) {
  const patientMessage = await patient.from("crisis_chat_messages").insert({
    thread_id: threadId,
    sender_id: created.patientId,
    body: "Hola, necesito una orientacion breve.",
  });
  record("patient sends crisis message", !patientMessage.error, formatError(patientMessage.error));

  const psychMessage = await psychologist.from("crisis_chat_messages").insert({
    thread_id: threadId,
    sender_id: created.psychologistId,
    body: "Estoy aqui. Respiremos y revisemos un paso pequeno.",
  });
  record("psychologist replies crisis message", !psychMessage.error, formatError(psychMessage.error));
}

const withdrawal = await psychologist.rpc("request_psychologist_withdrawal", {
  p_amount_cop: 90000,
});
created.withdrawalId = withdrawal.data ?? null;
record(
  "psychologist requests withdrawal",
  !withdrawal.error,
  formatError(withdrawal.error) || created.withdrawalId,
);

if (created.withdrawalId) {
  const processing = await admin.rpc("review_withdrawal_request", {
    p_withdrawal_id: created.withdrawalId,
    p_status: "processing",
  });
  record("admin moves withdrawal to processing", !processing.error, formatError(processing.error));
}

if (created.patientId && created.psychologistId) {
  const [patientNotifications, psychologistNotifications] = await Promise.all([
    patient.from("notifications").select("id").eq("user_id", created.patientId),
    psychologist
      .from("notifications")
      .select("id")
      .eq("user_id", created.psychologistId),
  ]);
  record(
    "patient notifications visible",
    !patientNotifications.error,
    formatError(patientNotifications.error) ||
      `${patientNotifications.data?.length ?? 0} notifications`,
  );
  record(
    "psychologist notifications visible",
    !psychologistNotifications.error &&
      (psychologistNotifications.data?.length ?? 0) > 0,
    formatError(psychologistNotifications.error) ||
      `${psychologistNotifications.data?.length ?? 0} notifications`,
  );
}

console.table(results);
console.log(JSON.stringify({ created }, null, 2));

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  process.exitCode = 1;
}
