"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const heroSlides = [
  {
    headline: "Technology, Made Yours",
    subheadline: "Discover the latest smartphones and premium accessories, chosen for you.",
    cta1: "Shop Smartphones",
    cta2: "Explore Accessories",
    badges: ["120Hz Display", "A17 Pro Chip", "48MP Camera"],
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=80",
  },
  {
    headline: "iPhone 15 Pro Max",
    subheadline: "The most powerful iPhone ever. Titanium. A17 Pro chip. 48MP camera.",
    cta1: "Buy Now",
    cta2: "Learn More",
    badges: ["Titanium Design", "A17 Pro Chip", "USB-C"],
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=80",
  },
  {
    headline: "Samsung Galaxy S24 Ultra",
    subheadline: "The ultimate smartphone experience. 200MP camera. Built-in S Pen.",
    cta1: "Shop Now",
    cta2: "Compare",
    badges: ["200MP Camera", "S Pen Built-in", "5000mAh Battery"],
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=1200&q=80",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[current];

  return (
    <section className="relative overflow-hidden min-h-[600px]">
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left text-white"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                {slide.headline}
              </h1>
              <p className="mt-6 text-lg text-gray-300 max-w-lg">
                {slide.subheadline}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/products?category=smartphones"
                  className="inline-flex items-center justify-center px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  {slide.cta1}
                </Link>
                <Link
                  href="/products?category=accessories"
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-black transition-colors"
                >
                  {slide.cta2}
                </Link>
              </div>

              {/* Floating Specs */}
              <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
                {slide.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/30"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Right side - empty for background image focus */}
          <div className="hidden lg:block" />
        </div>
      </div>

      {/* Carousel Controls */}
      <button
        onClick={() => setCurrent((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={() => setCurrent((prev) => (prev + 1) % heroSlides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === current ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
