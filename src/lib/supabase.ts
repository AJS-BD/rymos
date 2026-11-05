import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Create client lazily to avoid build-time errors
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Fail fast in production: a placeholder client used to make every
    // Supabase call fail opaquely (auth errors, empty lists) with no hint
    // that the env vars were missing. In dev the placeholder is kept so the
    // app can still render without a backend (pages guard with
    // isConfigured() first). Every server-component caller already guards
    // with isConfigured() before calling this, so build-time prerendering
    // is unaffected.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and " +
          "NEXT_PUBLIC_SUPABASE_ANON_KEY. Refusing to run with placeholder credentials."
      );
    }
    console.warn("Supabase env vars not set — using placeholder");
  }

  _client = createClient(
    url || "https://placeholder.supabase.co",
    key || "placeholder-key"
  );

  return _client;
}

// Check at call time, not module load time
export function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
