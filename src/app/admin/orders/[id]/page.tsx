"use client";

import { useState, useEffect, use, useCallback } from "react";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  User,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  Hash,
} from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";
import Link from "next/link";
import {
  StatusBadge,
  OrderStatus,
  STATUS_LABELS,
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
  payment_method: string;
  shipping_address: {
    full_name?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    area?: string;
    postal_code?: string;
  } | null;
  tracking_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers: {
    full_name: string;
    phone: string;
    email?: string;
    address?: string;
  };
}

export default function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [showTrackingForm, setShowTrackingForm] = useState(false);

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
        .select("*, customers(full_name, phone, email, address)")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      setOrder(data);
      setTrackingInput(data.tracking_info || "");
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
        .order("changed_at", { ascending: false });

      setStatusHistory(data || []);
    } catch (err) {
      console.error("Failed to fetch status history:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    fetchStatusHistory();
  }, [fetchOrder, fetchStatusHistory]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order || saving) return;

    setSaving(true);
    setError("");

    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: now })
        .eq("id", order.id);

      if (updateError) throw updateError;

      // Insert status history record
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: order.id,
          from_status: order.status,
          to_status: newStatus,
          changed_by: "admin",
          note: `Status changed from ${order.status} to ${newStatus}`,
        });

      if (historyError) throw historyError;

      setOrder((prev) =>
        prev ? { ...prev, status: newStatus, updated_at: now } : null
      );
      fetchStatusHistory();
    } catch (err: any) {
      setError(err.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!order) return;

    setSaving(true);
    setError("");

    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("orders")
        .update({ tracking_info: trackingInput, updated_at: now })
        .eq("id", order.id);

      if (updateError) throw updateError;

      setOrder((prev) =>
        prev
          ? { ...prev, tracking_info: trackingInput, updated_at: now }
          : null
      );
      setShowTrackingForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to save tracking info.");
    } finally {
      setSaving(false);
    }
  };

  const getAvailableActions = (): {
    status: OrderStatus;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] => {
    if (!order) return [];

    const actions: {
      status: OrderStatus;
      label: string;
      icon: React.ReactNode;
      color: string;
    }[] = [];

    switch (order.status) {
      case "pending":
        actions.push(
          {
            status: "confirmed",
            label: "Confirm Order",
            icon: <CheckCircle className="w-4 h-4" />,
            color: "bg-blue-600 hover:bg-blue-700",
          },
          {
            status: "cancelled",
            label: "Cancel Order",
            icon: <XCircle className="w-4 h-4" />,
            color: "bg-red-600 hover:bg-red-700",
          }
        );
        break;
      case "confirmed":
        actions.push(
          {
            status: "packing",
            label: "Start Packing",
            icon: <Package className="w-4 h-4" />,
            color: "bg-purple-600 hover:bg-purple-700",
          },
          {
            status: "cancelled",
            label: "Cancel Order",
            icon: <XCircle className="w-4 h-4" />,
            color: "bg-red-600 hover:bg-red-700",
          }
        );
        break;
      case "packing":
        actions.push(
          {
            status: "shipping",
            label: "Ship Order",
            icon: <Truck className="w-4 h-4" />,
            color: "bg-indigo-600 hover:bg-indigo-700",
          },
          {
            status: "cancelled",
            label: "Cancel Order",
            icon: <XCircle className="w-4 h-4" />,
            color: "bg-red-600 hover:bg-red-700",
          }
        );
        break;
      case "shipping":
        actions.push({
          status: "delivered",
          label: "Mark Delivered",
          icon: <CheckCircle className="w-4 h-4" />,
          color: "bg-green-600 hover:bg-green-700",
        });
        break;
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Order not found.</p>
        <Link
          href="/admin/orders"
          className="text-black font-medium hover:underline mt-2 inline-block"
        >
          ← Back to orders
        </Link>
      </div>
    );
  }

  const availableActions = getAvailableActions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/orders"
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
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      {availableActions.length > 0 && (
        <div className="flex items-center gap-3 bg-white rounded-lg border p-4">
          {availableActions.map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusUpdate(action.status)}
              disabled={saving}
              className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 ${action.color}`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                action.icon
              )}
              {action.label}
            </button>
          ))}
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
                  <div className="flex justify-between text-sm font-semibold">
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
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Status History
            </h3>
            {statusHistory.length > 0 ? (
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
                        <span className="text-sm font-medium capitalize">
                          {entry.to_status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(entry.changed_at).toLocaleString()} by{" "}
                        {entry.changed_by}
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
            ) : (
              <p className="text-gray-500 text-sm">No status history yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium">
                  {order.customers?.full_name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{order.customers?.phone}</span>
              </div>
              {order.customers?.email && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">@</span>
                  <span>{order.customers.email}</span>
                </div>
              )}
            </div>
          </div>

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
                {order.shipping_address.address_line1 && (
                  <p className="text-gray-600">
                    {order.shipping_address.address_line1}
                  </p>
                )}
                {order.shipping_address.address_line2 && (
                  <p className="text-gray-600">
                    {order.shipping_address.address_line2}
                  </p>
                )}
                {(order.shipping_address.city ||
                  order.shipping_address.area) && (
                  <p className="text-gray-600">
                    {[order.shipping_address.area, order.shipping_address.city]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {order.shipping_address.postal_code && (
                  <p className="text-gray-600">
                    {order.shipping_address.postal_code}
                  </p>
                )}
                {order.shipping_address.phone && (
                  <p className="text-gray-600 flex items-center gap-1.5 mt-2">
                    <Phone className="w-3.5 h-3.5" />
                    {order.shipping_address.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No shipping address.</p>
            )}
          </div>

          {/* Payment & Order Info */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Order Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Type</span>
                <span className="capitalize font-medium">{order.order_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                <span className="capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatBDT(order.subtotal)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <span>Total</span>
                <span>{formatBDT(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Tracking */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Tracking
            </h3>
            {showTrackingForm ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Enter tracking number..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTracking}
                    disabled={saving}
                    className="px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    onClick={() => setShowTrackingForm(false)}
                    className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {order.tracking_info ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {order.tracking_info}
                    </span>
                    <button
                      onClick={() => setShowTrackingForm(true)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTrackingForm(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Add tracking number
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
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
  );
}
