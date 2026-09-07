"use client";

import { ProductDetailSkeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <main className="flex-1">
      <ProductDetailSkeleton />
    </main>
  );
}
