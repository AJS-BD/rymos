"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";

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
  images?: string[];
}

const blurDataUri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3Crect width='4' height='4' fill='%23f3f4f6'/%3E%3C/svg%3E";

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
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }} className={className}>
      {children}
    </motion.div>
  );
}

export default function ProductDetailClient({ product, related }: { product: Product; related: RelatedProduct[] }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { addItem } = useCart();

  const imageUrl = product.images?.[0] || productImages[product.name] || fallbackImage;
  const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;
  const specs = product.specs ? Object.entries(product.specs) : [];

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

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section ref={heroRef} className="relative w-full min-h-[60vh] lg:min-h-[85vh] flex flex-col lg:flex-row">
        {/* Product Image - 60% on desktop */}
        <motion.div style={{ y: heroImageY, opacity: heroOpacity }} className="relative w-full lg:w-[60%] h-[50vh] lg:h-[85vh] overflow-hidden order-1 lg:order-1 bg-gray-100">
          <img src={blurDataUri} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl" />
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover object-center relative z-[1] scale-[1.4]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </motion.div>

        {/* Product Info - 40% on desktop */}
        <div className="w-full lg:w-[40%] flex items-center justify-center px-6 sm:px-10 lg:px-16 py-10 lg:py-20 order-2 lg:order-2 bg-white">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="max-w-lg text-center lg:text-left">
            {product.brand && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="text-xs sm:text-sm font-light tracking-widest uppercase text-gray-400 mb-3">{product.brand}</motion.p>
            )}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-gray-900 tracking-tight leading-tight">{product.name}</motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }}
              className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-500 font-light leading-relaxed">
              {product.description || "Experience the perfect blend of innovation and design."}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.65 }}
              className="mt-6 sm:mt-8 flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">৳{product.price.toLocaleString()}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-base sm:text-lg text-gray-400 line-through">৳{product.original_price.toLocaleString()}</span>
              )}
            </motion.div>

            {discount > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
                className="mt-2 text-xs sm:text-sm text-green-600 font-medium">Save {discount}%</motion.p>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-3">
              {product.stock > 0 ? (
                <p className="text-xs sm:text-sm text-green-600">In stock</p>
              ) : (
                <p className="text-xs sm:text-sm text-red-500">Out of stock</p>
              )}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.85 }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6">
              <button onClick={handleAddToCart}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Add to Bag
              </button>
              <Link href="#specs"
                className="text-blue-600 text-sm sm:text-base font-normal hover:underline inline-flex items-center gap-1 transition-colors group">
                View specs
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SPECIFICATIONS SECTION */}
      {specs.length > 0 && (
        <section id="specs" className="py-16 sm:py-24 lg:py-32 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInWhenVisible>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-center text-gray-900 tracking-tight mb-12 sm:mb-16">Specifications</h2>
            </FadeInWhenVisible>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {specs.map(([key, value], idx) => (
                <FadeInWhenVisible key={key} delay={idx * 0.08}>
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-center shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col justify-center min-h-[140px] sm:min-h-[180px]">
                    <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider mb-3 font-medium">{key.replace(/_/g, " ")}</p>
                    <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">{value}</p>
                  </div>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED IMAGE SECTION */}
      <section className="py-16 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-20 items-center">
            <FadeInWhenVisible>
              <div className="aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100 relative">
                <img src={blurDataUri} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl" />
                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover relative z-[1]" />
              </div>
            </FadeInWhenVisible>
            <FadeInWhenVisible delay={0.2}>
              <div className="mt-6 lg:mt-0 text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight">Designed to stand out.</h3>
                <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-gray-500 font-light leading-relaxed">
                  Every detail has been carefully considered. From the premium materials to the intuitive interface, this is technology that feels as good as it looks.
                </p>
                <Link href="/products" className="inline-flex items-center gap-1 mt-6 sm:mt-8 text-blue-600 text-sm sm:text-base lg:text-lg hover:underline">
                  Explore more <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeInWhenVisible>
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="py-16 sm:py-24 lg:py-32 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInWhenVisible>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 tracking-tight mb-8 sm:mb-12">You may also like</h2>
            </FadeInWhenVisible>
          </div>
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 sm:pb-6 snap-x snap-mandatory scrollbar-hide px-4 sm:px-6 lg:px-8">
            {related.map((p, idx) => (
              <FadeInWhenVisible key={p.id} delay={idx * 0.1}>
                <Link href={`/products/${p.id}`} className="flex-shrink-0 w-56 sm:w-72 lg:w-80 snap-start group">
                  <div className="aspect-square bg-white rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-sm">
                    <img src={blurDataUri} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl" />
                    <img src={relatedImages[p.name] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80"} alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-[1]" />
                  </div>
                  <h3 className="mt-4 text-sm sm:text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">৳{p.price.toLocaleString()}</p>
                </Link>
              </FadeInWhenVisible>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
