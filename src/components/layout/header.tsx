"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Accessories", href: "/products?category=accessories" },
  { label: "Deals", href: "/products?deals=true" },
  { label: "About", href: "/about" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { scrollY } = useScroll();
  const headerBg = useTransform(
    scrollY,
    [0, 80],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.72)"]
  );
  const headerBlur = useTransform(scrollY, [0, 80], [0, 24]);
  const headerBorder = useTransform(
    scrollY,
    [0, 80],
    ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.08)"]
  );

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: headerBg,
          backdropFilter: useTransform(headerBlur, (v) => `blur(${v}px)`),
          WebkitBackdropFilter: useTransform(headerBlur, (v) => `blur(${v}px)`),
          borderBottom: useTransform(
            headerBorder,
            (v) => `1px solid ${v}`
          ),
        }}
      >
        <div className="max-w-[1024px] mx-auto px-5 sm:px-6">
          <div className="flex items-center h-11 sm:h-12">
            {/* Logo - Left */}
            <div className="flex-1 flex items-center">
              <Link
                href="/"
                className="text-[var(--color-text)] tracking-tight"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <span className="text-base sm:text-lg font-normal">
                  RYmos
                </span>
              </Link>
            </div>

            {/* Navigation - Centered */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-xs font-light text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors duration-200"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side - Search */}
            <div className="flex-1 flex items-center justify-end gap-4">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors duration-200"
                aria-label="Search"
              >
                <Search className="h-4 w-4" strokeWidth={1.5} />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors duration-200"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Menu className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="pb-3">
                <input
                  type="text"
                  placeholder="Search rymos.com"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-[var(--color-bg-alt)] rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  style={{ fontFamily: "var(--font-sans)" }}
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Mobile Fullscreen Overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
            {navLinks.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.1, duration: 0.3 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-light text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors duration-200"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}
