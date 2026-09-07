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

export const STATUS_COLORS: Record<OrderStatus, { background: string; color: string }> = {
  pending: { background: "#fff8e1", color: "#f57f17" },
  confirmed: { background: "#e3f2fd", color: "#1565c0" },
  packing: { background: "#f3e5f5", color: "#7b1fa2" },
  shipping: { background: "#e8eaf6", color: "#283593" },
  delivered: { background: "#e8f5e9", color: "#2e7d32" },
  cancelled: { background: "#ffebee", color: "#c62828" },
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
  hoverBg: string;
  fromStatuses: OrderStatus[];
}[] = [
  {
    target: "confirmed",
    label: "Confirm",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "#1565c0",
    hoverBg: "#e3f2fd",
    fromStatuses: ["pending"],
  },
  {
    target: "packing",
    label: "Pack",
    icon: <Package className="w-4 h-4" />,
    color: "#7b1fa2",
    hoverBg: "#f3e5f5",
    fromStatuses: ["confirmed"],
  },
  {
    target: "shipping",
    label: "Ship",
    icon: <Truck className="w-4 h-4" />,
    color: "#283593",
    hoverBg: "#e8eaf6",
    fromStatuses: ["packing"],
  },
  {
    target: "delivered",
    label: "Deliver",
    icon: <Home className="w-4 h-4" />,
    color: "#2e7d32",
    hoverBg: "#e8f5e9",
    fromStatuses: ["shipping"],
  },
  {
    target: "cancelled",
    label: "Cancel",
    icon: <XCircle className="w-4 h-4" />,
    color: "#c62828",
    hoverBg: "#ffebee",
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

      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: now })
        .eq("id", orderId);

      if (updateError) throw updateError;

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
          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
          style={{ color: action.color }}
          onMouseEnter={(e) => (e.currentTarget.style.background = action.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
  const colors = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: colors.background,
        color: colors.color,
      }}
    >
      {STATUS_ICONS[status]}
      {STATUS_LABELS[status]}
    </span>
  );
}
