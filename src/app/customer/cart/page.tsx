"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import CartItem from "@/components/cart/cart-item";
import { formatBDT } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, subtotal, itemCount } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);

  // Preview only: the discount is re-computed server-side at checkout.
  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const validateCouponCode = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setCouponMessage("Enter a coupon code first.");
      return;
    }
    setCouponChecking(true);
    setCouponMessage("");
    try {
      const res = await fetch(
        `/api/coupons/validate?code=${encodeURIComponent(trimmed)}&subtotal=${subtotal}`
      );
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: trimmed, discount: data.discount });
        sessionStorage.setItem("rymos_coupon_code", trimmed);
        setCouponMessage(data.message || "Coupon applied.");
      } else {
        setAppliedCoupon(null);
        sessionStorage.removeItem("rymos_coupon_code");
        setCouponMessage(data.message || "Invalid coupon.");
      }
    } catch {
      setCouponMessage("Could not check the coupon. Please try again.");
    } finally {
      setCouponChecking(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
    sessionStorage.removeItem("rymos_coupon_code");
  };

  if (items.length === 0) {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 text-center">
          <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Your Bag is Empty</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">Add some products to get started.</p>
          <Link
            href="/products"
            className="inline-block mt-6 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
          >
            Shop Now
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 lg:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            Shopping Bag ({itemCount} items)
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border p-3 sm:p-4">
                {items.map((item) => (
                  <CartItem
                    key={item.product.id}
                    item={{ ...item, id: item.product.id }}
                  />
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg border p-3 sm:p-4 h-fit mt-4 lg:mt-0">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Order Summary</h2>

              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 truncate mr-2">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-medium flex-shrink-0">
                      {formatBDT(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatBDT(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Discount ({appliedCoupon.code})</span>
                    <span className="text-green-600">−{formatBDT(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatBDT(total)}</span>
                </div>
              </div>

              {/* Coupon (preview only — re-checked server-side at checkout) */}
              <div className="mt-4 pt-3 border-t">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm text-gray-700">
                      <span className="font-mono font-medium">{appliedCoupon.code}</span>
                      <span className="text-gray-500"> — {formatBDT(appliedCoupon.discount)} off</span>
                    </p>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs sm:text-sm text-gray-500 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void validateCouponCode(couponCode);
                          }
                        }}
                        placeholder="Coupon code"
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => void validateCouponCode(couponCode)}
                        disabled={couponChecking || !couponCode.trim()}
                        className="px-4 py-2 bg-black text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {couponChecking ? "Checking…" : "Apply"}
                      </button>
                    </div>
                    {couponMessage && (
                      <p className="mt-2 text-xs text-red-600">{couponMessage}</p>
                    )}
                  </>
                )}
                {appliedCoupon && couponMessage && (
                  <p className="mt-2 text-xs text-green-600">{couponMessage}</p>
                )}
              </div>

              <Link
                href="/customer/checkout"
                className="block w-full mt-4 py-3 bg-black text-white text-center rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="block w-full mt-2 py-2 text-center text-xs sm:text-sm text-gray-600 hover:text-gray-800"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
  );
}
