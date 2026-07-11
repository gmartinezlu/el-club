// AES-GCM encryption for OAuth tokens at rest. The key lives only in
// Supabase secrets (TOKEN_ENCRYPTION_KEY) and is never sent to the client.
// Ciphertext is stored as `nonce || encrypted` so each row can be
// decrypted independently.

async function aesKey(secretBase64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(secretBase64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptToken(
  secretBase64: string,
  plaintext: string,
): Promise<Uint8Array> {
  const key = await aesKey(secretBase64);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    new TextEncoder().encode(plaintext),
  );
  return new Uint8Array([...nonce, ...new Uint8Array(encrypted)]);
}

export async function decryptToken(
  secretBase64: string,
  ciphertext: Uint8Array,
): Promise<string> {
  const key = await aesKey(secretBase64);
  const nonce = ciphertext.slice(0, 12);
  const encrypted = ciphertext.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    encrypted,
  );
  return new TextDecoder().decode(decrypted);
}

// PostgREST represents `bytea` columns as a "\x"-prefixed hex string on the
// wire, both on read and on write.
export function bytesToPgHex(bytes: Uint8Array): string {
  return "\\x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function pgHexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("\\x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}
