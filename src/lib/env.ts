// Environment configuration
// All env vars use RYMOS_ prefix (no NEXT_PUBLIC_) to avoid Vercel restrictions
// They are exposed to the browser via next.config.js `env` field

export const env = {
  supabase: {
    url: process.env.RYMOS_SUPABASE_URL || "",
    anonKey: process.env.RYMOS_SUPABASE_ANON_KEY || "",
    serviceKey: process.env.RYMOS_SUPABASE_SERVICE_KEY || "",
  },
  app: {
    url: process.env.RYMOS_APP_URL || "http://localhost:3000",
  },
  admin: {
    email: process.env.RYMOS_ADMIN_EMAIL || "admin@rymos.com",
    password: process.env.RYMOS_ADMIN_PASSWORD || "change-me",
  },
} as const;

// Validate required env vars on server startup
export function validateEnv() {
  const missing: string[] = [];

  if (!env.supabase.url) missing.push("RYMOS_SUPABASE_URL");
  if (!env.supabase.anonKey) missing.push("RYMOS_SUPABASE_ANON_KEY");

  if (missing.length > 0 && typeof window === "undefined") {
    console.warn(
      `Missing environment variables: ${missing.join(", ")}\n` +
        `The app will run in demo mode without database connectivity.`
    );
  }

  return missing;
}
