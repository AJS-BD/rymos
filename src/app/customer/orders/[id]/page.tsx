"use client";

import { useState, useEffect, useCallback, use } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Phone,
  Hash,
} from "lucide-react";
import {
  StatusBadge,
  STATUS_LABELS,
  STATUS_COLORS,
  OrderStatus,
} from "@/components/admin/order-actions";

interface OrderItem {
  product_id?: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

interface StatusHistoryEntry {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  note: string | null;
  changed_at: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  order_type: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  discount: number;
  payment_method: string;
  shipping_address: {
    full_name?: string;
    phone?: string;
    address?: string;
    type?: string;
  } | null;
  tracking_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "packing",
  "shipping",
  "delivered",
];

export default function CustomerOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    if (!isConfigured()) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      setOrder(data);
    } catch (err: any) {
      setError(err.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchStatusHistory = useCallback(async () => {
    if (!isConfigured()) return;

    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", id)
        .order("changed_at", { ascending: true });

      setStatusHistory(data || []);
    } catch (err) {
      console.error("Failed to fetch status history:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    fetchStatusHistory();
  }, [fetchOrder, fetchStatusHistory]);

  const getStepStatus = (step: OrderStatus): "completed" | "current" | "upcoming" | "cancelled" => {
    if (!order) return "upcoming";
    if (order.status === "cancelled") {
      if (step === "pending") return "completed";
      return "cancelled";
    }
    const currentIndex = STATUS_STEPS.indexOf(order.status);
    const stepIndex = STATUS_STEPS.indexOf(step);
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  if (loading) {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{error || "Order not found."}</p>
            <Link
              href="/customer/orders"
              className="text-black font-medium hover:underline mt-2 inline-block"
            >
              ← Back to orders
            </Link>
          </div>
        </main>
    );
  }

  return (
    <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <Link
            href="/customer/orders"
            className="mt-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {order.order_number}
            </h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              {new Date(order.created_at).toLocaleDateString("en-BD", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Status Timeline */}
      {order.status !== "cancelled" && (
        <div className="bg-white rounded-xl border p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Order Progress
          </h3>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const stepStatus = getStepStatus(step);
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        stepStatus === "completed"
                          ? "bg-green-500 text-white"
                          : stepStatus === "current"
                          ? "bg-black text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {stepStatus === "completed" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : stepStatus === "current" ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1.5 capitalize ${
                        stepStatus === "current"
                          ? "font-medium text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        stepStatus === "completed"
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled State */}
      {order.status === "cancelled" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">This order has been cancelled</p>
            <p className="text-sm text-red-600">
              If you have questions, please contact support.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Order Items ({order.items?.length || 0})
            </h3>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.variant && (
                          <p className="text-xs text-gray-500">{item.variant}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatBDT(item.price)}
                      </p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-3 space-y-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatBDT(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Discount</span>
                      <span className="text-green-600">
                        -{formatBDT(order.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span>
                    <span>{formatBDT(order.total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No items in this order.</p>
            )}
          </div>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Status History
              </h3>
              <div className="space-y-4">
                {statusHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {entry.from_status && (
                          <>
                            <span className="text-xs text-gray-500 capitalize">
                              {entry.from_status}
                            </span>
                            <span className="text-gray-400">→</span>
                          </>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[entry.to_status as OrderStatus] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {STATUS_LABELS[entry.to_status as OrderStatus] ||
                            entry.to_status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(entry.changed_at).toLocaleString()}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-gray-600 mt-1">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Shipping Address
            </h3>
            {order.shipping_address ? (
              <div className="text-sm space-y-1">
                {order.shipping_address.full_name && (
                  <p className="font-medium">
                    {order.shipping_address.full_name}
                  </p>
                )}
                {order.shipping_address.address && (
                  <p className="text-gray-600">
                    {order.shipping_address.address}
                  </p>
                )}
                {order.shipping_address.phone && (
                  <p className="text-gray-600 flex items-center gap-1.5 mt-2">
                    <Phone className="w-3.5 h-3.5" />
                    {order.shipping_address.phone}
                  </p>
                )}
              </div>
            ) : order.order_type === "shop_pickup" ? (
              <p className="text-sm text-gray-600">
                Shop pickup - no shipping address required.
              </p>
            ) : (
              <p className="text-gray-500 text-sm">No shipping address.</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="capitalize font-medium">
                  {order.payment_method === "cod"
                    ? "Cash on Delivery"
                    : order.payment_method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Order Type</span>
                <span className="capitalize font-medium">
                  {order.order_type === "shop_pickup"
                    ? "Shop Pickup"
                    : order.order_type}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <span>Total</span>
                <span>{formatBDT(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Tracking */}
          {order.tracking_info && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Tracking
              </h3>
              <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded">
                {order.tracking_info}
              </p>
            </div>
          )}

          {/* Order ID */}
          <div className="bg-gray-50 rounded-xl border p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Hash className="w-3.5 h-3.5" />
              <span className="font-mono">{order.id}</span>
            </div>
          </div>
        </div>
      </div>
        </div>
      </main>
  );
}
