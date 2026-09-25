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
 *  columns, 42501 = grants not applied. In all these cases the panel falls
 *  back to unprotected mode until the sync SQL runs. */
function isSchemaNotReady(err: { code?: string } | null | undefined): boolean {
  if (!err?.code) return false;
  return ["PGRST205", "42P01", "42703", "PGRST204", "42501"].includes(err.code);
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshAdmin = useCallback(async () => {
    if (!isConfigured()) {
      // No Supabase at all (e.g. local dev without env) — keep the panel
      // usable rather than hard-locking the shop owner out.
      setAdmin(FALLBACK_ADMIN);
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
      setAdmin(FALLBACK_ADMIN);
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
  }, []);

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
      // Schema not deployed yet — accept the login (panel is in unprotected
      // mode anyway) so the login page still works during setup.
      setAdmin(FALLBACK_ADMIN);
      return {};
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

    return {};
  }, []);

  const adminLogout = useCallback(async () => {
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
