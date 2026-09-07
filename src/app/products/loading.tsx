"use client";

import { ProductCardSkeletonGrid } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <main className="flex-1">
      {/* Hero skeleton */}
      <section className="py-20 sm:py-32 bg-[var(--color-bg-alt)] text-center">
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          <div className="h-10 sm:h-14 w-64 mx-auto rounded bg-gray-200 overflow-hidden relative">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.8s infinite linear",
              }}
            />
          </div>
          <div className="h-6 w-80 mx-auto rounded bg-gray-200 overflow-hidden relative">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.8s infinite linear",
              }}
            />
          </div>
        </div>
      </section>

      {/* Grid skeleton */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <ProductCardSkeletonGrid count={8} />
        </div>
      </section>
    </main>
  );
}
