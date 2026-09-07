"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";

interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  customerId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  loginWithOtp: (phone: string) => Promise<{ error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, fullName: string, phone: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "rymos_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setLoading(false);
      return;
    }

    const customerId = localStorage.getItem("rymos_customer_id") || null;
    const meta = session.user.user_metadata || {};

    const authUser: AuthUser = {
      id: session.user.id,
      email: session.user.email || null,
      phone: session.user.phone || null,
      fullName: meta.full_name || meta.name || "User",
      customerId,
    };

    setUser(authUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
    setLoading(false);
  }, []);

  useEffect(() => {
    // Try to restore from localStorage first
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    refreshUser();
  }, [refreshUser]);

  const loginWithOtp = useCallback(async (phone: string) => {
    if (!isConfigured()) {
      return { error: "Authentication is not configured." };
    }

    const supabase = getSupabase();
    const formattedPhone = phone.startsWith("+") ? phone : `+880${phone.replace(/^0/, "")}`;
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (otpError) {
      return { error: otpError.message || "Failed to send OTP." };
    }

    return {};
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    if (!isConfigured()) {
      return { error: "Authentication is not configured." };
    }

    const supabase = getSupabase();
    const formattedPhone = phone.startsWith("+") ? phone : `+880${phone.replace(/^0/, "")}`;
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });

    if (verifyError) {
      return { error: verifyError.message || "Invalid OTP." };
    }

    await refreshUser();
    return {};
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
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

    await refreshUser();
    return {};
  }, [refreshUser]);

  const register = useCallback(
    async (email: string, password: string, fullName: string, phone: string) => {
      if (!isConfigured()) {
        return { error: "Authentication is not configured." };
      }

      const supabase = getSupabase();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.replace(/\s/g, ""),
          },
        },
      });

      if (authError) {
        return { error: authError.message || "Registration failed." };
      }

      await refreshUser();
      return {};
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem("rymos_customer_id");
    setUser(null);
  }, []);

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, loading, login, loginWithOtp, verifyOtp, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
