"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

// Reset-password page — this page was missing, which broke the whole
// forgot-password flow:
//   1. /auth/forgot-password sends resetPasswordForEmail with
//      redirectTo = <origin>/auth/reset-password
//   2. Supabase emails a recovery link to that URL with
//      #access_token=...&type=recovery in the hash
//   3. supabase-js auto-detects the hash on page load and creates a
//      (recovery) session — so the user looked "logged in" —
//   4. but with no /auth/reset-password route, Next.js served the 404
//      page, so there was never anywhere to enter a new password and
//      the old password was never actually changed.
//
// This page completes the flow: it waits for the recovery session, then
// lets the user set a new password with supabase.auth.updateUser().
export default function ResetPasswordPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [checking, setChecking] = useState(() => isConfigured());
  const [linkValid, setLinkValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isConfigured()) {
      return;
    }

    const supabase = getSupabase();
    let settled = false;

    // supabase-js parses the recovery hash (#access_token=...&type=recovery)
    // when the client is created, so getSession() should return the
    // recovery session. Also listen for the PASSWORD_RECOVERY event in
    // case the session lands a moment later.
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (settled) return;
      if (session?.user) {
        settled = true;
        setLinkValid(true);
        setChecking(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (settled) return;
      if (
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") &&
        session?.user
      ) {
        settled = true;
        setLinkValid(true);
        setChecking(false);
      }
    });

    void checkSession();

    // If no recovery session has arrived after a short wait, the link
    // is missing, already used, or expired — the user needs a fresh one.
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setLinkValid(false);
        setChecking(false);
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in both fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isConfigured()) {
      setError("Password reset is not configured. Please contact support.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(
          updateError.message || "Failed to reset password. Please try again."
        );
        return;
      }

      await refreshUser();
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = async () => {
    // Sign out the recovery session so the user proves the new password
    // by signing in with it.
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (checking) {
    return (
      <main className="flex-1">
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <span className="inline-block w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-[var(--color-text-muted)] mt-4">
              Verifying your reset link…
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!linkValid) {
    return (
      <main className="flex-1">
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              Reset Link Invalid or Expired
            </h1>
            <p className="text-[var(--color-text-muted)] mb-6">
              This password reset link is missing, has already been used, or
              has expired. Reset links only work once — please request a new
              one.
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Request a New Reset Link
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mt-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex-1">
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              Password Reset
            </h1>
            <p className="text-[var(--color-text-muted)] mb-6">
              Your password has been changed. Please sign in with your new
              password.
            </p>
            <button
              onClick={handleGoToLogin}
              className="w-full py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors flex items-center justify-center gap-2"
            >
              Sign In With New Password
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text)]">
              Set a New Password
            </h1>
            <p className="text-[var(--color-text-muted)] mt-2">
              Enter a new password for your RYmos account.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
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

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full pl-10 pr-10 py-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
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
                  Reset Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
