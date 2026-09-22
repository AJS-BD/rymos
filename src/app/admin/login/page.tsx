"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/context/admin-auth-context";
import { getSupabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupMode, setSetupMode] = useState(false);
  const [setupCode, setSetupCode] = useState("");
  const { adminLogin } = useAdminAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (setupMode && !setupCode.trim()) {
      setError("Please enter the setup code from the workflow run summary.");
      return;
    }

    setSubmitting(true);
    setError(null);

    if (setupMode) {
      const supabase = getSupabase();
      const trimmedEmail = email.trim();

      // Sign up (or sign in, if this email was already registered).
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        // "already registered" → fall through to sign-in with same password
        if (!signUpError.message.toLowerCase().includes("already")) {
          setError(signUpError.message || "Sign-up failed.");
          setSubmitting(false);
          return;
        }
      }

      // If email confirmation is ON and no session came back, stop here.
      if (!signUpError && !signUpData.session) {
        setError(
          "Check your inbox and confirm your email first, then come back and finish setup with the same code."
        );
        setSubmitting(false);
        return;
      }

      // Ensure we have a session (covers the already-registered path).
      const { data: sessData, error: sessError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (sessError || !sessData.session) {
        setError("Signed up, but could not start a session. Try signing in normally.");
        setSubmitting(false);
        return;
      }

      // Promote via RPC.
      const { error: rpcError } = await supabase.rpc("promote_first_admin", {
        p_code: setupCode.trim(),
      });

      if (rpcError) {
        setError(rpcError.message || "Setup failed — check the code and try again.");
        setSubmitting(false);
        return;
      }

      router.push("/admin/dashboard");
      return;
    }

    const result = await adminLogin(email.trim(), password);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">RYmos</h1>
            <p className="text-gray-500">
              {setupMode ? "First-time Admin Setup" : "Admin Panel Login"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
                placeholder="admin@rymos.com"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={setupMode ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-gray-500 hover:text-gray-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {setupMode && (
              <div>
                <label htmlFor="admin-setup-code" className="block text-sm font-medium text-gray-700 mb-1">
                  Setup code
                </label>
                <input
                  id="admin-setup-code"
                  type="text"
                  required
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value.toUpperCase())}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                />
                <p className="text-xs text-gray-400 mt-1">
                  From the &quot;Apply Supabase Sync SQL&quot; workflow run summary (Actions tab).
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {submitting
                ? setupMode
                  ? "Setting up…"
                  : "Signing in…"
                : setupMode
                  ? "Create Admin"
                  : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setSetupMode((s) => !s);
                setError(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2"
            >
              {setupMode ? "Back to sign in" : "First-time setup"}
            </button>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
