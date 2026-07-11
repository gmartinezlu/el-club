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

const patientEmail =
  process.env.TEST_PATIENT_EMAIL ?? "paciente.real.1779900795436@example.com";
const psychologistEmail =
  process.env.TEST_PSYCHOLOGIST_EMAIL ?? "psicologa.real.1779900795436@example.com";
const password = process.env.TEST_PASSWORD;
const patientId =
  process.env.TEST_PATIENT_ID ?? "334f8fc5-0ced-4fd5-89e7-2698f318e498";
const psychologistId =
  process.env.TEST_PSYCHOLOGIST_ID ?? "6ea80f30-b738-4bf6-8ee9-7ab696852ac5";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
}

if (!password) {
  throw new Error("Set TEST_PASSWORD before running this verifier.");
}

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
}

function formatError(error) {
  if (!error) return "";
  return [error.message, error.code].filter(Boolean).join(" | ");
}

const patient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});
const psychologist = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

let response = await patient.auth.signInWithPassword({
  email: patientEmail,
  password,
});
record("login patient", !response.error, formatError(response.error));

response = await psychologist.auth.signInWithPassword({
  email: psychologistEmail,
  password,
});
record("login psychologist", !response.error, formatError(response.error));

const threadProbe = await patient
  .from("crisis_chat_threads")
  .select("id")
  .limit(1);
record(
  "migration 009 crisis table",
  !threadProbe.error,
  formatError(threadProbe.error),
);

let threadId = null;
if (!threadProbe.error) {
  const existing = await patient
    .from("crisis_chat_threads")
    .select("id")
    .eq("patient_id", patientId)
    .eq("psychologist_id", psychologistId)
    .maybeSingle();

  if (existing.error) {
    record("find crisis thread", false, formatError(existing.error));
  } else if (existing.data?.id) {
    threadId = existing.data.id;
    record("find crisis thread", true, threadId);
  } else {
    const created = await patient
      .from("crisis_chat_threads")
      .insert({ patient_id: patientId, psychologist_id: psychologistId })
      .select("id")
      .single();

    threadId = created.data?.id ?? null;
    record("create crisis thread", !created.error, formatError(created.error) || threadId);
  }
}

if (threadId) {
  const patientMessage = await patient
    .from("crisis_chat_messages")
    .insert({
      thread_id: threadId,
      sender_id: patientId,
      body: "Mensaje de prueba paciente - chat crisis",
    })
    .select("id")
    .single();
  record(
    "patient sends crisis message",
    !patientMessage.error,
    formatError(patientMessage.error) || patientMessage.data?.id,
  );

  const psychologistThread = await psychologist
    .from("crisis_chat_threads")
    .select("id")
    .eq("id", threadId)
    .single();
  record(
    "psychologist reads crisis thread",
    !psychologistThread.error,
    formatError(psychologistThread.error) || psychologistThread.data?.id,
  );

  const psychologistMessage = await psychologist
    .from("crisis_chat_messages")
    .insert({
      thread_id: threadId,
      sender_id: psychologistId,
      body: "Respuesta de prueba psicologa - chat crisis",
    })
    .select("id")
    .single();
  record(
    "psychologist sends crisis message",
    !psychologistMessage.error,
    formatError(psychologistMessage.error) || psychologistMessage.data?.id,
  );
}

const startsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 15);
startsAt.setUTCHours(15, 0, 0, 0);
const endsAt = new Date(startsAt.getTime() + 50 * 60 * 1000);

const appointment = await patient
  .from("appointments")
  .insert({
    patient_id: patientId,
    psychologist_id: psychologistId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "pending_payment",
  })
  .select("id")
  .single();

const appointmentId = appointment.data?.id ?? null;
record(
  "create pricing test appointment",
  !appointment.error,
  formatError(appointment.error) || appointmentId,
);

if (appointmentId) {
  const payment = await patient.rpc("confirm_demo_payment", {
    p_appointment_id: appointmentId,
  });
  record("confirm demo payment", !payment.error, formatError(payment.error));

  const paymentRow = await patient
    .from("payments")
    .select("amount_cents, platform_fee_cents, psychologist_fee_cents, currency, status")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  const data = paymentRow.data;
  const amountsOk =
    data?.amount_cents === 11000000 &&
    data?.platform_fee_cents === 2000000 &&
    data?.psychologist_fee_cents === 9000000;

  record(
    "payment split is 110/20/90",
    !paymentRow.error && amountsOk,
    formatError(paymentRow.error) || JSON.stringify(data),
  );
}

console.table(results);

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  process.exitCode = 1;
}
