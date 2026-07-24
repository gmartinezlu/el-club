import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const patientEmail =
  process.env.TEST_PATIENT_EMAIL ?? "paciente.real.1779900795436@example.com";
const psychologistEmail =
  process.env.TEST_PSYCHOLOGIST_EMAIL ?? "psicologa.real.1779900795436@example.com";
const adminEmail = process.env.TEST_ADMIN_EMAIL ?? "luisaxoart@gmail.com";
const patientPassword = process.env.TEST_PATIENT_PASSWORD ?? process.env.TEST_PASSWORD;
const psychologistPassword =
  process.env.TEST_PSYCHOLOGIST_PASSWORD ?? process.env.TEST_PASSWORD;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;
const psychologistId =
  process.env.TEST_PSYCHOLOGIST_ID ?? "6ea80f30-b738-4bf6-8ee9-7ab696852ac5";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
}

if (!patientPassword || !psychologistPassword || !adminPassword) {
  throw new Error(
    "Set TEST_PATIENT_PASSWORD, TEST_PSYCHOLOGIST_PASSWORD and TEST_ADMIN_PASSWORD.",
  );
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
const admin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

let login = await patient.auth.signInWithPassword({
  email: patientEmail,
  password: patientPassword,
});
record("login patient", !login.error, formatError(login.error));
const patientId = login.data.user?.id;

login = await psychologist.auth.signInWithPassword({
  email: psychologistEmail,
  password: psychologistPassword,
});
record("login psychologist", !login.error, formatError(login.error));

login = await admin.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
});
record("login admin", !login.error, formatError(login.error));

const balance = await psychologist.rpc("available_psychologist_balance_cents", {
  p_psychologist_id: psychologistId,
});
record(
  "migration 012 balance rpc",
  !balance.error && typeof balance.data === "number",
  formatError(balance.error) || String(balance.data),
);

const withdrawal = await psychologist.rpc("request_psychologist_withdrawal", {
  p_amount_cop: 1,
});
record(
  "migration 012 withdrawal rpc guarded",
  Boolean(
    withdrawal.error?.message?.includes("saldo") ||
      withdrawal.data ||
      Number(balance.data) >= 100,
  ),
  formatError(withdrawal.error) || String(withdrawal.data),
);

const documentPath = `${psychologistId}/verify-${Date.now()}.pdf`;
const pdfBytes = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0x45, 0x4f,
  0x46,
]);
const upload = await psychologist.storage
  .from("psychologist-documents")
  .upload(documentPath, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });
record(
  "migration 013 storage upload own document",
  !upload.error,
  formatError(upload.error) || documentPath,
);

const signed = await admin.storage
  .from("psychologist-documents")
  .createSignedUrl(documentPath, 60);
record(
  "migration 013 admin signed document url",
  !signed.error && Boolean(signed.data?.signedUrl),
  formatError(signed.error) || "signed url ok",
);

let ticketId = null;
if (patientId) {
  const ticket = await patient
    .from("support_tickets")
    .insert({
      user_id: patientId,
      subject: "Prueba soporte admin",
      body: "Ticket de verificacion para soporte con respuesta.",
      status: "open",
    })
    .select("id")
    .single();
  ticketId = ticket.data?.id ?? null;
  record(
    "create support ticket",
    !ticket.error,
    formatError(ticket.error) || ticketId,
  );
}

if (ticketId) {
  const response = await admin.rpc("respond_support_ticket", {
    p_ticket_id: ticketId,
    p_response: "Respuesta de prueba enviada desde admin.",
    p_status: "closed",
  });
  record(
    "migration 013 respond support ticket",
    !response.error,
    formatError(response.error),
  );

  const ticket = await admin
    .from("support_tickets")
    .select("admin_response, status")
    .eq("id", ticketId)
    .single();
  record(
    "support response persisted",
    !ticket.error && ticket.data?.status === "closed",
    formatError(ticket.error) || JSON.stringify(ticket.data),
  );
}

console.table(results);

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  process.exitCode = 1;
}
