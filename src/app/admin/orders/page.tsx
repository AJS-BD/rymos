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
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500">{orders.length} orders total</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === filter.value
                ? "bg-black text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            <filter.icon className="w-3.5 h-3.5" />
            {filter.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({statusCounts[filter.value as keyof typeof statusCounts]})
            </span>
          </button>
        ))}
      </div>

      {/* Type Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer name, or phone..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div className="flex gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === filter.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {orders.length === 0
                ? "No orders yet"
                : "No orders match your filters"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Order #
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Items
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Total
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium">
                      {order.customers?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customers?.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                      <span>{getOrderItemCount(order.items)} items</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        order.order_type === "express"
                          ? "bg-orange-100 text-orange-700"
                          : order.order_type === "pickup"
                          ? "bg-teal-100 text-teal-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.order_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatBDT(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
                        title="View details"
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
        )}
      </div>
    </div>
  );
}
