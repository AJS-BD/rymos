"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-md">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[120px] sm:text-[150px] font-bold text-gray-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-3">
          Page Not Found
        </h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been
          moved. Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[var(--color-border)] text-[var(--color-text)] rounded-lg font-medium hover:bg-[var(--color-bg-alt)] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Products
          </Link>
        </div>

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        {/* Helpful Links */}
        <div className="mt-10 pt-8 border-t border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Looking for something else?
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/track-order"
              className="text-[var(--color-primary)] hover:underline"
            >
              Track Order
            </Link>
            <Link
              href="/auth/login"
              className="text-[var(--color-primary)] hover:underline"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="text-[var(--color-primary)] hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
