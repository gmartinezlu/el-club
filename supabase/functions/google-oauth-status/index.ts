import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";
import { createAdminClient } from "../_shared/googleIntegration.ts";

// Returns whether the calling psychologist has a Google connection, and
// which email it's connected as — without ever exposing tokens to the
// client (google_integrations has no client-side SELECT grant).
Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const headers = corsHeaders(req.headers.get("origin"));

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers,
    });
  }

  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers,
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("google_integrations")
    .select("google_email, connected_at")
    .eq("psychologist_id", userData.user.id)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    });
  }

  return new Response(
    JSON.stringify(
      data
        ? { connected: true, googleEmail: data.google_email, connectedAt: data.connected_at }
        : { connected: false },
    ),
    { headers: { ...headers, "Content-Type": "application/json" } },
  );
});
