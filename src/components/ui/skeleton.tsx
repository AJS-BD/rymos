"use client";

import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Shimmer keyframes (globals.css already defines @keyframes shimmer) */
/* ------------------------------------------------------------------ */

const shimmerStyle = {
  background:
    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.8s infinite linear",
};

/* ------------------------------------------------------------------ */
/*  ImageSkeleton                                                      */
/* ------------------------------------------------------------------ */

interface ImageSkeletonProps {
  className?: string;
  rounded?: "none" | "lg" | "xl" | "2xl" | "full";
}

export function ImageSkeleton({
  className = "",
  rounded = "xl",
}: ImageSkeletonProps) {
  const roundedClass = rounded === "none" ? "" : `rounded-${rounded}`;
  return (
    <div
      className={`relative overflow-hidden bg-[var(--color-bg-alt)] aspect-square ${roundedClass} ${className}`}
      aria-busy="true"
      aria-label="Loading image"
    >
      <div className="absolute inset-0" style={shimmerStyle} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProductCardSkeleton                                                */
/* ------------------------------------------------------------------ */

export function ProductCardSkeleton() {
  return (
    <div
      className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden"
      aria-busy="true"
      aria-label="Loading product"
    >
      {/* Image area — matches ProductCard aspect-square */}
      <ImageSkeleton rounded="none" className="rounded-t-none" />

      {/* Content area — matches ProductCard p-4 */}
      <div className="p-4 space-y-3">
        {/* Title line */}
        <div className="h-4 w-3/4 rounded bg-[var(--color-bg-alt)] overflow-hidden relative">
          <div className="absolute inset-0" style={shimmerStyle} />
        </div>

        {/* Specs line */}
        <div className="h-3 w-1/2 rounded bg-[var(--color-bg-alt)] overflow-hidden relative">
          <div className="absolute inset-0" style={shimmerStyle} />
        </div>

        {/* Price line */}
        <div className="h-4 w-1/3 rounded bg-[var(--color-bg-alt)] overflow-hidden relative">
          <div className="absolute inset-0" style={shimmerStyle} />
        </div>

        {/* Add to Cart button */}
        <div
          className="h-9 w-full rounded-lg bg-[var(--color-bg-alt)] overflow-hidden relative"
          style={{ minHeight: 36 }}
        >
          <div className="absolute inset-0" style={shimmerStyle} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProductCardSkeletonGrid — convenience wrapper for grids            */
/* ------------------------------------------------------------------ */

interface SkeletonGridProps {
  count?: number;
  className?: string;
}

export function ProductCardSkeletonGrid({
  count = 8,
  className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6",
}: SkeletonGridProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionSkeleton                                                    */
/* ------------------------------------------------------------------ */

interface SectionSkeletonProps {
  lines?: number;
  className?: string;
}

export function SectionSkeleton({
  lines = 3,
  className = "",
}: SectionSkeletonProps) {
  return (
    <div
      className={`space-y-4 ${className}`}
      aria-busy="true"
      aria-label="Loading section"
    >
      {/* Title placeholder */}
      <div className="h-8 sm:h-10 w-2/3 max-w-md rounded bg-[var(--color-bg-alt)] overflow-hidden relative">
        <div className="absolute inset-0" style={shimmerStyle} />
      </div>

      {/* Body lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-[var(--color-bg-alt)] overflow-hidden relative"
          style={{ width: `${85 - i * 10}%` }}
        >
          <div className="absolute inset-0" style={shimmerStyle} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProductDetailSkeleton — full-page skeleton for product detail      */
/* ------------------------------------------------------------------ */

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading product details">
      {/* Hero skeleton */}
      <div className="relative w-full h-[70vh] sm:h-[85vh] overflow-hidden bg-[var(--color-bg-alt)]">
        <div className="absolute inset-0" style={shimmerStyle} />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-16">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="h-4 w-24 mx-auto rounded bg-white/30 overflow-hidden relative">
              <div className="absolute inset-0" style={shimmerStyle} />
            </div>
            <div className="h-12 sm:h-16 w-3/4 mx-auto rounded bg-white/30 overflow-hidden relative">
              <div className="absolute inset-0" style={shimmerStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Info section */}
      <section className="py-20 sm:py-32 px-6 sm:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="h-6 w-full max-w-2xl mx-auto rounded bg-[var(--color-bg-alt)] overflow-hidden relative">
            <div className="absolute inset-0" style={shimmerStyle} />
          </div>
          <div className="h-6 w-2/3 max-w-lg mx-auto rounded bg-[var(--color-bg-alt)] overflow-hidden relative">
            <div className="absolute inset-0" style={shimmerStyle} />
          </div>
          <div className="h-10 w-40 mx-auto rounded bg-[var(--color-bg-alt)] overflow-hidden relative mt-10">
            <div className="absolute inset-0" style={shimmerStyle} />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stagger wrapper for animating children entrance                    */
/* ------------------------------------------------------------------ */

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}

export function Stagger({
  children,
  className = "",
  delay = 0,
  stagger: staggerDelay = 0.06,
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: delay,
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  StaggerItem — child of Stagger                                     */
/* ------------------------------------------------------------------ */

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
