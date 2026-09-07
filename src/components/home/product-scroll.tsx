"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
}

const products: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    price: "৳164,999",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
  },
  {
    id: "2",
    name: "Samsung Galaxy S24 Ultra",
    price: "৳129,999",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80",
  },
  {
    id: "3",
    name: "OnePlus 12",
    price: "৳79,999",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  },
  {
    id: "4",
    name: "Xiaomi 14 Ultra",
    price: "৳54,999",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
  },
  {
    id: "5",
    name: "Google Pixel 8 Pro",
    price: "৳89,999",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  },
  {
    id: "6",
    name: "Nothing Phone (2)",
    price: "৳49,999",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
  },
];

export default function ProductScroll() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.3], [40, 0]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={sectionRef} className="py-20 sm:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <motion.div style={{ y: titleY, opacity: titleOpacity }}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--color-text)]">
            The latest.
          </h2>
          <p className="mt-2 text-lg text-[var(--color-text-muted)]">
            Take a look at what&apos;s new.
          </p>
        </motion.div>
      </div>

      <div className="relative">
        {/* Scroll container */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 px-4 sm:px-6 lg:px-8 snap-x snap-mandatory pb-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>

        {/* View All link */}
        <div className="max-w-7xl mx-auto px-4 mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline text-base font-normal"
          >
            View all products
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 0.5], [30, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.div
      ref={cardRef}
      style={{ y, opacity }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start"
    >
      <div className="group cursor-pointer">
        <div className="relative aspect-square bg-[var(--color-bg-alt)] rounded-2xl overflow-hidden mb-4">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <h3 className="text-base font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {product.price}
        </p>
      </div>
    </motion.div>
  );
}
