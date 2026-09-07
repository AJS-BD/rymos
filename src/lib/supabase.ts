import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.RYMOS_SUPABASE_URL!;
const supabaseAnonKey = process.env.RYMOS_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  console.warn("RYMOS_SUPABASE_URL is not set");
}

if (!supabaseAnonKey) {
  console.warn("RYMOS_SUPABASE_ANON_KEY is not set");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
