import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.RYMOS_SUPABASE_URL;
const supabaseAnonKey = process.env.RYMOS_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
