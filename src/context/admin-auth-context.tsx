"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { clearAdminSession, syncAdminSession } from "@/lib/admin-session";

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  /** True while admin_users is missing from prod (sync SQL not run yet) */
  fallback: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  adminLogin: (email: string, password: string) => Promise<{ error?: string }>;
  adminLogout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

const FALLBACK_ADMIN: AdminUser = {
  id: "fallback",
  email: "",
  fullName: "Unprotected Mode",
  role: "admin",
  fallback: true,
};

/** Postgrest codes meaning "admin_users schema not deployed/upgraded yet" —
 *  PGRST205/42P01 = table missing, 42703/PGRST204 = legacy stub missing new
 *  columns, 42501 = grants not applied. */
function isSchemaNotReady(err: { code?: string } | null | undefined): boolean {
  if (!err?.code) return false;
  return ["PGRST205", "42P01", "42703", "PGRST204", "42501"].includes(err.code);
}

/**
 * Unprotected (fallback) mode is a DEV-ONLY bootstrap aid. It is allowed
 * only when BOTH hold: not production, AND the explicit opt-in flag is set
 * (NEXT_PUBLIC_ prefix because this code runs in the browser bundle — a
 * plain ALLOW_UNPROTECTED_ADMIN_DEV is not inlined into client code).
 * In production the flag is ignored entirely: the panel fails closed
 * (no admin, AdminShell redirects to /admin/login). Never set this flag
 * in a production deployment.
 */
function isUnprotectedDevMode(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ALLOW_UNPROTECTED_ADMIN_DEV === "true"
  );
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshAdmin = useCallback(async () => {
    if (!isConfigured()) {
      // No Supabase at all. Dev-only unprotected mode keeps the panel usable
      // locally; in production fail closed — no admin, AdminShell redirects
      // to /admin/login (where adminLogin reports "not configured").
      if (isUnprotectedDevMode()) {
        setAdmin(FALLBACK_ADMIN);
      } else {
        setAdmin(null);
      }
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // admin_users missing from prod = sync SQL not run yet. The gate cannot
    // verify membership, so stay open (same exposure as before this phase)
    // and let the UI show a setup banner.
    const { data: adminRow, error } = await supabase
      .from("admin_users")
      .select("id, email, full_name, role, is_active, auth_user_id")
      .eq("is_active", true)
      .eq("auth_user_id", session?.user?.id ?? "00000000-0000-0000-0000-000000000000")
      .maybeSingle();

    if (error && isSchemaNotReady(error)) {
      // admin_users missing from prod = sync SQL not run yet. In dev-only
      // unprotected mode stay open so /setup can run; in production fail
      // closed and send the user to the login page with an error — an
      // unprotected admin panel must never be reachable in production
      // just because the database is misconfigured.
      if (isUnprotectedDevMode()) {
        setAdmin(FALLBACK_ADMIN);
      } else {
        setAdmin(null);
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/admin/login"
        ) {
          router.replace("/admin/login?error=admin-setup-incomplete");
        }
      }
      setLoading(false);
      return;
    }

    if (!session?.user || !adminRow) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    setAdmin({
      id: adminRow.id,
      email: adminRow.email,
      fullName: adminRow.full_name || session.user.email || "",
      role: adminRow.role,
      fallback: false,
    });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- mount-only session restore: async fetch sets state post-await, matching auth-context precedent */
    refreshAdmin();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [refreshAdmin]);

  const adminLogin = useCallback(async (email: string, password: string) => {
    if (!isConfigured()) {
      return { error: "Authentication is not configured." };
    }

    const supabase = getSupabase();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { error: authError.message || "Invalid email or password." };
    }

    // Verify admin membership immediately so non-admins are rejected
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      await supabase.auth.signOut();
      return { error: "Login failed. Please try again." };
    }

    const { data: adminRow, error } = await supabase
      .from("admin_users")
      .select("id, email, full_name, role, is_active")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (error && isSchemaNotReady(error)) {
      // Schema not deployed yet — in dev-only unprotected mode accept the
      // login (panel is in unprotected mode anyway); in production refuse:
      // there is no admin table to verify membership against.
      if (isUnprotectedDevMode()) {
        setAdmin(FALLBACK_ADMIN);
        return {};
      }
      await supabase.auth.signOut();
      return {
        error:
          "Admin setup is incomplete — run the one-time database setup (/setup) and try again.",
      };
    }

    if (!adminRow) {
      // Not an admin — sign out immediately, don't leave a session dangling
      await supabase.auth.signOut();
      return { error: "This account does not have admin access." };
    }

    setAdmin({
      id: adminRow.id,
      email: adminRow.email,
      fullName: adminRow.full_name || email,
      role: adminRow.role,
      fallback: false,
    });

    // Copy the verified admin session into the httpOnly cookie so the
    // server proxy (src/proxy.ts) can gate /admin/*. Without it, the next
    // navigation is bounced back to /admin/login. A failed sync is reported
    // rather than silently leaving the user in a login loop.
    const synced = await syncAdminSession();
    if (!synced) {
      return {
        error:
          "Signed in, but the admin session could not be established. Please try again.",
      };
    }

    return {};
  }, []);

  const adminLogout = useCallback(async () => {
    await clearAdminSession();
    const supabase = getSupabase();
    await supabase.auth.signOut();
    localStorage.removeItem("rymos_user");
    localStorage.removeItem("rymos_customer_id");
    localStorage.removeItem("rymos_cart");
    setAdmin(null);
    router.push("/admin/login");
  }, [router]);

  return (
    <AdminAuthContext.Provider
      value={{ admin, loading, isAdmin: !!admin, adminLogin, adminLogout, refreshAdmin }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}
