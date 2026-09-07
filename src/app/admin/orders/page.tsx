"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Package,
  ShoppingBag,
  Truck,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";
import Link from "next/link";
import OrderActions, {
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
  customers: {
    full_name: string;
    phone: string;
  };
}

const STATUS_FILTERS = [
  { value: "all", label: "All", icon: Filter },
  { value: "pending", label: "Pending", icon: Clock },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle },
  { value: "packing", label: "Packing", icon: Package },
  { value: "shipping", label: "Shipping", icon: Truck },
  { value: "delivered", label: "Delivered", icon: CheckCircle },
  { value: "cancelled", label: "Cancelled", icon: Filter },
];

const TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "pickup", label: "Pickup" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((order) => order.order_type === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.customers?.full_name?.toLowerCase().includes(query) ||
          order.customers?.phone?.includes(query) ||
          order.id.slice(0, 8).toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, typeFilter, searchQuery]);

  const fetchOrders = async () => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("orders")
        .select("*, customers(full_name, phone)")
        .order("created_at", { ascending: false });

      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const getStatusCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      packing: orders.filter((o) => o.status === "packing").length,
      shipping: orders.filter((o) => o.status === "shipping").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  };

  const getOrderItemCount = (items: OrderItem[]) => {
    return items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-text-muted)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
          Orders
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{orders.length} orders total</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5"
            style={{
              background:
                statusFilter === filter.value ? "var(--color-text)" : "var(--color-bg)",
              color:
                statusFilter === filter.value ? "white" : "var(--color-text)",
              border: `1px solid ${statusFilter === filter.value ? "var(--color-text)" : "#e5e5e7"}`,
            }}
          >
            <filter.icon className="w-3.5 h-3.5" />
            {filter.label}
            <span className="ml-1 text-xs opacity-70">
              ({statusCounts[filter.value as keyof typeof statusCounts]})
            </span>
          </button>
        ))}
      </div>

      {/* Type Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer name, or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: "var(--color-bg)",
              border: "1px solid #e5e5e7",
              color: "var(--color-text)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0071E3";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e5e5e7";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        <div className="flex gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
              style={{
                background: typeFilter === filter.value ? "var(--color-text)" : "var(--color-bg)",
                color: typeFilter === filter.value ? "white" : "var(--color-text)",
                border: `1px solid ${typeFilter === filter.value ? "var(--color-text)" : "#e5e5e7"}`,
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
      >
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBag
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: "var(--color-text-muted)" }}
            />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {orders.length === 0
                ? "No orders yet"
                : "No orders match your filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  {["Order #", "Customer", "Items", "Type", "Total", "Status", "Date", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                        style={{
                          color: "var(--color-text-muted)",
                          borderBottom: "1px solid #e5e5e7",
                        }}
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    style={{ borderBottom: "1px solid #f5f5f7" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-3.5 text-[13px] font-medium">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="hover:underline"
                        style={{ color: "#0071E3" }}
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-[13px]">
                      <p className="font-medium" style={{ color: "var(--color-text)" }}>
                        {order.customers?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {order.customers?.phone}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-[13px]">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {getOrderItemCount(order.items)} items
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] capitalize">
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{
                          background:
                            order.order_type === "express"
                              ? "#fff3e0"
                              : order.order_type === "pickup"
                              ? "#e0f2f1"
                              : "#f5f5f7",
                          color:
                            order.order_type === "express"
                              ? "#e65100"
                              : order.order_type === "pickup"
                              ? "#00695c"
                              : "var(--color-text-muted)",
                        }}
                      >
                        {order.order_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium" style={{ color: "var(--color-text)" }}>
                      {formatBDT(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-[13px] whitespace-nowrap"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                          title="View details"
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <OrderActions
                          orderId={order.id}
                          currentStatus={order.status}
                          onStatusChange={(newStatus) =>
                            handleStatusChange(order.id, newStatus)
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
