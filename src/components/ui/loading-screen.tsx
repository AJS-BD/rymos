"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const pathname = usePathname();
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Disable loading screen on admin pages
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return null;

  useEffect(() => {
    // Clear any pending timers
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    setFading(false);
    setVisible(false);

    // Only show loading screen if the page doesn't render within 400ms
    showTimeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, 400);

    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [pathname]);

  // Auto-hide loading screen after 1.2s max
  useEffect(() => {
    if (visible && !fading) {
      hideTimeoutRef.current = setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setVisible(false);
          setFading(false);
        }, 400);
      }, 1200);
      return () => {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
      };
    }
  }, [visible, fading]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-[#000000] flex items-center justify-center"
      style={{ pointerEvents: fading ? "none" : "auto" }}
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
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
