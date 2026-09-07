"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AnimatedSection from "@/components/ui/animated-section";

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
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative h-[90vh] flex items-center justify-center bg-gradient-to-b from-[#f5f5f7] to-white overflow-hidden"
        >
          <div className="max-w-5xl mx-auto px-4 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight text-[var(--color-text)]"
            >
              Technology,<br />Made Yours
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-4 sm:mt-6 text-lg sm:text-xl md:text-2xl font-normal text-[var(--color-text-muted)]"
            >
              Discover the latest smartphones and premium accessories.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-8 flex items-center justify-center gap-6"
            >
              <a
                href="/products"
                className="text-[var(--color-primary)] hover:underline text-base sm:text-lg font-normal"
              >
                Shop Now →
              </a>
              <a
                href="/about"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-base sm:text-lg font-normal"
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
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-30"
            style={{
              backgroundImage: "url(https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80)",
              backgroundSize: "contain",
              backgroundPosition: "center bottom",
              backgroundRepeat: "no-repeat",
            }}
          />
        </motion.section>

        {/* Featured Product */}
        <AnimatedSection className="py-20 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <p className="text-sm font-medium text-[var(--color-primary)] uppercase tracking-wider mb-2">
                  New
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--color-text)] mb-4">
                  iPhone 15 Pro Max
                </h2>
                <p className="text-lg sm:text-xl text-[var(--color-text-muted)] mb-8 max-w-md">
                  Titanium. A17 Pro chip. 48MP camera. The most powerful iPhone ever.
                </p>
                <div className="flex items-center gap-6">
                  <a
                    href="/products/iphone-15-pro-max"
                    className="text-[var(--color-primary)] hover:underline text-base font-normal"
                  >
                    Learn More →
                  </a>
                  <a
                    href="/products"
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-base font-normal"
                  >
                    Buy
                  </a>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="aspect-square bg-[var(--color-bg-alt)] rounded-3xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80"
                    alt="iPhone 15 Pro Max"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Product Grid */}
        <AnimatedSection className="py-20 sm:py-32 bg-[var(--color-bg-alt)]">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-text)] text-center mb-12">
              Featured Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { name: "Samsung Galaxy S24 Ultra", price: "৳129,999", img: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80" },
                { name: "iPhone 15 Pro Max", price: "৳164,999", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80" },
                { name: "OnePlus 12", price: "৳79,999", img: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80" },
                { name: "Xiaomi 14 Ultra", price: "৳54,999", img: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80" },
              ].map((product, index) => (
                <motion.a
                  key={product.name}
                  href="/products"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-white rounded-2xl p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-[var(--color-bg-alt)] rounded-xl overflow-hidden mb-4">
                    <img
                      src={product.img}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {product.price}
                  </p>
                </motion.a>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Spec Highlights */}
        <AnimatedSection className="py-20 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-text)] text-center mb-12">
              Built for everything
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="relative aspect-video bg-[var(--color-bg-alt)] rounded-2xl overflow-hidden group"
                >
                  <img
                    src={spec.img}
                    alt={spec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute bottom-4 left-4">
                    <p className="text-white text-lg font-medium">{spec.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection className="py-20 sm:py-32 bg-[var(--color-dark-banner)] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Your Store. In Your Pocket.
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 mb-8">
              Shop anywhere, anytime with the RYmos mobile app.
            </p>
            <div className="flex items-center justify-center gap-6">
              <a
                href="#"
                className="text-[var(--color-primary)] hover:underline text-base font-normal"
              >
                Download for iOS →
              </a>
              <a
                href="#"
                className="text-[var(--color-primary)] hover:underline text-base font-normal"
              >
                Download for Android →
              </a>
            </div>
          </div>
        </AnimatedSection>
      </main>
      <Footer />
    </>
  );
}
