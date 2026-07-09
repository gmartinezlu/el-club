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
const psychologistId =
  process.env.TEST_PSYCHOLOGIST_ID ?? "6ea80f30-b738-4bf6-8ee9-7ab696852ac5";

if (!password) throw new Error("Set TEST_PASSWORD.");

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

let login = await patient.auth.signInWithPassword({
  email: patientEmail,
  password,
});
record("login patient", !login.error, formatError(login.error));
const patientId = login.data.user?.id;

login = await psychologist.auth.signInWithPassword({
  email: psychologistEmail,
  password,
});
record("login psychologist", !login.error, formatError(login.error));

if (patientId) {
  const roleChange = await patient
    .from("users")
    .update({ role: "admin" })
    .eq("id", patientId);
  record(
    "patient cannot promote role",
    Boolean(roleChange.error?.message?.includes("rol")),
    formatError(roleChange.error),
  );
}

const selfApprove = await psychologist
  .from("psychologists")
  .update({ review_notes: "unsafe client update" })
  .eq("user_id", psychologistId);
record(
  "psychologist cannot edit review internals",
  Boolean(
    selfApprove.error?.message?.includes("revision") ||
      selfApprove.error?.message?.includes("internos"),
  ),
  formatError(selfApprove.error),
);

const directWithdrawal = await psychologist.from("withdrawals").insert({
  psychologist_id: psychologistId,
  amount_cents: 100,
  status: "requested",
});
record(
  "psychologist cannot insert withdrawal directly",
  Boolean(directWithdrawal.error),
  formatError(directWithdrawal.error),
);

console.table(results);

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  process.exitCode = 1;
}
