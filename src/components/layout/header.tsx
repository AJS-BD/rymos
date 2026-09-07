"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import CartDrawer from "@/components/cart/cart-drawer";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[var(--color-border)]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-lg sm:text-xl font-semibold text-[var(--color-text)] tracking-tight">
              RYmos
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {[
              { label: "Products", href: "/products" },
              { label: "Accessories", href: "/products?category=accessories" },
              { label: "Deals", href: "/products?deals=true" },
              { label: "About", href: "/about" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs font-normal text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Cart */}
            <CartDrawer />

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="pb-3">
            <input
              type="text"
              placeholder="Search rymos.com"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-[var(--color-bg-alt)] rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-h-[44px]"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-white/95 backdrop-blur-xl">
          <nav className="px-4 py-6 space-y-4">
            {[
              { label: "Products", href: "/products" },
              { label: "Accessories", href: "/products?category=accessories" },
              { label: "Deals", href: "/products?deals=true" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "FAQ", href: "/faq" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
