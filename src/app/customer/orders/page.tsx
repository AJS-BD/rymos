"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";
import {
  Package,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import {
  StatusBadge,
  OrderStatus,
} from "@/components/admin/order-actions";

interface OrderItem {
  product_id?: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
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
  shipping_address: any;
  tracking_info: string | null;
  created_at: string;
  updated_at: string;
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    const customerId = localStorage.getItem("rymos_customer_id");
    if (!customerId) {
      setError("No customer ID found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setOrders(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getOrderItemCount = (items: OrderItem[]) => {
    return items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
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

  if (!isConfigured()) {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Supabase is not configured. Please check environment variables.
            </p>
          </div>
        </main>
    );
  }

  return (
    <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-500">{orders.length} orders placed</p>
          </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/customer/orders/${order.id}`}
              className="block bg-white rounded-xl border p-4 hover:border-gray-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-medium text-gray-900">
                      {order.order_number}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.created_at).toLocaleDateString("en-BD", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {getOrderItemCount(order.items)} items
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="font-semibold text-gray-900">
                    {formatBDT(order.total)}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
        </div>
      </main>
  );
}
