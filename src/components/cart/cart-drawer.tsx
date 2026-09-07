"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
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
        className="p-2 text-gray-700 hover:text-black relative hidden sm:block"
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-gray-900">
              Cart ({itemCount})
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Your cart is empty</p>
                <Link
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                >
                  Continue Shopping
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
            <div className="p-4 border-t space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold">{formatBDT(subtotal)}</span>
              </div>
              <Link
                href="/customer/checkout"
                onClick={() => setIsOpen(false)}
                className="block w-full py-3 bg-black text-white text-center rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
