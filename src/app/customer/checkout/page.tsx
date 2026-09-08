"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { formatBDT, generateOrderNumber } from "@/lib/utils";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Store, CreditCard, MapPin, Loader2 } from "lucide-react";

type OrderType = "cod" | "pickup" | "credit";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [orderType, setOrderType] = useState<OrderType>("cod");
  const [shippingAddress, setShippingAddress] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<{ orderNumber: string } | null>(null);

  const total = subtotal;

  const handlePlaceOrder = async () => {
    setError("");

    if (!isConfigured()) {
      setError("Supabase is not configured. Please check environment variables.");
      return;
    }

    if (orderType === "cod" && !shippingAddress.trim()) {
      setError("Please enter a shipping address for Cash on Delivery orders.");
      return;
    }

    setIsPlacing(true);

    try {
      const supabase = getSupabase();

      const customerId = localStorage.getItem("rymos_customer_id");

      if (!customerId) {
        setError("Unable to identify customer. Please refresh and try again.");
        setIsPlacing(false);
        return;
      }

      const year = new Date().getFullYear();
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .like("order_number", `RY-${year}-%`);

      const orderNumber = generateOrderNumber((orderCount || 0) + 1);

      const schemaOrderType = orderType === "pickup" ? "shop_pickup" : orderType;

      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        qty: item.quantity,
        price: item.product.price,
      }));

      const shippingAddressObj = orderType === "cod"
        ? {
            address: shippingAddress.trim(),
            type: "delivery",
          }
        : null;

      const { error: insertError } = await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_id: customerId,
        status: "pending",
        order_type: schemaOrderType,
        items: orderItems,
        subtotal: subtotal,
        total: total,
        discount: 0,
        coupon_id: null,
        coupon_code: null,
        payment_method: orderType === "credit" ? "credit" : "cod",
        shipping_address: shippingAddressObj,
        pickup_note: orderType === "pickup" ? pickupNote.trim() || null : null,
      });

      if (insertError) throw insertError;

      clearCart();
      setPlacedOrder({ orderNumber });
    } catch (err: any) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (placedOrder) {
    return (
      <><main className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-[640px] mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0071E3]/10 flex items-center justify-center mx-auto mb-6 sm:mb-10"
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#0071E3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] leading-tight font-semibold tracking-tight text-[#1d1d1f] mb-3 sm:mb-4">
              Thank you.
            </h1>
            <p className="text-base sm:text-lg lg:text-[21px] leading-relaxed text-[#86868b] mb-6 sm:mb-10">
              Your order has been placed. You will receive a confirmation shortly.
            </p>
            <p className="text-xs sm:text-sm text-[#86868b] font-mono mb-8 sm:mb-16 tracking-wide">
              {placedOrder.orderNumber}
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 text-base sm:text-[19px] text-white bg-[#0071E3] rounded-lg hover:bg-[#0077ED] transition-colors min-w-[200px]"
            >
              Continue Shopping
            </Link>
          </motion.div>
        </main></>
    );
  }

  if (items.length === 0) {
    return (
      <><main className="flex-1">
          <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 text-center">
            <p className="text-xl sm:text-2xl lg:text-[28px] font-semibold text-[#1d1d1f] mb-2 sm:mb-3">Your bag is empty.</p>
            <p className="text-sm sm:text-base lg:text-[19px] text-[#86868b] mb-6 sm:mb-10">
              Add something to make someone happy.
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 text-sm sm:text-base lg:text-[19px] text-white bg-[#0071E3] rounded-lg hover:bg-[#0077ED] transition-colors min-w-[200px]"
            >
              Shop now
            </Link>
          </div>
        </main></>
    );
  }

  return (
    <><main className="flex-1 bg-[#fbfbfd]">
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-20">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-3xl sm:text-4xl lg:text-[48px] leading-tight font-semibold tracking-tight text-[#1d1d1f] mb-8 sm:mb-12 lg:mb-16"
          >
            Checkout.
          </motion.h1>

          {/* Order Summary */}
          <section className="mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-tight text-[#1d1d1f] mb-4 sm:mb-6 lg:mb-8">
              Your Order
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex items-center gap-3 sm:gap-5"
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-[#f5f5f7] flex-shrink-0 overflow-hidden">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[#86868b] text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base lg:text-[19px] font-normal text-[#1d1d1f] leading-snug truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs sm:text-sm lg:text-[15px] text-[#86868b] mt-0.5">
                        Qty {item.quantity}
                      </p>
                    </div>
                    {/* Price */}
                    <div className="flex-shrink-0">
                      <p className="text-sm sm:text-base lg:text-[19px] font-normal text-[#1d1d1f] tabular-nums">
                        {formatBDT(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Total */}
            <div className="mt-6 sm:mt-10 pt-4 sm:pt-8 border-t border-[#d2d2d7]">
              <div className="flex justify-between items-baseline">
                <span className="text-sm sm:text-base lg:text-[19px] text-[#1d1d1f]">Total</span>
                <span className="text-xl sm:text-2xl lg:text-[28px] font-semibold text-[#1d1d1f] tracking-tight tabular-nums">
                  {formatBDT(total)}
                </span>
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-tight text-[#1d1d1f] mb-4 sm:mb-6 lg:mb-8">
              Payment
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {[
                { type: "cod" as const, icon: Truck, title: "Cash on Delivery", subtitle: "Pay when your order arrives" },
                { type: "pickup" as const, icon: Store, title: "Shop Pickup", subtitle: "Pick up your order from our store" },
                { type: "credit" as const, icon: CreditCard, title: "Buy on Credit", subtitle: "Pay in easy installments" },
              ].map((option) => (
                <motion.div
                  key={option.type}
                  whileTap={{ scale: 0.995 }}
                  transition={{ duration: 0.1 }}
                >
                  <label
                    className={`block w-full text-left flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border cursor-pointer transition-all duration-300 ${
                      orderType === option.type
                        ? "border-[#0071E3] bg-white shadow-sm"
                        : "border-[#e8e8ed] bg-white hover:border-[#d2d2d7]"
                    }`}
                    onClick={() => setOrderType(option.type)}
                  >
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${
                      orderType === option.type ? "bg-[#0071E3]" : "bg-[#f5f5f7]"
                    }`}>
                      <option.icon className={`w-5 h-5 transition-colors duration-300 ${orderType === option.type ? "text-white" : "text-[#86868b]"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base lg:text-[18px] font-normal text-[#1d1d1f]">{option.title}</p>
                      <p className="text-xs sm:text-sm lg:text-[14px] text-[#86868b] mt-0.5 line-clamp-1">{option.subtitle}</p>
                    </div>
                    <div className={`w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                      orderType === option.type ? "border-[#0071E3]" : "border-[#d2d2d7]"
                    }`}>
                      {orderType === option.type && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#0071E3]"
                        />
                      )}
                    </div>
                  </label>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Delivery Details */}
          <section className="mb-8 sm:mb-12 lg:mb-16">
            <AnimatePresence mode="wait">
              {orderType === "cod" && (
                <motion.div
                  key="cod"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <h2 className="text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-tight text-[#1d1d1f] mb-4 sm:mb-6 lg:mb-8">
                    Shipping Address
                  </h2>
                  <div className="relative">
                    <MapPin className="absolute left-3 sm:left-4 top-3 sm:top-4 w-5 h-5 text-[#86868b]" />
                    <textarea
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Enter your full address"
                      rows={3}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base lg:text-[18px] bg-white border border-[#e8e8ed] rounded-xl sm:rounded-2xl focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all duration-300 placeholder:text-[#86868b] resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {orderType === "pickup" && (
                <motion.div
                  key="pickup"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <h2 className="text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-tight text-[#1d1d1f] mb-4 sm:mb-6 lg:mb-8">
                    Pickup Note
                  </h2>
                  <textarea
                    value={pickupNote}
                    onChange={(e) => setPickupNote(e.target.value)}
                    placeholder="Any special instructions (optional)"
                    rows={3}
                    className="w-full px-4 py-3 sm:py-4 text-sm sm:text-base lg:text-[18px] bg-white border border-[#e8e8ed] rounded-xl sm:rounded-2xl focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all duration-300 placeholder:text-[#86868b] resize-none"
                  />
                </motion.div>
              )}

              {orderType === "credit" && (
                <motion.div
                  key="credit"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <h2 className="text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-tight text-[#1d1d1f] mb-4 sm:mb-6 lg:mb-8">
                    Credit Application
                  </h2>
                  <p className="text-sm sm:text-base lg:text-[18px] text-[#86868b] leading-relaxed">
                    Apply for credit to buy your items now and pay later.
                  </p>
                  <Link
                    href="/customer/credit-application"
                    className="inline-block mt-4 text-sm sm:text-base lg:text-[18px] text-[#0071E3] hover:underline transition-colors"
                  >
                    Apply for Credit
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="mb-6 sm:mb-10 p-3 sm:p-5 bg-red-50 border border-red-100 rounded-xl sm:rounded-2xl text-red-600 text-xs sm:text-sm lg:text-[15px]"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA - Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="pt-6 sm:pt-10 border-t border-[#d2d2d7] text-center"
          >
            {isPlacing ? (
              <span className="inline-flex items-center gap-2 text-base sm:text-lg lg:text-[20px] text-[#86868b]">
                <Loader2 className="w-5 h-5 animate-spin" />
                Placing Order
              </span>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={orderType === "cod" && !shippingAddress.trim()}
                className={`w-full sm:w-auto px-8 py-3 text-base sm:text-lg lg:text-[20px] font-medium rounded-lg transition-colors duration-200 min-h-[48px] ${
                  orderType === "cod" && !shippingAddress.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#0071E3] text-white hover:bg-[#0077ED]"
                }`}
              >
                Place Order
              </button>
            )}
          </motion.div>

          {/* Return link */}
          <div className="mt-6 sm:mt-10 text-center">
            <Link
              href="/customer/cart"
              className="text-sm sm:text-base lg:text-[15px] text-[#86868b] hover:text-[#0071E3] transition-colors duration-200 py-2 inline-block min-h-[44px]"
            >
              ← Return to Bag
            </Link>
          </div>
        </div>
      </main></>
  );
}
