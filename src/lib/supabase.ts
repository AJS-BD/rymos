import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.RYMOS_SUPABASE_URL;
const supabaseAnonKey = process.env.RYMOS_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn("RYMOS_SUPABASE_URL is not set — using demo mode");
}

if (!supabaseAnonKey) {
  console.warn("RYMOS_SUPABASE_ANON_KEY is not set — using demo mode");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
