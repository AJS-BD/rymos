"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

interface StickyProductBarProps {
  product: {
    id: string;
    name: string;
    brand?: string;
    price: number;
    stock: number;
    images?: string[];
    category: string;
  };
  heroRef: React.RefObject<HTMLDivElement | null>;
}

export default function StickyProductBar({ product, heroRef }: StickyProductBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when hero section is no longer fully visible
        setIsVisible(!entry.isIntersecting);
      },
      {
        rootMargin: "-64px 0px 0px 0px", // Account for navbar height
        threshold: 0,
      }
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, [heroRef]);

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
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
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed top-12 sm:top-14 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm"
          style={{ fontFamily: "var(--font-sans, 'Inter', sans-serif)" }}
        >
          <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop: inline layout */}
            <div className="hidden sm:flex items-center justify-between h-14">
              <div className="flex-1 min-w-0 mr-4">
                <h2 className="text-sm font-medium text-gray-900 truncate">
                  {product.name}
                </h2>
              </div>
              <div className="flex-shrink-0 mx-6">
                <span className="text-lg font-semibold text-gray-900 tracking-tight">
                  ৳{product.price.toLocaleString()}
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Bag
              </motion.button>
            </div>

            {/* Mobile: stacked layout */}
            <div className="sm:hidden py-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-900 truncate flex-1 mr-3">
                  {product.name}
                </h2>
                <span className="text-base font-semibold text-gray-900">
                  ৳{product.price.toLocaleString()}
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Bag
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
