"use client";

import { motion, useSpring, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import StarRating from "@/components/shared/star-rating";
import PriceDisplay from "@/components/shared/price-display";
import { useRef, useCallback } from "react";
import { useCart } from "@/context/cart-context";

interface Product {
  id: string;
  name: string;
  specs?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  image: string;
}

// Map product names to real images
const productImages: Record<string, string> = {
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

export default function ProductCard({ product }: { product: Product }) {
  const imageUrl = productImages[product.name] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80";
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  // Motion values for 3D rotation tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring-based smooth tracking with optimized config
  const springConfig = { damping: 25, stiffness: 350, mass: 0.4 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);
  const scale = useSpring(1, { damping: 18, stiffness: 250, mass: 0.6 });
  const shadowY = useSpring(0, { damping: 25, stiffness: 200 });
  const shadowBlur = useSpring(0, { damping: 25, stiffness: 200 });
  const shadowOpacity = useSpring(0, { damping: 25, stiffness: 200 });

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
    scale.set(1.04);
    shadowY.set(16);
    shadowBlur.set(32);
    shadowOpacity.set(0.15);
  }, [prefersReducedMotion, scale, shadowY, shadowBlur, shadowOpacity]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
    shadowY.set(0);
    shadowBlur.set(0);
    shadowOpacity.set(0);
  }, [mouseX, mouseY, scale, shadowY, shadowBlur, shadowOpacity]);

  // Shadow transform with opacity
  const boxShadow = useTransform(
    [shadowY, shadowBlur, shadowOpacity] as const,
    ([y, blur, opacity]) => `0px ${y}px ${blur}px rgba(0, 0, 0, ${opacity})`
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      brand: "",
      price: product.price,
      stock: 10,
      images: [imageUrl],
      category: "",
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        scale,
        boxShadow,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      initial={{ opacity: 0, y: 30, rotateX: -12 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 100,
        mass: 0.8,
      }}
    >
      <Link
        href={`/products/${product.id}`}
        className="group bg-white rounded-xl sm:rounded-2xl border border-[var(--color-border)] overflow-hidden block"
      >
        {/* Image with overflow hidden for zoom */}
        <motion.div
          className="relative aspect-square overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageUrl})` }}
          whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Discount Badge */}
          {product.discount && product.discount > 0 && (
            <motion.span
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 15 }}
              className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[var(--color-accent)] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-lg"
            >
              {product.discount}% off
            </motion.span>
          )}

          {/* Wishlist button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Heart className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
          </motion.button>
        </motion.div>

        {/* Content */}
        <div className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors duration-200 text-sm sm:text-base line-clamp-2">
            {product.name}
          </h3>

          {product.specs && (
            <p className="text-[10px] sm:text-xs md:text-sm text-[var(--color-text-muted)] mt-1 line-clamp-1 leading-tight">
              {product.specs}
            </p>
          )}

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
              <StarRating rating={product.rating} />
              <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] leading-none">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-2 sm:mt-3">
            <PriceDisplay
              price={product.price}
              originalPrice={product.originalPrice}
            />
          </div>

          {/* Add to Bag */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            className="w-full mt-3 sm:mt-4 py-2.5 bg-[var(--color-primary)] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px] sm:min-h-[48px]"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Add to Bag
          </motion.button>
        </div>
      </Link>
    </motion.div>
  );
}
