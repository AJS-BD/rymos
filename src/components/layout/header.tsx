"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Heart, User, Menu, X } from "lucide-react";
import CartDrawer from "@/components/cart/cart-drawer";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">
              RYmos
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              Home
            </Link>
            <Link
              href="/products?category=smartphones"
              className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              Smartphones
            </Link>
            <Link
              href="/products?category=accessories"
              className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              Accessories
            </Link>
            <Link
              href="/products?deals=true"
              className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              Deals
            </Link>
            <Link
              href="/products?new-arrivals=true"
              className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              New Arrivals
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-md mx-8 hidden sm:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search phones, cases, chargers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              href="/customer/wishlist"
              className="hidden sm:block p-2 text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              <Heart className="h-5 w-5" />
            </Link>
            <Link
              href="/customer/profile"
              className="hidden sm:block p-2 text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              <User className="h-5 w-5" />
            </Link>
            <CartDrawer />
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[var(--color-text)] hover:text-[var(--color-primary)]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="sm:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search phones, cases, chargers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-white">
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              Home
            </Link>
            <Link
              href="/products?category=smartphones"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              Smartphones
            </Link>
            <Link
              href="/products?category=accessories"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              Accessories
            </Link>
            <Link
              href="/products?deals=true"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              Deals
            </Link>
            <Link
              href="/products?new-arrivals=true"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              New Arrivals
            </Link>
            <Link
              href="/customer/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              My Profile
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
