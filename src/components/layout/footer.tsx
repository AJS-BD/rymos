"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Don't render footer on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-[var(--color-bg-alt)] border-t border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand */}
          <div>
            <span className="text-xl font-semibold text-[var(--color-text)] tracking-tight">
              RYmos
            </span>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-xs">
              Technology, Made Yours. Discover the latest smartphones and premium accessories.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider mb-3">
                Shop
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/products" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=smartphones" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                    Smartphones
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=accessories" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                    Accessories
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider mb-3">
                Support
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                    Returns
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} RYmos. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
