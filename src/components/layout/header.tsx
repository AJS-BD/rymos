"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, User } from "lucide-react";
import { motion, useScroll, useMotionValueEvent, useTransform, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Deals", href: "/products?deals=true" },
  { label: "About", href: "/about" },
];

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const customerId = localStorage.getItem("rymos_customer_id");
    setIsLoggedIn(!!customerId);
  }, []);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest >= 50);
  });

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

  const textColor = scrolled ? "#111827" : "#ffffff";

  // Account items based on login status
  const accountItems = isLoggedIn
    ? [
        { label: "Profile", href: "/customer/profile" },
        { label: "Track Order", href: "/track-order" },
        { label: "Messages", href: "/customer/messages" },
        { label: "Sign Out", href: "/auth/login" },
      ]
    : [
        { label: "Sign In", href: "/auth/login" },
        { label: "Create Account", href: "/auth/register" },
      ];

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
                className="tracking-tight"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                <motion.span
                  className="text-base sm:text-lg font-normal"
                  animate={{ color: textColor }}
                  transition={{ duration: 0.3 }}
                >
                  RYmos
                </motion.span>
              </Link>
            </div>

            {/* Navigation - Centered */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((item) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(item.href);
                  }}
                  className="text-xs font-light cursor-pointer"
                  style={{ fontFamily: "var(--font-sans)" }}
                  animate={{ color: textColor }}
                  transition={{ duration: 0.3 }}
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>

            {/* Right side - Account, Search & Menu */}
            <div className="flex-1 flex items-center justify-end gap-4">
              {/* Account Dropdown */}
              <div className="relative">
                <motion.button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="cursor-pointer"
                  aria-label="Account"
                  animate={{ color: textColor }}
                  transition={{ duration: 0.3 }}
                >
                  <User className="h-4 w-4" strokeWidth={1.5} />
                </motion.button>

                <AnimatePresence>
                  {accountDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
                    >
                      {accountItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setAccountDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          style={{ fontFamily: "var(--font-sans)" }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search */}
              <motion.button
                onClick={() => setSearchOpen(!searchOpen)}
                className="cursor-pointer"
                aria-label="Search"
                animate={{ color: textColor }}
                transition={{ duration: 0.3 }}
              >
                <Search className="h-4 w-4" strokeWidth={1.5} />
              </motion.button>

              {/* Mobile Menu Toggle */}
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden cursor-pointer"
                aria-label="Menu"
                animate={{ color: textColor }}
                transition={{ duration: 0.3 }}
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Menu className="h-4 w-4" strokeWidth={1.5} />
                )}
              </motion.button>
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
            <div className="w-full border-t border-gray-200 pt-6">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-4 text-center">
                Account
              </p>
              {accountItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (navLinks.length + index) * 0.05 + 0.1, duration: 0.3 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center text-lg font-light text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors duration-200 py-2"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
