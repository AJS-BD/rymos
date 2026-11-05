"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Mail, Phone, Eye, EyeOff, ArrowRight } from "lucide-react";

// Phone OTP is NOT available: no SMS provider is configured for this
// Supabase project (see docs/PHONE-OTP-SETUP.md). Supabase phone auth
// cannot send an SMS without a provider configured in the Supabase
// dashboard, so the Phone OTP tab is disabled and no signInWithOtp call
// is made anywhere in the sign-in flow.
export const PHONE_OTP_UNAVAILABLE_MESSAGE =
  "Phone sign-in is not available yet — please sign in with email. The shop needs to connect an SMS provider in Supabase.";

type LoginMethod = "email" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [method, setMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!isConfigured()) {
      setError("Authentication is not configured. Please contact support.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Invalid email or password.");
        return;
      }

      if (data?.user?.id) {
        localStorage.setItem("rymos_customer_id", data.user.id);
      }

      await refreshUser();
      setSuccess("Login successful! Redirecting to your profile...");
      router.push("/customer/profile");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 pt-16 sm:pt-20">
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text)]">Welcome Back</h1>
            <p className="text-[var(--color-text-muted)] mt-2">
              Sign in to your RYmos account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="flex bg-[var(--color-bg-alt)] rounded-lg p-1 mb-6">
            <button
              onClick={() => {
                setMethod("email");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                method === "email"
                  ? "bg-white text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              disabled
              aria-disabled="true"
              title={PHONE_OTP_UNAVAILABLE_MESSAGE}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
            >
              <Phone className="w-4 h-4" />
              Phone OTP
            </button>
          </div>

          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            {PHONE_OTP_UNAVAILABLE_MESSAGE}
          </div>

          {method === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-[var(--color-primary)] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-4 pr-10 py-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {method === "phone" && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              {PHONE_OTP_UNAVAILABLE_MESSAGE}
            </div>
          )}

          <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
