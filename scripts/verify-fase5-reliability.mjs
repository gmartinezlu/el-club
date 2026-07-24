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

// Same test-account convention as the other scripts/verify-*.mjs scripts.
// Override with env vars to point at a different patient/psychologist pair.
const patientEmail =
  process.env.TEST_PATIENT_EMAIL ?? env.TEST_PATIENT_EMAIL ?? "paciente.real.1779900795436@example.com";
const psychologistEmail =
  process.env.TEST_PSYCHOLOGIST_EMAIL ?? env.TEST_PSYCHOLOGIST_EMAIL ?? "psicologa.real.1779900795436@example.com";
const password = process.env.TEST_PASSWORD ?? env.TEST_PASSWORD;
const patientId =
  process.env.TEST_PATIENT_ID ?? env.TEST_PATIENT_ID ?? "334f8fc5-0ced-4fd5-89e7-2698f318e498";
const psychologistId =
  process.env.TEST_PSYCHOLOGIST_ID ?? env.TEST_PSYCHOLOGIST_ID ?? "6ea80f30-b738-4bf6-8ee9-7ab696852ac5";

if (!password) {
  throw new Error(
    "Set TEST_PASSWORD (env var or .env.local) to the password for the test " +
      "patient/psychologist accounts before running this verifier. To use a " +
      "different account pair, also set TEST_PATIENT_EMAIL, " +
      "TEST_PSYCHOLOGIST_EMAIL, TEST_PATIENT_ID and TEST_PSYCHOLOGIST_ID.",
  );
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
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

let response = await patient.auth.signInWithPassword({ email: patientEmail, password });
record("login patient", !response.error, formatError(response.error));

response = await psychologist.auth.signInWithPassword({ email: psychologistEmail, password });
record("login psychologist", !response.error, formatError(response.error));

// Self-approval is intentionally blocked by 014_security_hardening.sql, so
// this test psychologist stays unapproved. That's fine here: neither
// book_appointment nor the crisis chat checks require is_approved, only the
// patient-facing "browse approved psychologists" listing does.
const approve = await psychologist
  .from("psychologists")
  .update({ is_approved: true })
  .eq("user_id", psychologistId);
record(
  "self-approval correctly blocked (014 hardening)",
  Boolean(approve.error) && approve.error.message.includes("propio perfil"),
  formatError(approve.error),
);

// --- 5.5: concurrent booking race fix -------------------------------------
const startsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 20);
startsAt.setUTCHours(16, 0, 0, 0);
const endsAt = new Date(startsAt.getTime() + 50 * 60 * 1000);

const slot = await psychologist
  .from("availability")
  .insert({
    psychologist_id: psychologistId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  })
  .select("id")
  .single();

const slotId = slot.data?.id ?? null;
record("create availability slot", !slot.error, formatError(slot.error) || slotId);

if (slotId) {
  // Fire two concurrent booking RPCs for the same slot. Before the 023 fix,
  // both could pass the availability/conflict check before either committed.
  // After the fix, the `for update` lock serializes them and the unique
  // index is a backstop, so exactly one must succeed.
  const [first, second] = await Promise.all([
    patient.rpc("book_appointment", {
      p_patient_id: patientId,
      p_psychologist_id: psychologistId,
      p_slot_id: slotId,
    }),
    patient.rpc("book_appointment", {
      p_patient_id: patientId,
      p_psychologist_id: psychologistId,
      p_slot_id: slotId,
    }),
  ]);

  const rows = [first, second].map((r) => r.data?.[0] ?? null);
  const successes = rows.filter((r) => r?.success === true);
  const rpcErrors = [first.error, second.error].filter(Boolean);

  record(
    "exactly one concurrent booking succeeds",
    rpcErrors.length === 0 && successes.length === 1,
    JSON.stringify(rows) || rpcErrors.map(formatError).join(" / "),
  );

  const appointmentId = successes[0]?.appointment_id ?? null;

  const conflictCheck = await patient
    .from("appointments")
    .select("id")
    .eq("psychologist_id", psychologistId)
    .eq("starts_at", startsAt.toISOString())
    .neq("status", "cancelled");

  record(
    "no duplicate active appointment for slot",
    !conflictCheck.error && (conflictCheck.data ?? []).length === 1,
    formatError(conflictCheck.error) || `count=${conflictCheck.data?.length}`,
  );

  // Advance the winning appointment through the real accept/pay flow so it
  // reaches 'confirmed' — the crisis chat thread requires an active clinical
  // relationship, which only exists once the appointment is confirmed.
  if (appointmentId) {
    const pending = await psychologist.rpc("mark_appointment_pending_payment", {
      p_appointment_id: appointmentId,
    });
    record("advance appointment to pending_payment", !pending.error, formatError(pending.error));

    const confirmed = await psychologist.rpc("confirm_payment_received", {
      p_appointment_id: appointmentId,
    });
    record("advance appointment to confirmed", !confirmed.error, formatError(confirmed.error));
  }

  // --- 5.9: crisis chat realtime delivery ---------------------------------
  const threadLookup = await patient
    .from("crisis_chat_threads")
    .select("id")
    .eq("patient_id", patientId)
    .eq("psychologist_id", psychologistId)
    .maybeSingle();

  let threadId = threadLookup.data?.id ?? null;
  if (!threadId && !threadLookup.error) {
    const created = await patient
      .from("crisis_chat_threads")
      .insert({ patient_id: patientId, psychologist_id: psychologistId })
      .select("id")
      .single();
    threadId = created.data?.id ?? null;
    if (created.error) {
      record("create crisis thread", false, formatError(created.error));
    }
  }
  record("crisis thread available", Boolean(threadId), threadId ?? "");

  if (threadId) {
    const receivedViaRealtime = await new Promise((resolve) => {
      const marker = `realtime-check-${Date.now()}`;
      let settled = false;

      psychologist
        .channel(`crisis-chat-messages-${threadId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "crisis_chat_messages",
            filter: `thread_id=eq.${threadId}`,
          },
          (payload) => {
            if (payload.new?.body === marker && !settled) {
              settled = true;
              resolve(true);
            }
          },
        )
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await patient.from("crisis_chat_messages").insert({
              thread_id: threadId,
              sender_id: patientId,
              body: marker,
            });
          }
        });

      setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, 12000);
    }).finally(async () => {
      await psychologist.removeAllChannels();
    });

    record(
      "psychologist receives message via realtime",
      receivedViaRealtime,
      receivedViaRealtime ? "received within 12s" : "timed out after 12s",
    );
  }

  // Cleanup: cancel the test appointment so it doesn't pollute real data.
  if (appointmentId) {
    await psychologist
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);
  }
}

console.table(results);

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  process.exitCode = 1;
}
