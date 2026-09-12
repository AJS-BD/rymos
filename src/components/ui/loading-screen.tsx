"use client";

import { useState, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function LoadingScreen() {
  const [opacity, setOpacity] = useState(0);
  const pathname = usePathname();
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return null;

  // Show loader IMMEDIATELY (synchronously) before browser paints new page
  useLayoutEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    // Instantly show loader (opacity 1, no transition)
    setOpacity(1);

    // After short delay, start fading out
    hideTimeoutRef.current = setTimeout(() => {
      setOpacity(0);
    }, 400);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [pathname]);

  // Initial page load
  useLayoutEffect(() => {
    setOpacity(1);
    const timer = setTimeout(() => {
      setOpacity(0);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#000000] flex items-center justify-center"
      style={{
        opacity: opacity,
        pointerEvents: opacity > 0 ? "auto" : "none",
        transition: opacity > 0 ? "none" : "opacity 300ms ease-in-out",
      }}
    >
      <div className="text-center">
        <div
          className="mb-8"
          style={{
            opacity: opacity,
            transform: opacity > 0.5 ? "scale(1)" : "scale(0.9)",
            transition: "all 400ms ease-out",
          }}
        >
          <span className="text-4xl font-semibold text-white tracking-tight">
            RYmos
          </span>
        </div>

        <div
          className="h-[2px] bg-white/10 rounded-full overflow-hidden mx-auto"
          style={{
            width: opacity > 0 ? 200 : 0,
            opacity: opacity,
            transition: "all 500ms ease-out",
          }}
        >
          <div
            className="h-full bg-white rounded-full"
            style={{
              width: opacity > 0.5 ? "100%" : "0%",
              transition: "width 500ms ease-in-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}
