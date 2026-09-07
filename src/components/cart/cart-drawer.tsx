"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/cart-context";
import CartItem from "@/components/cart/cart-item";
import { formatBDT } from "@/lib/utils";

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, subtotal, itemCount } = useCart();

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-[var(--color-text)] hover:text-[var(--color-primary)] relative transition-colors"
      >
        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[10px] rounded-full h-3.5 w-3.5 flex items-center justify-center sm:h-4 sm:w-4 sm:text-xs font-medium">
            {itemCount}
          </span>
        )}
      </button>

      {/* Overlay + Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white shadow-xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Cart ({itemCount})
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-auto p-4">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-[var(--color-border)] mx-auto mb-4" />
                    <p className="text-[var(--color-text-muted)] mb-4">Your cart is empty</p>
                    <Link
                      href="/products"
                      onClick={() => setIsOpen(false)}
                      className="text-[var(--color-primary)] hover:underline text-sm font-normal"
                    >
                      Continue Shopping →
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <CartItem
                      key={item.product.id}
                      item={{ ...item, id: item.product.id }}
                      compact
                    />
                  ))
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="p-4 border-t border-[var(--color-border)] space-y-3">
                  <div className="flex justify-between text-[var(--color-text)]">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatBDT(subtotal)}</span>
                  </div>
                  <Link
                    href="/customer/checkout"
                    onClick={() => setIsOpen(false)}
                    className="block w-full py-3 bg-[var(--color-primary)] text-white text-center rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
                  >
                    Checkout
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
