import type { PostgrestError } from "@supabase/supabase-js";

// Postgres: 42703 = undefined_column, 42P01 = undefined_table/relation.
// PostgREST: PGRST205 = table not found in schema cache.
const SAFE_SCHEMA_ERROR_CODES = new Set(["42703", "42P01", "PGRST205"]);

/**
 * Check if error is a "safe" schema-related error (missing column/relation)
 * that can be safely ignored with a fallback. Relies on the structured
 * Postgres/PostgREST error code, not a text match on the message, so
 * network or permission errors are never misclassified as safe.
 */
export function isSafeSchemaError(error: unknown): boolean {
  if (!error) return false;
  const code = (error as Partial<PostgrestError>)?.code;
  return typeof code === "string" && SAFE_SCHEMA_ERROR_CODES.has(code);
}
