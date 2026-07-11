import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";
import { createAdminClient, getValidAccessToken } from "../_shared/googleIntegration.ts";

// Revokes the psychologist's Google grant (best-effort) and deletes their
// row from google_integrations. Requires a valid session — a psychologist
// can only disconnect their own account.
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
  const psychologistId = userData.user.id;

  try {
    const tokenInfo = await getValidAccessToken(admin, psychologistId);
    if (tokenInfo) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenInfo.accessToken}`, {
        method: "POST",
      }).catch(() => {
        // Best-effort: even if Google revocation fails, still remove our
        // stored tokens below so the psychologist is disconnected locally.
      });
    }
  } catch {
    // Ignore — proceed to delete the local row regardless.
  }

  const { error: deleteError } = await admin
    .from("google_integrations")
    .delete()
    .eq("psychologist_id", psychologistId);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
});
