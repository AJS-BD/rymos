"use client";

import { useState } from "react";
import Link from "next/link";

type Phase = "idle" | "working" | "done" | "error";

interface SetupResult {
  success: boolean;
  tablesFound: number;
  missing: string[];
  adminCount: number;
  setupCode: string | null;
  codeError: string | null;
}

export default function SetupContent() {
  const [token, setToken] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [result, setResult] = useState<SetupResult | null>(null);

  async function handleApply() {
    if (!token.trim()) {
      setError("Paste your Supabase access token first.");
      return;
    }
    setPhase("working");
    setError(null);
    setDetail(null);
    setResult(null);
    try {
      const res = await fetch("/api/setup/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhase("error");
        setError(data?.error ?? `Request failed (HTTP ${res.status}).`);
        if (data?.detail) setDetail(data.detail);
        return;
      }
      setResult(data as SetupResult);
      setPhase("done");
    } catch {
      setPhase("error");
      setError("Network error — check your connection and try again.");
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)] flex flex-col">
      <div className="w-full max-w-xl mx-auto px-5 pt-14 pb-16 flex-1">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Back to store
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          One-time Setup
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          This sets up the missing database tables (POS checkout, coupons,
          wishlist, reviews, credit, contact form, admin login) and creates your
          first admin account. It takes about a minute and only needs to be done
          once.
        </p>

        <ol className="mt-6 space-y-3 text-[15px] text-gray-700">
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-900 text-white text-[13px] font-semibold flex items-center justify-center">1</span>
            <span>
              Open{" "}
              <a
                href="https://supabase.com/dashboard/account/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline underline-offset-2"
              >
                supabase.com/dashboard/account/tokens
              </a>{" "}
              and tap <strong>Generate new token</strong>. Give it any name.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-900 text-white text-[13px] font-semibold flex items-center justify-center">2</span>
            <span>Copy the token and paste it below, then tap <strong>Set up database</strong>.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-900 text-white text-[13px] font-semibold flex items-center justify-center">3</span>
            <span>Your setup code appears on this page — use it on the admin login screen to create your admin account.</span>
          </li>
        </ol>

        <div className="mt-8">
          <label htmlFor="token" className="block text-[13px] font-medium text-gray-700 mb-2">
            Supabase access token
          </label>
          <textarea
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={3}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="sbp_… (paste the whole token)"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[14px] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <p className="mt-2 text-[12px] text-gray-500">
            The token is used only for this one request and never stored.
          </p>
        </div>

        <button
          onClick={handleApply}
          disabled={phase === "working"}
          className="mt-5 w-full h-12 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] text-[15px] font-medium disabled:opacity-50 active:scale-[0.99] transition-transform"
        >
          {phase === "working" ? "Setting up database…" : "Set up database"}
        </button>

        {phase === "error" && (
          <div className="mt-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[14px] text-red-800">
            <p className="font-medium">Setup failed</p>
            <p className="mt-1">{error}</p>
            {detail && (
              <p className="mt-2 text-[12px] font-mono break-all text-red-600">{detail}</p>
            )}
          </div>
        )}

        {phase === "done" && result && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-[14px] text-green-900">
              <p className="font-medium">Database setup complete</p>
              <p className="mt-1">
                {result.missing.length === 0
                  ? `All expected tables are present (${result.tablesFound} tables total).`
                  : `${result.tablesFound} tables found, but still missing: ${result.missing.join(", ")}.`}
              </p>
            </div>

            {result.setupCode && (
              <div className="rounded-xl bg-gray-900 text-white px-5 py-5">
                <p className="text-[13px] text-gray-300">Your first-admin setup code</p>
                <p className="mt-2 text-3xl font-mono font-semibold tracking-widest">
                  {result.setupCode}
                </p>
                <p className="mt-3 text-[13px] text-gray-300 leading-relaxed">
                  Open{" "}
                  <Link href="/admin/login" className="underline underline-offset-2">
                    /admin/login
                  </Link>{" "}
                  → tap <strong>First-time setup</strong> → enter your email, a
                  password, and this code. Single-use; only works while no admin
                  exists.
                </p>
              </div>
            )}

            {result.codeError && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[14px] text-amber-800">
                {result.codeError}
              </div>
            )}

            {result.adminCount > 0 && (
              <p className="text-[14px] text-gray-600">
                An admin account already exists — no setup code needed. Sign in
                at{" "}
                <Link href="/admin/login" className="text-blue-600 underline underline-offset-2">
                  /admin/login
                </Link>
                .
              </p>
            )}

            <Link
              href="/admin/login"
              className="inline-flex items-center h-11 px-6 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] text-[15px] font-medium active:scale-[0.99] transition-transform"
            >
              Go to admin login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
