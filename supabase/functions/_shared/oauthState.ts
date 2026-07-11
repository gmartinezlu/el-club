// Signs/verifies the OAuth `state` param so the callback (called directly by
// Google via redirect, with no app session) can trust which psychologist
// started the flow and reject tampered or expired values (CSRF defense).

const STATE_TTL_MS = 10 * 60 * 1000;

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "===".slice((padded.length + 3) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function signState(
  secret: string,
  psychologistId: string,
): Promise<string> {
  const payload = JSON.stringify({ psychologistId, iat: Date.now() });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64),
  );
  return `${payloadB64}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyState(
  secret: string,
  state: string,
): Promise<{ psychologistId: string }> {
  const [payloadB64, signatureB64] = state.split(".");
  if (!payloadB64 || !signatureB64) {
    throw new Error("Malformed state parameter");
  }

  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signatureB64),
    new TextEncoder().encode(payloadB64),
  );
  if (!valid) {
    throw new Error("State signature mismatch");
  }

  const payload = JSON.parse(
    new TextDecoder().decode(fromBase64Url(payloadB64)),
  ) as { psychologistId: string; iat: number };

  if (Date.now() - payload.iat > STATE_TTL_MS) {
    throw new Error("State parameter expired");
  }

  return { psychologistId: payload.psychologistId };
}
