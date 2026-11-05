"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT, getErrorMessage } from "@/lib/utils";
import {
  RETURN_REASONS,
  ReturnReasonValue,
  isOpenReturnStatus,
} from "@/lib/returns";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Package,
  RotateCcw,
  Minus,
  Plus,
} from "lucide-react";

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
  customer_id: string | null;
  status: string;
  items: OrderItem[];
  total: number;
  created_at: string;
}

export default function RequestReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [existingReturn, setExistingReturn] = useState(false);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [reason, setReason] = useState<ReturnReasonValue>("damaged");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function load() {
      if (!isConfigured()) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }
      const storedCustomerId = localStorage.getItem("rymos_customer_id");
      if (!storedCustomerId) {
        setError("Please log in to request a return.");
        setLoading(false);
        return;
      }
      setCustomerId(storedCustomerId);
      try {
        const supabase = getSupabase();
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("id, order_number, customer_id, status, items, total, created_at")
          .eq("id", orderId)
          .single();
        if (orderError) throw orderError;
        if (!orderData) {
          setError("Order not found.");
          return;
        }
        if (orderData.customer_id && orderData.customer_id !== storedCustomerId) {
          setError("This order does not belong to your account.");
          return;
        }
        setOrder(orderData as Order);
        // Pre-select every item at its full ordered quantity.
        const initial: Record<number, number> = {};
        (orderData.items || []).forEach((_: OrderItem, index: number) => {
          initial[index] = orderData.items[index].quantity;
        });
        setSelected(initial);

        const { data: prior } = await supabase
          .from("returns")
          .select("id, status")
          .eq("order_id", orderId)
          .eq("customer_id", storedCustomerId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (prior && prior.length > 0 && isOpenReturnStatus(prior[0].status)) {
          setExistingReturn(true);
        }
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load order."));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  const pickedItems = (order?.items || [])
    .map((item, index) => ({ item, index, qty: selected[index] || 0 }))
    .filter((entry) => entry.qty > 0);
  const pickedTotal = pickedItems.reduce(
    (sum, entry) => sum + entry.item.price * entry.qty,
    0
  );
  const pickedQty = pickedItems.reduce((sum, entry) => sum + entry.qty, 0);

  const setQty = (index: number, qty: number) => {
    const max = order?.items[index]?.quantity || 0;
    setSelected((prev) => ({
      ...prev,
      [index]: Math.max(0, Math.min(max, qty)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !customerId || pickedItems.length === 0) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const supabase = getSupabase();
      const reasonLabel =
        RETURN_REASONS.find((r) => r.value === reason)?.label || reason;
      const { error: insertError } = await supabase.from("returns").insert({
        order_id: order.id,
        customer_id: customerId,
        reason,
        quantity: pickedQty,
        notes: note.trim() || null,
        product_details: {
          items: pickedItems.map((entry) => ({
            product_id: entry.item.product_id,
            name: entry.item.name,
            variant: entry.item.variant,
            quantity: entry.qty,
            price: entry.item.price,
          })),
          note: note.trim() || undefined,
          reason_label: reasonLabel,
        },
        refund_amount: null,
        status: "requested",
      });
      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to submit the return request.");
      setSubmitError(
        `${message} If this mentions a check constraint or a missing column, the shop still needs to apply the returns migration (supabase/migrations/20261105_returns.sql) in Supabase — please contact support.`
      );
    } finally {
      setSubmitting(false);
    }
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

  if (!isConfigured() || error || !order) {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{error || "Order not found."}</p>
          <Link href="/customer/orders" className="text-black font-medium hover:underline mt-2 inline-block">
            ← Back to orders
          </Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Return requested</h1>
          <p className="text-gray-500 mb-2">
            Your return request for order {order.order_number} has been sent. Our
            team will review it within 24 hours.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If approved, your refund will be paid in cash, or via bKash, Nagad,
            Rocket or card — in store or on delivery. We never take or send
            refunds through an online payment gateway.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/customer/returns" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
              Track my returns
            </Link>
            <Link href={`/customer/orders/${order.id}`} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Back to order
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (order.status !== "delivered") {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Return not available yet</h1>
          <p className="text-gray-500 mb-6">
            Returns can only be requested for delivered orders. Order{" "}
            {order.order_number} is currently “{order.status}”.
          </p>
          <Link href={`/customer/orders/${order.id}`} className="text-black font-medium hover:underline">
            ← Back to order
          </Link>
        </div>
      </main>
    );
  }

  if (existingReturn) {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Return already requested</h1>
          <p className="text-gray-500 mb-6">
            You already have an open return request for order {order.order_number}.
          </p>
          <Link href="/customer/returns" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
            View my returns
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 pt-16 sm:pt-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-start gap-4 mb-6">
          <Link href={`/customer/orders/${order.id}`} className="mt-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request a return</h1>
            <p className="text-gray-500">
              Order {order.order_number} · delivered{" "}
              {new Date(order.created_at).toLocaleDateString("en-BD", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Items to return
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose the items and quantities you want to return.
            </p>
            <div className="space-y-3">
              {order.items.map((item, index) => {
                const qty = selected[index] || 0;
                return (
                  <div key={index} className="flex items-center justify-between gap-3 py-3 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.variant && <p className="text-xs text-gray-500">{item.variant}</p>}
                      <p className="text-xs text-gray-500">
                        {formatBDT(item.price)} each · ordered x{item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="Decrease quantity" onClick={() => setQty(index, qty - 1)} disabled={qty <= 0} className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{qty}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => setQty(index, qty + 1)} disabled={qty >= item.quantity} className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {pickedItems.length > 0 && (
              <p className="text-sm text-gray-600 mt-4">
                Returning {pickedQty} item{pickedQty > 1 ? "s" : ""} · estimated refund value {formatBDT(pickedTotal)} (final amount is confirmed by the shop after inspection).
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border p-5 space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-900 mb-1">
                Reason for return
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReturnReasonValue)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-900 mb-1">
                Note (optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Tell us a little more — e.g. what is wrong with the item, or when you would like to drop it off."
                className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <p className="text-xs text-gray-500">
              Refunds are paid in cash, or via bKash, Nagad, Rocket or card — in
              store or on delivery. We do not process refunds online.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || pickedItems.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit return request
            </button>
            <button
              type="button"
              onClick={() => router.push(`/customer/orders/${order.id}`)}
              className="px-5 py-3 border rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          {pickedItems.length === 0 && (
            <p className="text-sm text-red-600">Select at least one item to return.</p>
          )}
        </form>
      </div>
    </main>
  );
}
