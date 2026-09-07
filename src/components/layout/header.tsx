"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Heart, User, ShoppingCart } from "lucide-react";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold text-[var(--color-primary)]">
              RYmos
            </span>
          </Link>

          {/* Navigation */}
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

          {/* Search Bar */}
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
          <div className="flex items-center space-x-4">
            <Link
              href="/customer/wishlist"
              className="p-2 text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              <Heart className="h-5 w-5" />
            </Link>
            <Link
              href="/customer/profile"
              className="p-2 text-[var(--color-text)] hover:text-[var(--color-primary)]"
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              href="/customer/cart"
              className="p-2 text-[var(--color-text)] hover:text-[var(--color-primary)] relative"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-[var(--color-accent)] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
