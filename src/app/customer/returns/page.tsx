"use client";

import { useState, useEffect } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT, getErrorMessage } from "@/lib/utils";
import {
  RETURN_STATUS_COLORS,
  RETURN_STATUS_LABELS,
  ReturnRequest,
  parseReturnDetails,
  returnReasonLabel,
} from "@/lib/returns";
import {
  RotateCcw,
  Calendar,
  Loader2,
  AlertCircle,
  Package,
} from "lucide-react";
import Link from "next/link";

export default function CustomerReturns() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReturns() {
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
          .from("returns")
          .select("*, orders(order_number, total)")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false });
        if (fetchError) throw fetchError;
        setReturns((data || []) as ReturnRequest[]);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load return requests."));
      } finally {
        setLoading(false);
      }
    }
    loadReturns();
  }, []);

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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Returns</h1>
            <p className="text-gray-500">{returns.length} return request{returns.length === 1 ? "" : "s"}</p>
          </div>
          <Link
            href="/customer/orders"
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Package className="w-4 h-4" />
            My Orders
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {returns.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">You haven&apos;t requested any returns yet.</p>
            <p className="text-sm text-gray-400 mb-4">
              Delivered orders can be returned from the order page. Read the{" "}
              <Link href="/returns" className="underline">returns policy</Link> for the time limits.
            </p>
            <Link
              href="/customer/orders"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              View my orders
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map((ret) => {
              const details = parseReturnDetails(ret.product_details);
              const items = details.items || [];
              const itemCount = items.reduce((sum, item) => sum + item.quantity, 0) || ret.quantity || 0;
              const colors = RETURN_STATUS_COLORS[ret.status] || { background: "#f5f5f7", color: "#666" };
              return (
                <div key={ret.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono font-medium text-gray-900 truncate">
                        {ret.orders?.order_number || ret.order_id.slice(0, 8)}
                      </span>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                        style={{ background: colors.background, color: colors.color }}
                      >
                        {RETURN_STATUS_LABELS[ret.status] || ret.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ret.created_at).toLocaleDateString("en-BD", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="text-gray-500">Reason: </span>
                      {returnReasonLabel(ret.reason)}
                    </p>
                    {items.length > 0 && (
                      <p>
                        <span className="text-gray-500">Items: </span>
                        {items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                      </p>
                    )}
                    <p>
                      <span className="text-gray-500">Items returned: </span>
                      {itemCount}
                      {ret.refund_amount != null && (
                        <>
                          {" · "}
                          <span className="text-gray-500">Refund: </span>
                          <span className="font-medium text-green-700">{formatBDT(ret.refund_amount)}</span>
                        </>
                      )}
                    </p>
                    {(ret.notes || details.note) && (
                      <p>
                        <span className="text-gray-500">Your note: </span>
                        {ret.notes || details.note}
                      </p>
                    )}
                    {details.admin_note && (
                      <p>
                        <span className="text-gray-500">Shop note: </span>
                        {details.admin_note}
                      </p>
                    )}
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/customer/orders/${ret.order_id}`}
                      className="text-sm text-black font-medium hover:underline"
                    >
                      View order →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Refunds are paid in cash, or via bKash, Nagad, Rocket or card — in store
          or on delivery. We do not process refunds online.
        </p>
      </div>
    </main>
  );
}
