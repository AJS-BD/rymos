"use client";

import { useState } from "react";
import {
  CheckCircle,
  Package,
  Truck,
  Home,
  XCircle,
  Loader2,
} from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packing"
  | "shipping"
  | "delivered"
  | "cancelled";

export const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "packing",
  packing: "shipping",
  shipping: "delivered",
  delivered: null,
  cancelled: null,
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packing: "Packing",
  shipping: "Shipping",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  packing: "bg-purple-100 text-purple-700",
  shipping: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <CheckCircle className="w-3.5 h-3.5" />,
  confirmed: <CheckCircle className="w-3.5 h-3.5" />,
  packing: <Package className="w-3.5 h-3.5" />,
  shipping: <Truck className="w-3.5 h-3.5" />,
  delivered: <Home className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
};

const ACTION_BUTTONS: {
  target: OrderStatus;
  label: string;
  icon: React.ReactNode;
  color: string;
  fromStatuses: OrderStatus[];
}[] = [
  {
    target: "confirmed",
    label: "Confirm",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
    fromStatuses: ["pending"],
  },
  {
    target: "packing",
    label: "Pack",
    icon: <Package className="w-4 h-4" />,
    color: "text-purple-600 hover:text-purple-800 hover:bg-purple-50",
    fromStatuses: ["confirmed"],
  },
  {
    target: "shipping",
    label: "Ship",
    icon: <Truck className="w-4 h-4" />,
    color: "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50",
    fromStatuses: ["packing"],
  },
  {
    target: "delivered",
    label: "Deliver",
    icon: <Home className="w-4 h-4" />,
    color: "text-green-600 hover:text-green-800 hover:bg-green-50",
    fromStatuses: ["shipping"],
  },
  {
    target: "cancelled",
    label: "Cancel",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-600 hover:text-red-800 hover:bg-red-50",
    fromStatuses: ["pending", "confirmed", "packing"],
  },
];

interface OrderActionsProps {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusChange: (newStatus: OrderStatus) => void;
}

export default function OrderActions({
  orderId,
  currentStatus,
  onStatusChange,
}: OrderActionsProps) {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!isConfigured() || updating) return;

    setUpdating(true);
    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: now })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Insert status history record
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          from_status: currentStatus,
          to_status: newStatus,
          changed_by: "admin",
          note: `Status changed from ${currentStatus} to ${newStatus}`,
        });

      if (historyError) throw historyError;

      onStatusChange(newStatus);
    } catch (err) {
      console.error("Failed to update order status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const availableActions = ACTION_BUTTONS.filter((action) =>
    action.fromStatuses.includes(currentStatus)
  );

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {availableActions.map((action) => (
        <button
          key={action.target}
          onClick={() => handleStatusUpdate(action.target)}
          disabled={updating}
          className={`p-1.5 rounded transition-colors disabled:opacity-50 ${action.color}`}
          title={action.label}
        >
          {updating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            action.icon
          )}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_ICONS[status]}
      {STATUS_LABELS[status]}
    </span>
  );
}
