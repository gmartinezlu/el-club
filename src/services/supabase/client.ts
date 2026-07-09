import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../../lib/env";

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (client) return client;
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    // Evitamos "fallbacks mágicos": sin env, la app debe fallar de forma clara.
    // (En producción, esto se configura en el hosting.)
    throw new Error(
      "Faltan variables de entorno de Supabase. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.",
    );
  }

  client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}

