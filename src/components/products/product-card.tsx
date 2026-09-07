"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import StarRating from "@/components/shared/star-rating";
import PriceDisplay from "@/components/shared/price-display";

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

export default function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/products/${product.id}`}
        className="group bg-white rounded-lg border border-[var(--color-border)] overflow-hidden hover:shadow-lg transition-shadow block"
      >
        {/* Image */}
        <div className="relative aspect-square bg-[var(--color-bg-alt)] flex items-center justify-center">
          <div className="text-4xl">📱</div>

          {/* Discount Badge */}
          {product.discount && product.discount > 0 && (
            <span className="absolute top-3 left-3 bg-[var(--color-accent)] text-white text-xs font-bold px-2 py-1 rounded-full">
              {product.discount}% off
            </span>
          )}

          {/* Wishlist button */}
          <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
            <Heart className="h-4 w-4 text-gray-400 hover:text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
            {product.name}
          </h3>

          {product.specs && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {product.specs}
            </p>
          )}

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={product.rating} />
              <span className="text-xs text-[var(--color-text-muted)]">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-3">
            <PriceDisplay
              price={product.price}
              originalPrice={product.originalPrice}
            />
          </div>

          {/* Add to Cart */}
          <button className="w-full mt-3 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
