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
const psychologistEmail =
  process.env.TEST_PSYCHOLOGIST_EMAIL ?? "psicologa.real.1779900795436@example.com";
const password = process.env.TEST_PASSWORD;
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

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

const login = await supabase.auth.signInWithPassword({
  email: psychologistEmail,
  password,
});
record("login psychologist", !login.error, formatError(login.error));

const profile = await supabase
  .from("psychologists")
  .select(
    "user_id, is_approved, application_status, review_notes, reviewed_at, reviewed_by",
  )
  .eq("user_id", psychologistId)
  .maybeSingle();

record(
  "migration 011 review columns",
  !profile.error && Boolean(profile.data?.application_status),
  formatError(profile.error) || JSON.stringify(profile.data),
);

const nonAdminReview = await supabase.rpc("review_psychologist_application", {
  p_psychologist_id: psychologistId,
  p_status: "pending",
  p_review_notes: "permission check",
});

record(
  "review rpc exists and blocks non-admin",
  Boolean(nonAdminReview.error?.message?.includes("No tienes permisos")),
  formatError(nonAdminReview.error),
);

console.table(results);

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  process.exitCode = 1;
}
