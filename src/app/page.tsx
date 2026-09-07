"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import AnimatedSection from "@/components/ui/animated-section";
import ProductScroll from "@/components/home/product-scroll";
import FeaturedShowcase from "@/components/home/featured-showcase";
import TestimonialsScroll from "@/components/home/testimonials-scroll";

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  return (
    <main className="flex-1">
      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative h-[80vh] sm:h-[90vh] flex items-center justify-center bg-gradient-to-b from-[#f5f5f7] to-white overflow-hidden"
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-3xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-[var(--color-text)]"
          >
            Technology,<br />Made Yours
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-3 sm:mt-6 text-base sm:text-xl md:text-2xl font-normal text-[var(--color-text-muted)]"
          >
            Discover the latest smartphones and premium accessories.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6"
          >
            <a
              href="/products"
              className="w-full sm:w-auto px-6 py-3 text-[var(--color-primary)] border border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)] hover:text-white text-sm sm:text-base font-normal transition-colors text-center"
            >
              Shop Now →
            </a>
            <a
              href="/about"
              className="w-full sm:w-auto px-6 py-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm sm:text-base font-normal transition-colors text-center"
            >
              Learn More
            </a>
          </motion.div>
        </div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[400px] lg:w-[600px] h-[200px] sm:h-[300px] lg:h-[400px] opacity-30"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80)",
            backgroundSize: "contain",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
          }}
        />
      </motion.section>

      {/* Product Scroll */}
      <ProductScroll />

      {/* Featured Showcase */}
      <FeaturedShowcase />

      {/* Spec Highlights */}
      <AnimatedSection className="py-12 sm:py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--color-text)] text-center mb-8 sm:mb-12">
            Built for everything
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { title: "200MP Pro-grade Camera", img: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80" },
              { title: "5000mAh All-day Battery", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80" },
              { title: "120Hz Dynamic AMOLED", img: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80" },
              { title: "256GB Storage", img: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80" },
            ].map((spec, index) => (
              <motion.div
                key={spec.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative aspect-[16/10] sm:aspect-video bg-[var(--color-bg-alt)] rounded-xl sm:rounded-2xl overflow-hidden group"
              >
                <img
                  src={spec.img}
                  alt={spec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 right-3 sm:right-4">
                  <p className="text-white text-xs sm:text-base lg:text-lg font-medium leading-tight">{spec.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Testimonials Scroll */}
      <TestimonialsScroll />

      {/* App Download CTA */}
      <AnimatedSection className="py-12 sm:py-20 lg:py-32 bg-[var(--color-dark-banner)] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight mb-3 sm:mb-4">
            Your Store. In Your Pocket.
          </h2>
          <p className="text-sm sm:text-lg lg:text-xl text-gray-400 mb-6 sm:mb-8">
            Shop anywhere, anytime with the RYmos mobile app.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <a
              href="#"
              className="w-full sm:w-auto px-6 py-3 text-[var(--color-primary)] border border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)] hover:text-white text-sm sm:text-base font-normal transition-colors text-center min-h-[44px] flex items-center justify-center"
            >
              Download for iOS →
            </a>
            <a
              href="#"
              className="w-full sm:w-auto px-6 py-3 text-[var(--color-primary)] border border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)] hover:text-white text-sm sm:text-base font-normal transition-colors text-center min-h-[44px] flex items-center justify-center"
            >
              Download for Android →
            </a>
          </div>
        </div>
      </AnimatedSection>
    </main>
  );
}
