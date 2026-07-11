import "@supabase/functions-js/edge-runtime.d.ts";
import { requireEnv } from "../_shared/env.ts";
import { verifyState } from "../_shared/oauthState.ts";
import { exchangeCodeForTokens, fetchGoogleEmail } from "../_shared/google.ts";
import { encryptToken, bytesToPgHex } from "../_shared/tokenCrypto.ts";
import { createAdminClient } from "../_shared/googleIntegration.ts";

// Google redirects the psychologist's browser here directly after consent —
// there is no app session on this request, so trust is established purely
// via the signed `state` param (see _shared/oauthState.ts), not a JWT.
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const appUrl = requireEnv("APP_URL");
  const settingsUrl = `${appUrl}/psychologist/settings`;

  function redirectWithStatus(status: "connected" | "error"): Response {
    return new Response(null, {
      status: 302,
      headers: { Location: `${settingsUrl}?google=${status}` },
    });
  }

  if (oauthError || !code || !state) {
    return redirectWithStatus("error");
  }

  try {
    const { psychologistId } = await verifyState(requireEnv("OAUTH_STATE_SECRET"), state);

    const redirectUri = `${requireEnv("SUPABASE_URL")}/functions/v1/google-oauth-callback`;
    const tokens = await exchangeCodeForTokens({
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirectUri,
      code,
    });

    if (!tokens.refresh_token) {
      // Google only returns a refresh_token on the first consent (or when
      // prompt=consent forces re-consent, which google-oauth-connect sets).
      // Without it we can't refresh later, so treat this as a hard error.
      throw new Error("Google did not return a refresh_token");
    }

    const googleEmail = await fetchGoogleEmail(tokens.access_token);
    const tokenKey = requireEnv("TOKEN_ENCRYPTION_KEY");

    const accessTokenEncrypted = bytesToPgHex(
      await encryptToken(tokenKey, tokens.access_token),
    );
    const refreshTokenEncrypted = bytesToPgHex(
      await encryptToken(tokenKey, tokens.refresh_token),
    );
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const supabase = createAdminClient();
    const { error } = await supabase.from("google_integrations").upsert({
      psychologist_id: psychologistId,
      google_email: googleEmail,
      calendar_id: "primary",
      access_token_encrypted: accessTokenEncrypted,
      refresh_token_encrypted: refreshTokenEncrypted,
      access_token_expires_at: expiresAt,
    });
    if (error) throw error;

    return redirectWithStatus("connected");
  } catch (error) {
    console.error("google-oauth-callback failed:", error);
    return redirectWithStatus("error");
  }
});
