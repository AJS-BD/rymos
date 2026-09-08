"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "loading" | "fading" | "done";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [showLoader, setShowLoader] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  // Reset loading state on route change
  useEffect(() => {
    setShowLoader(true);
    setPhase("loading");
    setProgress(0);
  }, [pathname]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  // Loading phase: animate progress bar
  useEffect(() => {
    if (phase !== "loading") return;

    const duration = 1800;
    const intervalMs = 30;
    const steps = duration / intervalMs;
    let current = 0;

    intervalRef.current = setInterval(() => {
      current += 1;
      const eased = 1 - Math.pow(1 - current / steps, 3);
      setProgress(Math.min(eased * 100, 100));

      if (current >= steps) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        fadeTimeoutRef.current = setTimeout(() => {
          setPhase("fading");
        }, 200);
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase]);

  // After fade-out animation completes, remove from DOM
  useEffect(() => {
    if (phase === "fading") {
      const timer = setTimeout(() => setPhase("done"), 1000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Completely unmount when done
  if (phase === "done" || !showLoader) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "loading" ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-[#000000] flex items-center justify-center"
      style={{ pointerEvents: phase === "loading" ? "auto" : "none" }}
    >
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <span className="text-4xl font-semibold text-white tracking-tight">
            RYmos
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 200 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-[2px] bg-white/10 rounded-full overflow-hidden mx-auto"
        >
          <motion.div
            className="h-full bg-white rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
