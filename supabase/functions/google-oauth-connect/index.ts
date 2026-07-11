import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";
import { signState } from "../_shared/oauthState.ts";
import { buildGoogleAuthUrl } from "../_shared/google.ts";

// Called by the authenticated psychologist from Settings. Returns the
// Google consent URL to redirect to; verify_jwt (see config.toml) ensures
// only a logged-in user can reach this, and the psychologist id comes from
// their verified JWT, never from client input.
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

  const state = await signState(requireEnv("OAUTH_STATE_SECRET"), userData.user.id);
  const redirectUri = `${requireEnv("SUPABASE_URL")}/functions/v1/google-oauth-callback`;

  const authUrl = buildGoogleAuthUrl({
    clientId: requireEnv("GOOGLE_CLIENT_ID"),
    redirectUri,
    state,
  });

  return new Response(JSON.stringify({ authUrl }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
});
