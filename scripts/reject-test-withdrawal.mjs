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

const withdrawalId = process.env.TEST_WITHDRAWAL_ID;
const adminEmail = process.env.TEST_ADMIN_EMAIL ?? "luisaxoart@gmail.com";
const adminPassword = process.env.TEST_ADMIN_PASSWORD;

if (!withdrawalId || !adminPassword) {
  throw new Error("Set TEST_WITHDRAWAL_ID and TEST_ADMIN_PASSWORD.");
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const login = await supabase.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
});

if (login.error) throw login.error;

const { error } = await supabase.rpc("review_withdrawal_request", {
  p_withdrawal_id: withdrawalId,
  p_status: "rejected",
});

if (error) throw error;

console.log(`Rejected test withdrawal ${withdrawalId}`);
