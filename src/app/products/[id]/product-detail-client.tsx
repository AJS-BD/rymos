"use client";

import { motion } from "framer-motion";
import { ImageSkeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  brand?: string;
  price: number;
  original_price?: number;
  stock: number;
  description?: string;
  specs?: Record<string, string>;
  category: string;
  colors?: { name: string; hex: string }[];
  images?: string[];
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  category: string;
}

/* ------------------------------------------------------------------ */
/*  Blur placeholder                                                    */
/* ------------------------------------------------------------------ */

const blurDataUri =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3Crect width='4' height='4' fill='%23f3f4f6'/%3E%3C/svg%3E";

const productImages: Record<string, string> = {
  "Samsung Galaxy S24 Ultra": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=1200&q=80",
  "iPhone 15 Pro Max": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=80",
  "iPhone 15 128GB": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=80",
  "OnePlus 12": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&q=80",
  "Xiaomi 14 Ultra": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&q=80",
  "Samsung Galaxy S23 FE 5G": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=1200&q=80",
  "AirPods Pro 2nd Gen": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1200&q=80",
  "Anker 20W Charger": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200&q=80",
  "Apple Watch SE 2nd Gen": "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=1200&q=80",
  "Apple Watch Series 9": "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=1200&q=80",
  "Vivo V20 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&q=80",
  "Realme 12 Pro+ 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&q=80",
  "Nothing Phone (2a)": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&q=80",
  "POCO X6 Pro 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&q=80",
};

const fallbackImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80";

const relatedImages: Record<string, string> = {
  "Samsung Galaxy S24 Ultra": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
  "iPhone 15 Pro Max": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
  "iPhone 15 128GB": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
  "OnePlus 12": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Xiaomi 14 Ultra": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Samsung Galaxy S23 FE 5G": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
  "AirPods Pro 2nd Gen": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80",
  "Anker 20W Charger": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80",
  "Apple Watch SE 2nd Gen": "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&q=80",
  "Apple Watch Series 9": "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&q=80",
  "Vivo V20 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Realme 12 Pro+ 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Nothing Phone (2a)": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "POCO X6 Pro 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
};

function FadeInWhenVisible({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

import { useRef, useState } from "react";
import { useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCart } from "@/context/cart-context";

export default function ProductDetailClient({
  product,
  related,
}: {
  product: Product;
  related: RelatedProduct[];
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [selectedColor, setSelectedColor] = useState(0);
  const { addItem } = useCart();

  const imageUrl = product.images?.[0] || productImages[product.name] || fallbackImage;
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const colors = product.colors || [];

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand || "",
      price: product.price,
      stock: product.stock,
      images: product.images || [],
      category: product.category,
    });
  };

  const specs = product.specs ? Object.entries(product.specs) : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="relative w-full h-[50vh] sm:h-[70vh] lg:h-[85vh] overflow-hidden">
        <motion.div
          style={{ y: heroImageY, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          {/* Blur placeholder */}
          <img
            src={blurDataUri}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-[120%] object-cover object-center scale-110 blur-xl"
          />
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-[120%] object-cover object-center relative z-[1]"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto text-center text-white"
          >
            {product.brand && (
              <p className="text-xs sm:text-sm font-light tracking-widest uppercase mb-1 sm:mb-2 opacity-80">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl sm:text-4xl lg:text-6xl xl:text-7xl font-semibold tracking-tight leading-none">
              {product.name}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Product Info Section */}
      <section className="py-8 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <FadeInWhenVisible>
            <p className="text-sm sm:text-lg lg:text-xl text-gray-500 font-light leading-relaxed max-w-2xl mx-auto">
              {product.description || "Experience the perfect blend of innovation and design. Crafted with precision for those who demand the best."}
            </p>
          </FadeInWhenVisible>

          <FadeInWhenVisible delay={0.15}>
            <div className="mt-6 sm:mt-10 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight">
                ৳{product.price.toLocaleString()}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-base sm:text-lg lg:text-xl text-gray-400 line-through">
                  ৳{product.original_price.toLocaleString()}
                </span>
              )}
            </div>
            {discount > 0 && (
              <p className="mt-2 text-xs sm:text-sm text-green-600 font-medium">
                Save {discount}%
              </p>
            )}
          </FadeInWhenVisible>

          {/* Color Options */}
          {colors.length > 0 && (
            <FadeInWhenVisible delay={0.25}>
              <div className="mt-8 sm:mt-12">
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  Color: <span className="text-gray-900">{colors[selectedColor]?.name}</span>
                </p>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {colors.map((color, idx) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(idx)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-200 ${
                        selectedColor === idx
                          ? "border-[#0071E3] scale-110"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.name}
                    />
                  ))}
                </div>
              </div>
            </FadeInWhenVisible>
          )}
        </div>
      </section>

      {/* Specifications Grid */}
      {specs.length > 0 && (
        <section className="py-8 sm:py-16 lg:py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInWhenVisible>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-center text-gray-900 tracking-tight mb-8 sm:mb-12 lg:mb-16">
                Specifications
              </h2>
            </FadeInWhenVisible>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {specs.map(([key, value], idx) => (
                <FadeInWhenVisible key={key} delay={idx * 0.08}>
                  <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 text-center shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col justify-center">
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 font-medium">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
                      {value}
                    </p>
                  </div>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feature Highlight Section */}
      <section className="py-8 sm:py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-20 items-center">
            <FadeInWhenVisible>
              <div className="aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100 relative">
                {/* Blur placeholder */}
                <img
                  src={blurDataUri}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl"
                />
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover relative z-[1]"
                />
              </div>
            </FadeInWhenVisible>
            <FadeInWhenVisible delay={0.2}>
              <div className="mt-6 lg:mt-0 text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight">
                  Designed to stand out.
                </h3>
                <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-gray-500 font-light leading-relaxed">
                  Every detail has been carefully considered. From the premium materials to the
                  intuitive interface, this is technology that feels as good as it looks.
                </p>
                <Link
                  href="#purchase"
                  className="inline-flex items-center gap-1 mt-6 sm:mt-8 text-[#0071E3] text-sm sm:text-base lg:text-lg hover:underline"
                >
                  Learn more
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeInWhenVisible>
          </div>
        </div>
      </section>

      {/* Purchase Section */}
      <section id="purchase" className="py-8 sm:py-16 lg:py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeInWhenVisible>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight">
              Ready to order?
            </h2>
            <p className="mt-3 sm:mt-4 text-lg sm:text-xl text-gray-500 font-light">
              ৳{product.price.toLocaleString()}
            </p>
            {product.stock > 0 ? (
              <p className="mt-2 text-xs sm:text-sm text-green-600">In stock</p>
            ) : (
              <p className="mt-2 text-xs sm:text-sm text-red-500">Out of stock</p>
            )}
          </FadeInWhenVisible>

          <FadeInWhenVisible delay={0.15}>
            <div className="mt-6 sm:mt-10">
              <button
                onClick={handleAddToCart}
                className="w-full sm:w-auto px-8 py-3 text-[#0071E3] text-base sm:text-lg border-2 border-[#0071E3] rounded-lg hover:bg-[#0071E3] hover:text-white transition-colors inline-flex items-center justify-center gap-1 min-h-[48px]"
              >
                Add to Cart
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* Related Products - Horizontal Scroll */}
      {related.length > 0 && (
        <section className="py-8 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInWhenVisible>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight mb-6 sm:mb-10">
                You may also like
              </h2>
            </FadeInWhenVisible>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 sm:pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              {related.map((p, idx) => (
                <FadeInWhenVisible key={p.id} delay={idx * 0.1}>
                  <Link
                    href={`/products/${p.id}`}
                    className="flex-shrink-0 w-48 sm:w-64 lg:w-72 snap-start group"
                  >
                    <div className="aspect-square bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden relative">
                      {/* Blur placeholder */}
                      <img
                        src={blurDataUri}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl"
                      />
                      <img
                        src={relatedImages[p.name] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80"}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-[1]"
                      />
                    </div>
                    <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-medium text-gray-900 group-hover:text-[#0071E3] transition-colors">
                      {p.name}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                      ৳{p.price.toLocaleString()}
                    </p>
                  </Link>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
