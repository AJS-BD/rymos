"use client";

import { useState } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

interface OrderStatus {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  created_at: string;
  estimated_delivery: string | null;
  tracking_number: string | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  timeline: Array<{
    status: string;
    timestamp: string;
    description: string;
  }>;
}

const statusConfig: Record<
  string,
  { icon: typeof Package; color: string; bgColor: string; label: string }
> = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "Pending",
  },
  confirmed: {
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Confirmed",
  },
  processing: {
    icon: Package,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    label: "Processing",
  },
  shipped: {
    icon: Truck,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Shipped",
  },
  delivered: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Delivered",
  },
  cancelled: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Cancelled",
  },
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);

    if (!orderNumber.trim()) {
      setError("Please enter an order number.");
      return;
    }

    if (!isConfigured()) {
      setError("Order tracking is not configured. Please contact support.");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber.trim().toUpperCase())
        .single();

      if (fetchError || !data) {
        setError(
          "Order not found. Please check the order number and try again."
        );
        return;
      }

      // Fetch order items
      const { data: items } = await supabase
        .from("order_items")
        .select("name, quantity, price")
        .eq("order_id", data.id);

      // Build timeline based on status
      const timeline = buildTimeline(data);

      setOrder({
        id: data.id,
        order_number: data.order_number,
        status: data.status,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        total_amount: data.total_amount,
        created_at: data.created_at,
        estimated_delivery: data.estimated_delivery,
        tracking_number: data.tracking_number,
        items: items || [],
        timeline,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  function buildTimeline(data: any) {
    const timeline = [];
    const statusOrder = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
    ];

    const createdAt = new Date(data.created_at);
    const currentStatusIndex = statusOrder.indexOf(data.status);

    if (data.status === "cancelled") {
      timeline.push({
        status: "cancelled",
        timestamp: data.updated_at || data.created_at,
        description: "Order has been cancelled",
      });
      return timeline;
    }

    for (let i = 0; i <= currentStatusIndex; i++) {
      const status = statusOrder[i];
      const date = new Date(createdAt.getTime() + i * 24 * 60 * 60 * 1000);
      const descriptions: Record<string, string> = {
        pending: "Order placed successfully",
        confirmed: "Order confirmed by seller",
        processing: "Order is being prepared",
        shipped: "Order has been shipped",
        delivered: "Order delivered successfully",
      };
      timeline.push({
        status,
        timestamp: date.toISOString(),
        description: descriptions[status] || status,
      });
    }

    return timeline;
  }

  const currentStatus = order ? statusConfig[order.status] || statusConfig.pending : null;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text)]">
              Track Your Order
            </h1>
            <p className="text-[var(--color-text-muted)] mt-2">
              Enter your order number to check the current status
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleTrack} className="mb-8">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Enter order number (e.g., RY-2024-0001)"
                  className="w-full pl-10 pr-4 py-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Track
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              You can find your order number in your confirmation email.
            </p>
          </form>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Not Found State */}
          {searched && !loading && !order && !error && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Order Not Found
              </h2>
              <p className="text-gray-500">
                We couldn&apos;t find an order with that number. Please check and try
                again.
              </p>
            </div>
          )}

          {/* Order Details */}
          {order && currentStatus && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${currentStatus.bgColor}`}>
                    <currentStatus.icon className={`w-6 h-6 ${currentStatus.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Order Status
                    </p>
                    <p className="text-xl font-bold text-[var(--color-text)]">
                      {currentStatus.label}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[var(--color-text-muted)]">Order Number</p>
                    <p className="font-medium text-[var(--color-text)]">
                      {order.order_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-muted)]">Order Date</p>
                    <p className="font-medium text-[var(--color-text)]">
                      {new Date(order.created_at).toLocaleDateString("en-BD", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {order.estimated_delivery && (
                    <div>
                      <p className="text-[var(--color-text-muted)]">
                        Estimated Delivery
                      </p>
                      <p className="font-medium text-[var(--color-text)]">
                        {new Date(order.estimated_delivery).toLocaleDateString(
                          "en-BD",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div>
                      <p className="text-[var(--color-text-muted)]">
                        Tracking Number
                      </p>
                      <p className="font-medium text-[var(--color-text)]">
                        {order.tracking_number}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
                <h3 className="font-semibold text-[var(--color-text)] mb-4">
                  Order Timeline
                </h3>
                <div className="space-y-4">
                  {order.timeline.map((event, index) => {
                    const config = statusConfig[event.status] || statusConfig.pending;
                    const isLast = index === order.timeline.length - 1;
                    return (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isLast ? config.bgColor : "bg-gray-100"
                            }`}
                          >
                            <config.icon
                              className={`w-4 h-4 ${
                                isLast ? config.color : "text-gray-400"
                              }`}
                            />
                          </div>
                          {index < order.timeline.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <p
                            className={`text-sm font-medium ${
                              isLast
                                ? "text-[var(--color-text)]"
                                : "text-[var(--color-text-muted)]"
                            }`}
                          >
                            {event.description}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {new Date(event.timestamp).toLocaleDateString("en-BD", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Items */}
              {order.items.length > 0 && (
                <div className="bg-white border border-[var(--color-border)] rounded-xl p-6">
                  <h3 className="font-semibold text-[var(--color-text)] mb-4">
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-[var(--color-border)]">
                    <p className="font-semibold text-[var(--color-text)]">Total</p>
                    <p className="font-bold text-lg text-[var(--color-text)]">
                      ৳{order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Contact Support */}
              <div className="bg-[var(--color-bg-alt)] rounded-xl p-6">
                <h3 className="font-semibold text-[var(--color-text)] mb-3">
                  Need Help?
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  If you have any questions about your order, feel free to contact
                  us.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="tel:+880****5678"
                    className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    +880 1712-345678
                  </a>
                  <a
                    href="mailto:support@rymos.com.bd"
                    className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    support@rymos.com.bd
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
