import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

/**
 * Server-side admin check for API routes (used by /api/settings and
 * /api/admin/session).
 *
 * The browser client keeps its session in localStorage, NOT in cookies, so
 * route handlers cannot read it from cookies — callers must send
 * `Authorization: Bearer <access_token>` (the admin settings page does this
 * via src/lib/admin-session.ts). The token is validated against Supabase Auth
 * and the user must have an active row in `admin_users`.
 *
 * This intentionally does NOT use the service-role key: the check runs as the
 * caller's own authenticated role, so it stays correct under RLS (including
 * the tightened `admin_users` policy in
 * supabase/migrations/20261105_security_settings.sql, which lets a user see
 * only their own admin row — the row this check looks up).
 */

function getEnv(): { url: string; key: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

/** Cookie name @supabase/ssr uses for the session, e.g. `sb-<ref>-auth-token`. */
export function getAuthCookieName(): string | null {
  const { url } = getEnv();
  if (!url) return null;
  try {
    const ref = new URL(url).hostname.split(".")[0];
    return ref ? `sb-${ref}-auth-token` : null;
  } catch {
    return null;
  }
}

export function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

/** Validate a Bearer token against Supabase Auth. Returns null when invalid. */
export async function getBearerUser(
  req: NextRequest
): Promise<{ user: User; token: string } | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const { url, key } = getEnv();
  if (!url || !key) return null;
  const anon = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await anon.auth.getUser(token);
  if (error || !user) return null;
  return { user, token };
}

/** A client that acts as the Bearer-token holder (authenticated role). */
export function getUserClient(token: string): SupabaseClient | null {
  const { url, key } = getEnv();
  if (!url || !key || !token) return null;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface AdminIdentity {
  user: User;
  token: string;
  /** User-scoped client — use it for reads/writes so RLS sees the admin. */
  client: SupabaseClient;
}

/**
 * Full admin check: valid session + active `admin_users` row.
 * Returns null for missing/invalid tokens AND for valid non-admin users —
 * callers that need to tell 401 from 403 should call getBearerUser first.
 */
export async function getAdminFromRequest(
  req: NextRequest
): Promise<AdminIdentity | null> {
  const bearer = await getBearerUser(req);
  if (!bearer) return null;
  const client = getUserClient(bearer.token);
  if (!client) return null;
  const { data: adminRow, error } = await client
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", bearer.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !adminRow) return null;
  return { user: bearer.user, token: bearer.token, client };
}
