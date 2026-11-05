import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

/**
 * Server-side Supabase client for API routes.
 *
 * Uses the service-role key (SUPABASE_SERVICE_ROLE_KEY) when it is set.
 * The service-role client bypasses RLS, which the checkout flow needs:
 *   - coupons: anon may only SELECT active coupons, never UPDATE usage_count
 *   - credit_applications: anon has a SELECT-only policy, no INSERT
 *   - products: anon may UPDATE the stock column only (so the stock
 *     decrement works either way, but the other two do not)
 *
 * Falls back to the anon client (getSupabase()) when no service-role key
 * is configured, so plain COD / shop-pickup orders still work. With the
 * anon fallback, coupon usage counting and credit-application creation
 * will fail server-side and are logged, not fatal to the order.
 *
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser: it must only
 * exist in server env vars (Vercel dashboard -> Settings -> Environment
 * Variables). It must never be prefixed with NEXT_PUBLIC_.
 */
let _serverClient: SupabaseClient | null = null;

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getServerSupabase(): SupabaseClient {
  if (_serverClient) return _serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    _serverClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return _serverClient;
  }

  if (!serviceKey) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY is not set — checkout API is using the anon client. " +
        "Coupon usage counting and credit-application creation will not work until the service-role key is configured."
    );
  }

  // Anon fallback: same client the browser uses.
  _serverClient = getSupabase();
  return _serverClient;
}
