"use client";

import { useState, useEffect } from "react";

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  // Only show on initial page load, not on client-side route changes
  useEffect(() => {
    // Hide loader after initial page render
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#000000] flex items-center justify-center"
      style={{
        opacity: loading ? 1 : 0,
        pointerEvents: loading ? "auto" : "none",
      }}
    >
      <div className="text-center">
        <div className="mb-8">
          <span className="text-4xl font-semibold text-white tracking-tight">
            RYmos
          </span>
        </div>

        <div className="h-[2px] bg-white/10 rounded-full overflow-hidden mx-auto w-[200px]">
          <div className="h-full bg-white rounded-full animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
}
