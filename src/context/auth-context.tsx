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
  updateUserProfile: (fullName: string, phone: string, address: string) => Promise<{ error?: string }>;
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
      localStorage.removeItem("rymos_customer_id");
      setUser(null);
      setLoading(false);
      return;
    }

    // Look up or create customer in customers table
    const email = session.user.email || null;
    const phone = session.user.phone || null;
    const meta = session.user.user_metadata || {};
    const fullName = meta.full_name || meta.name || "User";

    let customerId = localStorage.getItem("rymos_customer_id");

    if (customerId) {
      // Validate existing customer ID
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("id", customerId)
        .maybeSingle();

      if (!existingCustomer) {
        customerId = null; // Invalid ID, clear it
      }
    }

    if (!customerId) {
      // Try to find existing customer by phone
      let { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
          .from("customers")
          .insert({
            username: phone || `user_${session.user.id.slice(0, 8)}`,
            full_name: fullName,
            phone: phone || "",
            address: "",
            customer_type: "online",
            created_via: "online_signup",
          })
          .select("id")
          .single();

        if (!createError && newCustomer) {
          customerId = newCustomer.id;
        }
      }

      if (customerId) {
        localStorage.setItem("rymos_customer_id", customerId);
      }
    }

    const authUser: AuthUser = {
      id: session.user.id,
      email,
      phone,
      fullName,
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
    localStorage.removeItem("rymos_cart");
    setUser(null);
  }, []);

  const updateUserProfile = useCallback(async (fullName: string, phone: string, address: string) => {
    if (!isConfigured() || !user?.customerId) {
      return { error: "Not configured or no customer record." };
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("customers")
      .update({ full_name: fullName, phone: phone, address: address })
      .eq("id", user.customerId);

    if (error) {
      return { error: error.message || "Failed to update profile." };
    }

    // Update local user state immediately
    const updatedUser: AuthUser = {
      ...user,
      fullName,
      phone,
    };
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

    return {};
  }, [user]);

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, loading, login, loginWithOtp, verifyOtp, register, logout, refreshUser, updateUserProfile }}
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
