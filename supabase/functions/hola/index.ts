import "@supabase/functions-js/edge-runtime.d.ts";

// Prueba mínima para confirmar que el pipeline de Edge Functions
// (deploy + invocación) funciona antes de construir el flujo de Google.
Deno.serve(() => Response.json({ ok: true, message: "hola desde Supabase Edge Functions" }));
