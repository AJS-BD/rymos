"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { formatBDT, generateOrderNumber } from "@/lib/utils";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { MapPin, Store, CreditCard, Truck, CheckCircle, Loader2, Package } from "lucide-react";

type OrderType = "cod" | "pickup" | "credit";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [orderType, setOrderType] = useState<OrderType>("cod");
  const [shippingAddress, setShippingAddress] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<{ orderNumber: string } | null>(null);

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

      // Get customer ID from localStorage (set by messages page or credit application)
      const customerId = localStorage.getItem("rymos_customer_id");

      if (!customerId) {
        setError("Unable to identify customer. Please refresh and try again.");
        setIsPlacing(false);
        return;
      }

      // Generate order number based on order count this year
      const year = new Date().getFullYear();
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .like("order_number", `RY-${year}-%`);

      const orderNumber = generateOrderNumber((orderCount || 0) + 1);

      // Map order type to schema values
      const schemaOrderType = orderType === "pickup" ? "shop_pickup" : orderType;

      // Build items array for JSONB
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        qty: item.quantity,
        price: item.product.price,
      }));

      // Build shipping_address object for COD
      const shippingAddressObj = orderType === "cod"
        ? {
            address: shippingAddress.trim(),
            type: "delivery",
          }
        : null;

      // Insert order
      const { error: insertError } = await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_id: customerId,
        status: "pending",
        order_type: schemaOrderType,
        items: orderItems,
        subtotal: subtotal,
        total: subtotal,
        payment_method: orderType === "credit" ? "credit" : "cod",
        shipping_address: shippingAddressObj,
        pickup_note: orderType === "pickup" ? pickupNote.trim() || null : null,
      });

      if (insertError) throw insertError;

      // Clear cart and show confirmation
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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border p-8 shadow-sm">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-500 mb-6">
            Thank you for your order. We&apos;ll contact you soon with delivery updates.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Order Number</p>
            <p className="text-xl font-mono font-bold text-gray-900">
              {placedOrder.orderNumber}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              href="/customer/messages"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="h-4 w-4" />
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Cart is Empty</h1>
        <p className="text-gray-500 mt-2">Add some products to checkout.</p>
        <Link
          href="/products"
          className="inline-block mt-6 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left - Order Details */}
        <div className="space-y-6">
          {/* Order Type Selection */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Delivery Method</h2>
            <div className="space-y-2">
              <button
                onClick={() => setOrderType("cod")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  orderType === "cod"
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Truck className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay when you receive</p>
                </div>
              </button>

              <button
                onClick={() => setOrderType("pickup")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  orderType === "pickup"
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Store className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">Shop Pickup</p>
                  <p className="text-xs text-gray-500">Pick up from store</p>
                </div>
              </button>

              <button
                onClick={() => setOrderType("credit")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  orderType === "credit"
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium text-sm">Buy on Credit</p>
                  <p className="text-xs text-gray-500">Pay in installments</p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Fields */}
          {orderType === "cod" && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </h2>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your full address..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          )}

          {orderType === "pickup" && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Pickup Note
              </h2>
              <textarea
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="Any special instructions..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          )}

          {orderType === "credit" && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit Application
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                To buy on credit, please submit a credit application first.
              </p>
              <Link
                href="/customer/credit-application"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Apply for Credit →
              </Link>
            </div>
          )}
        </div>

        {/* Right - Order Summary */}
        <div className="bg-white rounded-lg border p-4 h-fit">
          <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>

          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="font-medium">
                  {formatBDT(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatBDT(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>{formatBDT(subtotal)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isPlacing || (orderType === "cod" && !shippingAddress.trim())}
            className="w-full mt-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPlacing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              "Place Order"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
