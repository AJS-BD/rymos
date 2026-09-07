"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cpu, Camera, Battery, Smartphone } from "lucide-react";

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

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % heroSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = heroSlides[current];

  if (!isClient) return null;

  return (
    <section className="relative w-full h-[500px] sm:h-[600px] overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left text-white"
            >
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                {slide.headline}
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-300 max-w-lg">
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

              <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
                {slide.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/30 flex items-center gap-2"
                  >
                    {badge.includes("120Hz") && <Smartphone className="h-4 w-4" />}
                    {badge.includes("Chip") && <Cpu className="h-4 w-4" />}
                    {badge.includes("Camera") && <Camera className="h-4 w-4" />}
                    {badge.includes("Battery") && <Battery className="h-4 w-4" />}
                    {!badge.includes("120Hz") && !badge.includes("Chip") && !badge.includes("Camera") && !badge.includes("Battery") && <Smartphone className="h-4 w-4" />}
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
