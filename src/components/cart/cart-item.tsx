"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { useCart } from "@/context/cart-context";

interface CartItemProps {
  item: {
    id: string;
    product: {
      id: string;
      name: string;
      brand?: string;
      price: number;
      original_price?: number;
      stock: number;
      images?: string[];
      specs?: Record<string, string>;
    };
    quantity: number;
  };
  compact?: boolean;
}

export default function CartItem({ item, compact = false }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;

  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0]
      : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80";

  const itemTotal = product.price * quantity;

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
        <div
          className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)] truncate">
            {product.name}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {quantity}x {formatBDT(product.price)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {formatBDT(itemTotal)}
          </p>
          <button
            onClick={() => removeItem(product.id)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 py-4 border-b border-[var(--color-border)] last:border-0">
      {/* Product Image */}
      <Link
        href={`/products/${product.id}`}
        className="block w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-cover bg-center bg-no-repeat hover:scale-105 transition-transform"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <div>
            <Link
              href={`/products/${product.id}`}
              className="font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] line-clamp-2"
            >
              {product.name}
            </Link>
            {product.brand && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {product.brand}
              </p>
            )}
          </div>
          <button
            onClick={() => removeItem(product.id)}
            className="p-1 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
            aria-label="Remove item"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price and Quantity Controls */}
        <div className="flex items-center justify-between mt-3">
          {/* Quantity Controls */}
          <div className="flex items-center border border-[var(--color-border)] rounded-lg">
            <button
              onClick={() => updateQuantity(product.id, quantity - 1)}
              disabled={quantity <= 1}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-sm font-medium text-[var(--color-text)] min-w-[2rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => updateQuantity(product.id, quantity + 1)}
              disabled={quantity >= product.stock}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Item Total */}
          <div className="text-right">
            <p className="font-semibold text-[var(--color-text)]">
              {formatBDT(itemTotal)}
            </p>
            {product.original_price && product.original_price > product.price && (
              <p className="text-xs text-[var(--color-text-muted)] line-through">
                {formatBDT(product.original_price * quantity)}
              </p>
            )}
          </div>
        </div>

        {/* Stock Warning */}
        {quantity >= product.stock && (
          <p className="text-xs text-amber-600 mt-1">
            Maximum available quantity reached
          </p>
        )}
      </div>
    </div>
  );
}
