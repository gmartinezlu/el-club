import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { refreshAccessToken } from "./google.ts";
import { decryptToken, encryptToken, bytesToPgHex, pgHexToBytes } from "./tokenCrypto.ts";
import { requireEnv } from "./env.ts";

export function createAdminClient(): SupabaseClient {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

type IntegrationRow = {
  psychologist_id: string;
  google_email: string;
  calendar_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  access_token_expires_at: string;
};

const EXPIRY_SAFETY_MARGIN_MS = 60_000;

/**
 * Returns a valid Google access token for the given psychologist, refreshing
 * it (and persisting the new token) if it has expired or is about to.
 * Returns null if the psychologist has no Google connection.
 */
export async function getValidAccessToken(
  supabase: SupabaseClient,
  psychologistId: string,
): Promise<{ accessToken: string; calendarId: string; googleEmail: string } | null> {
  const { data, error } = await supabase
    .from("google_integrations")
    .select(
      "psychologist_id, google_email, calendar_id, access_token_encrypted, refresh_token_encrypted, access_token_expires_at",
    )
    .eq("psychologist_id", psychologistId)
    .maybeSingle<IntegrationRow>();

  if (error) throw error;
  if (!data) return null;

  const tokenKey = requireEnv("TOKEN_ENCRYPTION_KEY");
  const expiresAt = new Date(data.access_token_expires_at).getTime();

  if (expiresAt - EXPIRY_SAFETY_MARGIN_MS > Date.now()) {
    const accessToken = await decryptToken(tokenKey, pgHexToBytes(data.access_token_encrypted));
    return { accessToken, calendarId: data.calendar_id, googleEmail: data.google_email };
  }

  const refreshToken = await decryptToken(tokenKey, pgHexToBytes(data.refresh_token_encrypted));
  const refreshed = await refreshAccessToken({
    clientId: requireEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    refreshToken,
  });

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  const newAccessTokenEncrypted = bytesToPgHex(
    await encryptToken(tokenKey, refreshed.access_token),
  );

  const { error: updateError } = await supabase
    .from("google_integrations")
    .update({
      access_token_encrypted: newAccessTokenEncrypted,
      access_token_expires_at: newExpiresAt,
    })
    .eq("psychologist_id", psychologistId);
  if (updateError) throw updateError;

  return {
    accessToken: refreshed.access_token,
    calendarId: data.calendar_id,
    googleEmail: data.google_email,
  };
}
