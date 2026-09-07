"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  PanInfo,
} from "framer-motion";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

interface AnimatedSidebarProps {
  links?: NavLink[];
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

const STAGGER_DELAY = 0.05;

const DEFAULT_LINKS: NavLink[] = [
  { label: "Products", href: "/products" },
  { label: "Accessories", href: "/accessories" },
  { label: "Deals", href: "/deals", badge: "Hot" },
  { label: "Support", href: "/support" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// ─── Haptic Feedback Helper ──────────────────────────────────────────────────

const triggerHaptic = (type: "light" | "medium" = "light") => {
  if (typeof window === "undefined") return;
  
  // Check if Vibration API is available
  if ("vibrate" in navigator) {
    navigator.vibrate(type === "light" ? 10 : 25);
  }
  
  // For iOS Safari (no vibrate API), we can use a subtle audio feedback
  // or simply skip silently
};

// ─── Animated Sidebar Component ──────────────────────────────────────────────

export default function AnimatedSidebar({
  links = DEFAULT_LINKS,
  className = "",
}: AnimatedSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Close sidebar
  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    triggerHaptic("light");
  }, []);

  // Open sidebar
  const openSidebar = useCallback(() => {
    setIsOpen(true);
    triggerHaptic("light");
  }, []);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }, [isOpen, closeSidebar, openSidebar]);

  // Handle swipe-to-close gesture
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const threshold = 100;
      const velocity = info.velocity.x;
      const offset = info.offset.x;

      // Close if swiped left with enough velocity or distance
      if (offset < -threshold || velocity < -500) {
        closeSidebar();
      } else {
        // Snap back open
        controls.start({ x: 0, transition: SPRING_CONFIG });
      }
    },
    [closeSidebar, controls]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle link click with haptic feedback
  const handleLinkClick = useCallback(() => {
    triggerHaptic("medium");
    closeSidebar();
  }, [closeSidebar]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeSidebar]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={toggleSidebar}
        className={`md:hidden p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors ${className}`}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: "100%" }}
            animate={controls}
            exit={{ x: "100%" }}
            transition={SPRING_CONFIG}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className="fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl md:hidden overflow-y-auto"
            style={{ touchAction: "pan-y" }}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]/50">
              <span className="text-lg font-semibold text-[var(--color-text)] tracking-tight">
                RYmos
              </span>
              <button
                onClick={closeSidebar}
                className="p-2 -mr-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="px-4 py-6">
              <motion.ul
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: STAGGER_DELAY,
                    },
                  },
                }}
                className="space-y-1"
              >
                {links.map((link, index) => (
                  <motion.li
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, x: 20 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: SPRING_CONFIG,
                      },
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={handleLinkClick}
                      className="group flex items-center justify-between px-4 py-3 rounded-xl text-[var(--color-text)] hover:bg-[var(--color-bg-alt)] transition-colors"
                    >
                      <span className="text-base font-medium">{link.label}</span>
                      <div className="flex items-center gap-2">
                        {link.badge && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white bg-[var(--color-primary)] rounded-full">
                            {link.badge}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            </nav>

            {/* Sidebar Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_CONFIG, delay: links.length * STAGGER_DELAY + 0.1 }}
              className="px-6 py-4 border-t border-[var(--color-border)]/50 mt-auto"
            >
              <Link
                href="/auth/login"
                onClick={handleLinkClick}
                className="block w-full py-3 text-center text-sm font-medium text-white bg-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Sign In
              </Link>
              <p className="mt-3 text-xs text-center text-[var(--color-text-muted)]">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/register"
                  onClick={handleLinkClick}
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </motion.div>

            {/* Swipe Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Mobile Menu Button (Standalone) ─────────────────────────────────────────

interface MobileMenuButtonProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}

export function MobileMenuButton({
  onClick,
  isOpen,
  className = "",
}: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`md:hidden p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors ${className}`}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Menu className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Animated Nav Link ───────────────────────────────────────────────────────

interface AnimatedNavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AnimatedNavLink({
  href,
  children,
  className = "",
  onClick,
}: AnimatedNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={() => {
        triggerHaptic("light");
        onClick?.();
      }}
      className={`relative group ${className}`}
    >
      <span className="relative inline-block">
        {children}
        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-current group-hover:w-full transition-all duration-300 ease-out" />
      </span>
    </Link>
  );
}
