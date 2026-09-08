"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FeaturedShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Spring-based parallax transforms
  const imageY = useSpring(
    useTransform(scrollYProgress, [0, 1], [80, -80]),
    { damping: 25, stiffness: 80 }
  );
  const textY = useSpring(
    useTransform(scrollYProgress, [0, 1], [50, -50]),
    { damping: 25, stiffness: 80 }
  );
  const textOpacity = useSpring(
    useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0.8]),
    { damping: 25, stiffness: 80 }
  );
  const scale = useSpring(
    useTransform(scrollYProgress, [0, 0.5], [0.92, 1]),
    { damping: 25, stiffness: 80 }
  );
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [-6, 0]);

  // Background parallax
  const bgY = useSpring(
    useTransform(scrollYProgress, [0, 1], [40, -40]),
    { damping: 25, stiffness: 60 }
  );

  return (
    <section
      ref={sectionRef}
      className="relative py-12 sm:py-16 lg:py-20 bg-[var(--color-dark-banner)] text-white overflow-hidden"
    >
      {/* Parallax background gradient */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/[0.03] to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-gradient-to-tr from-[var(--color-primary)]/[0.05] to-transparent" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          {/* Text content - 40% */}
          <motion.div
            style={{
              y: prefersReducedMotion ? 0 : textY,
              opacity: textOpacity,
              rotateX: prefersReducedMotion ? 0 : rotateX,
              transformPerspective: 1200,
              transformStyle: "preserve-3d",
            }}
            className="lg:col-span-2 order-2 lg:order-1"
          >
            <motion.p
              initial={{ opacity: 0, y: 24, rotateX: -12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", damping: 22, stiffness: 100, mass: 0.8 }}
              style={{ transformPerspective: 1200 }}
              className="text-xs sm:text-sm font-medium text-[var(--color-primary)] uppercase tracking-wider mb-2 sm:mb-3"
            >
              Featured
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24, rotateX: -12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", damping: 22, stiffness: 100, mass: 0.8, delay: 0.1 }}
              style={{ transformPerspective: 1200 }}
              className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight leading-tight"
            >
              iPhone 16 Pro
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 24, rotateX: -12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", damping: 22, stiffness: 100, mass: 0.8, delay: 0.2 }}
              style={{ transformPerspective: 1200 }}
              className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-gray-400 max-w-md"
            >
              The most powerful iPhone ever. A18 Pro chip. 48MP Fusion camera. Titanium design.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24, rotateX: -12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", damping: 22, stiffness: 100, mass: 0.8, delay: 0.3 }}
              style={{ transformPerspective: 1200 }}
              className="mt-6 sm:mt-8"
            >
              <Link
                href="/products/iphone-16-pro"
                className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline text-sm sm:text-base font-normal group"
              >
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Image - 60% */}
          <motion.div
            style={{
              y: prefersReducedMotion ? 0 : imageY,
              scale,
              rotateX: prefersReducedMotion ? 0 : useTransform(scrollYProgress, [0, 0.5], [-4, 0]),
              transformPerspective: 1200,
              transformStyle: "preserve-3d",
            }}
            className="lg:col-span-3 order-1 lg:order-2"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotateX: -8 }}
              whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", damping: 20, stiffness: 80, mass: 1 }}
              style={{ transformPerspective: 1200 }}
              className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&q=80"
                alt="iPhone 16 Pro"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
