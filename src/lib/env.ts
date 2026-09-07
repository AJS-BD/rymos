// Environment configuration
// Uses NEXT_PUBLIC_ prefix as that's what Vercel provides
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
} as const;

// Validate required env vars on server startup
export function validateEnv() {
  const missing: string[] = [];

  if (!env.supabase.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.supabase.anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0 && typeof window === "undefined") {
    console.warn(
      `Missing environment variables: ${missing.join(", ")}\n` +
        `The app will run in demo mode without database connectivity.`
    );
  }

  return missing;
}
