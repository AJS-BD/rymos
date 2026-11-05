import { getSupabase } from "@/lib/supabase";

/**
 * Client helpers for the admin session cookie (see
 * src/app/api/admin/session/route.ts).
 *
 * The Supabase browser client stores its session in localStorage, which the
 * server proxy cannot read. After an admin signs in, the session is copied
 * (server-verified as an active admin first) into an httpOnly cookie so
 * src/proxy.ts can gate /admin/*. Best-effort: a failed sync only means the
 * proxy will bounce the next /admin navigation back to /admin/login, where
 * signing in again retries the sync.
 */

export async function syncAdminSession(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearAdminSession(): Promise<void> {
  try {
    await fetch("/api/admin/session", { method: "DELETE" });
  } catch {
    // Logout must never fail because the cookie clear failed.
  }
}

/** Bearer headers for admin-only API calls (e.g. /api/settings). */
export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  } catch {
    return {};
  }
}
