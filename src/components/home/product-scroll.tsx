"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion, useMotionValue, useInView } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getSupabase, isConfigured } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
}

// Map product names to unique Unsplash images
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "iPhone 15 Pro Max": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
  "Samsung Galaxy S24 Ultra": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80",
  "OnePlus 12": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  "Xiaomi 14 Ultra": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
  "Google Pixel 8 Pro": "https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=600&q=80",
  "Nothing Phone (2)": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&q=80",
  "Sony Xperia 1 V": "https://images.unsplash.com/photo-1533228100845-08145b01de14?w=600&q=80",
  "Motorola Edge 40": "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80",
  "Realme GT 5": "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600&q=80",
  "Poco F5 Pro": "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600&q=80",
};

// Fallback unique images for products not in the map (all distinct from PRODUCT_IMAGE_MAP)
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80",
  "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600&q=80",
  "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80",
  "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&q=80",
  "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=600&q=80",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
];

function getProductImage(name: string, fallbackIndex: number): string {
  if (PRODUCT_IMAGE_MAP[name]) return PRODUCT_IMAGE_MAP[name];
  return FALLBACK_IMAGES[fallbackIndex % FALLBACK_IMAGES.length];
}

// Default fallback products if Supabase is unavailable
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max",
    price: "৳164,999",
    image: PRODUCT_IMAGE_MAP["iPhone 15 Pro Max"],
  },
  {
    id: "2",
    name: "Samsung Galaxy S24 Ultra",
    price: "৳129,999",
    image: PRODUCT_IMAGE_MAP["Samsung Galaxy S24 Ultra"],
  },
  {
    id: "3",
    name: "OnePlus 12",
    price: "৳79,999",
    image: PRODUCT_IMAGE_MAP["OnePlus 12"],
  },
  {
    id: "4",
    name: "Xiaomi 14 Ultra",
    price: "৳54,999",
    image: PRODUCT_IMAGE_MAP["Xiaomi 14 Ultra"],
  },
  {
    id: "5",
    name: "Google Pixel 8 Pro",
    price: "৳89,999",
    image: PRODUCT_IMAGE_MAP["Google Pixel 8 Pro"],
  },
  {
    id: "6",
    name: "Nothing Phone (2)",
    price: "৳49,999",
    image: PRODUCT_IMAGE_MAP["Nothing Phone (2)"],
  },
];

export default function ProductScroll() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (!isConfigured()) {
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("products")
          .select("id, name, price, image_url")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(8);

        if (error || !data || data.length === 0) {
          setLoading(false);
          return;
        }

        const mappedProducts: Product[] = data.map((item: any, index: number) => ({
          id: String(item.id),
          name: item.name,
          price: item.price ? `৳${Number(item.price).toLocaleString()}` : "",
          image: item.image_url || getProductImage(item.name, index),
        }));

        setProducts(mappedProducts);
      } catch (err) {
        console.warn("Failed to fetch products from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Spring-based scroll transforms
  const titleY = useSpring(useTransform(scrollYProgress, [0, 0.3], [60, 0]), {
    damping: 25,
    stiffness: 100,
  });
  const titleOpacity = useSpring(useTransform(scrollYProgress, [0, 0.2, 0.4], [0, 0.5, 1]), {
    damping: 25,
    stiffness: 100,
  });
  const titleRotateX = useTransform(scrollYProgress, [0, 0.3], [-8, 0]);

  if (loading) {
    return (
      <section ref={sectionRef} className="py-12 sm:py-16 lg:py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight text-[var(--color-text)]">
            The latest.
          </h2>
          <p className="mt-2 text-base sm:text-lg text-[var(--color-text-muted)]">
            Take a look at what&apos;s new.
          </p>
        </div>
        <div className="flex gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-[240px] sm:w-[280px] lg:w-[320px]">
              <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse mb-4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-8 sm:mb-12">
        <motion.div
          style={{
            y: titleY,
            opacity: titleOpacity,
            rotateX: prefersReducedMotion ? 0 : titleRotateX,
            transformPerspective: 1200,
            transformStyle: "preserve-3d",
          }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight text-[var(--color-text)]">
            The latest.
          </h2>
          <p className="mt-2 text-base sm:text-lg text-[var(--color-text-muted)]">
            Take a look at what&apos;s new.
          </p>
        </motion.div>
      </div>

      <div className="relative">
        {/* Scroll container */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 snap-x snap-mandatory pb-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>

        {/* View All link */}
        <div className="max-w-7xl mx-auto px-4 mt-6 sm:mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline text-sm sm:text-base font-normal"
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
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });

  // 3D hover tracking with spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 350, mass: 0.4 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);
  const scale = useSpring(1, { damping: 18, stiffness: 250, mass: 0.6 });
  const shadowY = useSpring(0, { damping: 25, stiffness: 200 });
  const shadowBlur = useSpring(0, { damping: 25, stiffness: 200 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [prefersReducedMotion, mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    if (prefersReducedMotion) return;
    scale.set(1.05);
    shadowY.set(12);
    shadowBlur.set(24);
  }, [prefersReducedMotion, scale, shadowY, shadowBlur]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
    shadowY.set(0);
    shadowBlur.set(0);
  }, [mouseX, mouseY, scale, shadowY, shadowBlur]);

  const boxShadow = useTransform(
    [shadowY, shadowBlur] as const,
    ([y, blur]) => `0px ${y}px ${blur}px rgba(0, 0, 0, 0.1)`
  );

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 40, rotateX: -10 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40, rotateX: -10 }}
      transition={{
        type: "spring",
        damping: 22,
        stiffness: 100,
        mass: 0.8,
        delay: index * 0.1,
      }}
      style={{
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        scale,
        boxShadow,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      className="flex-shrink-0 w-[240px] sm:w-[280px] lg:w-[320px] snap-start"
    >
      <Link href={`/products/${product.id}`} className="group cursor-pointer block">
        <motion.div
          className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${product.image})` }}
          whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
        </motion.div>
        <h3 className="text-sm sm:text-base font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors duration-200 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {product.price}
        </p>
      </Link>
    </motion.div>
  );
}
