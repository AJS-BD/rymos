"use client";

import { useState, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Disable loading screen on admin pages
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return null;

  // Show loader SYNCHRONOUSLY before browser paints (fires before useEffect)
  useLayoutEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    // Show loader immediately, before browser paints new page
    setVisible(true);

    // Hide after 350ms (page content is already rendered underneath)
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 350);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [pathname]);

  // Initial page load
  useLayoutEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-[#000000] flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mb-8"
            >
              <span className="text-4xl font-semibold text-white tracking-tight">
                RYmos
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 200 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="h-[2px] bg-white/10 rounded-full overflow-hidden mx-auto"
            >
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5, ease: "easeInOut", delay: 0.1 }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
