import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Create client lazily to avoid build-time errors
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
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
