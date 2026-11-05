"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT, getErrorMessage } from "@/lib/utils";
import { useAdminAuth } from "@/context/admin-auth-context";
import {
  REFUND_METHODS,
  RETURN_STATUS_COLORS,
  RETURN_STATUS_LABELS,
  RefundMethodValue,
  RefundRecord,
  ReturnRequest,
  parseReturnDetails,
  refundMethodLabel,
  returnReasonLabel,
} from "@/lib/returns";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  RotateCcw,
  Banknote,
} from "lucide-react";

interface OrderInfo {
  id: string;
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminReturnDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { admin } = useAdminAuth();
  const [ret, setRet] = useState<ReturnRequest | null>(null);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [refund, setRefund] = useState<RefundRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionDone, setActionDone] = useState("");
  const [busy, setBusy] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState<RefundMethodValue>("cash");
  const [refundReference, setRefundReference] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadReturn() {
      if (!isConfigured()) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }
      try {
        const supabase = getSupabase();
        const { data, error: fetchError } = await supabase
          .from("returns")
          .select("*, orders(order_number, total), customers(full_name, phone)")
          .eq("id", id)
          .single();
        if (fetchError) throw fetchError;
        setRet(data as ReturnRequest);
        const { data: orderData } = await supabase
          .from("orders")
          .select("id, order_number, status, total, payment_method, created_at")
          .eq("id", data.order_id)
          .single();
        if (orderData) setOrder(orderData as OrderInfo);
        const { data: refundData } = await supabase
          .from("refunds")
          .select("*")
          .eq("return_id", id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (refundData && refundData.length > 0) {
          setRefund(refundData[0] as RefundRecord);
        }
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load return request."));
      } finally {
        setLoading(false);
      }
    }
    loadReturn();
  }, [id, refreshKey]);

  const details = parseReturnDetails(ret?.product_details);
  const items = details.items || [];
  const suggestedRefund = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Default the amount input to the returned items' value (or the recorded
  // refund, if one exists) until the admin edits it. Derived, not set in an
  // effect, so there are no cascading renders.
  const [amountTouched, setAmountTouched] = useState(false);
  const amountInput = amountTouched
    ? refundAmount
    : String(refund ? refund.amount : suggestedRefund);

  const canDecide = ret && (ret.status === "requested" || ret.status === "pending" || ret.status === "approved");
  const processedBy = admin && UUID_RE.test(admin.id) ? admin.id : null;

  const handleApproveAndRefund = async () => {
    if (!ret || !order) return;
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("Enter a refund amount greater than 0.");
      return;
    }
    if (amount > order.total) {
      setActionError(`Refund cannot exceed the order total of ${formatBDT(order.total)}.`);
      return;
    }
    setBusy(true);
    setActionError("");
    setActionDone("");
    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();
      // 1. Record the refund. Refunds are paid in store or on delivery —
      // cash / bKash / Nagad / Rocket / card. No online gateway is involved.
      const { error: refundError } = await supabase.from("refunds").insert({
        return_id: ret.id,
        order_id: ret.order_id,
        amount,
        method: refundMethod,
        status: "processed",
        reference: refundReference.trim() || null,
        processed_at: now,
        ...(processedBy ? { processed_by: processedBy } : {}),
      });
      if (refundError) throw refundError;
      // 2. Close the return as refunded.
      const { error: returnError } = await supabase
        .from("returns")
        .update({
          status: "completed",
          refund_amount: amount,
          resolution: "refund",
          processed_at: now,
          ...(processedBy ? { processed_by: processedBy } : {}),
        })
        .eq("id", ret.id);
      if (returnError) throw returnError;
      // 3. Mark the order as returned.
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "return", updated_at: now })
        .eq("id", ret.order_id);
      if (orderError) throw orderError;
      // 4. History trail (non-blocking).
      await supabase.from("order_status_history").insert({
        order_id: ret.order_id,
        from_status: order.status,
        to_status: "return",
        changed_by: "admin",
        note: `Return ${ret.id.slice(0, 8)} approved; refund ${formatBDT(amount)} via ${refundMethodLabel(refundMethod)}.`,
      });
      setActionDone(`Refund of ${formatBDT(amount)} via ${refundMethodLabel(refundMethod)} recorded. The return is now complete and the order is marked as returned.`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to record the refund."));
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!ret) return;
    setBusy(true);
    setActionError("");
    setActionDone("");
    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("returns")
        .update({
          status: "rejected",
          processed_at: now,
          product_details: {
            ...(ret.product_details && typeof ret.product_details === "object" ? ret.product_details : {}),
            admin_note: rejectNote.trim() || "Return request rejected by the shop.",
          },
          ...(processedBy ? { processed_by: processedBy } : {}),
        })
        .eq("id", ret.id);
      if (updateError) throw updateError;
      setActionDone("Return request rejected.");
      setShowReject(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to reject the return."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-text-muted)" }} />
      </div>
    );
  }

  if (error || !ret) {
    return (
      <div className="space-y-6">
        <Link href="/admin/returns" className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to returns
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error || "Return request not found."}
        </div>
      </div>
    );
  }

  const colors = RETURN_STATUS_COLORS[ret.status] || { background: "#f5f5f7", color: "#666" };

  return (
    <div className="space-y-6">
      <Link href="/admin/returns" className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to returns
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight flex items-center gap-2" style={{ color: "var(--color-text)" }}>
            <RotateCcw className="w-6 h-6" />
            Return {ret.orders?.order_number || ret.order_id.slice(0, 8)}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Requested {new Date(ret.created_at).toLocaleString("en-BD")} · {ret.customers?.full_name || "Unknown customer"}
            {ret.customers?.phone ? ` · ${ret.customers.phone}` : ""}
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{ background: colors.background, color: colors.color }}>
          {RETURN_STATUS_LABELS[ret.status] || ret.status}
        </span>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {actionError}
        </div>
      )}
      {actionDone && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {actionDone}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl p-5" style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Items to return
            </h2>
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #f5f5f7" }}>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.variant && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.variant}</p>}
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatBDT(item.price * item.quantity)}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{formatBDT(item.price)} x{item.quantity}</p>
                    </div>
                  </div>
                ))}
                <p className="text-sm pt-2">
                  <span style={{ color: "var(--color-text-muted)" }}>Returned items value: </span>
                  <span className="font-semibold">{formatBDT(suggestedRefund)}</span>
                  {order && (
                    <span style={{ color: "var(--color-text-muted)" }}> (order total {formatBDT(order.total)})</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No item breakdown was stored for this request
                {ret.quantity ? ` (${ret.quantity} item${ret.quantity > 1 ? "s" : ""} in total)` : ""}.
              </p>
            )}
            <div className="mt-4 space-y-1 text-sm">
              <p><span style={{ color: "var(--color-text-muted)" }}>Reason: </span>{returnReasonLabel(ret.reason)}</p>
              {(ret.notes || details.note) && (
                <p><span style={{ color: "var(--color-text-muted)" }}>Customer note: </span>{ret.notes || details.note}</p>
              )}
              {details.admin_note && (
                <p><span style={{ color: "var(--color-text-muted)" }}>Shop note: </span>{details.admin_note}</p>
              )}
            </div>
          </div>

          {refund && (
            <div className="rounded-2xl p-5" style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Refund recorded
              </h2>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span style={{ color: "var(--color-text-muted)" }}>Amount</span><span className="font-semibold">{formatBDT(refund.amount)}</span></p>
                <p className="flex justify-between"><span style={{ color: "var(--color-text-muted)" }}>Method</span><span>{refundMethodLabel(refund.method)}</span></p>
                <p className="flex justify-between"><span style={{ color: "var(--color-text-muted)" }}>Status</span><span className="capitalize">{refund.status}</span></p>
                {refund.reference && (
                  <p className="flex justify-between"><span style={{ color: "var(--color-text-muted)" }}>Reference / TrxID</span><span className="font-mono">{refund.reference}</span></p>
                )}
                <p className="flex justify-between"><span style={{ color: "var(--color-text-muted)" }}>Recorded</span><span>{new Date(refund.created_at).toLocaleString("en-BD")}</span></p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-5" style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}>
            <h2 className="font-semibold mb-3">Order</h2>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between"><span style={{ color: "var(--color-text-muted)" }}>Order #</span><Link href={`/admin/orders/${ret.order_id}`} className="font-medium hover:underline" style={{ color: "#0071E3" }}>{ret.orders?.order_number || ret.order_id.slice(0, 8)}</Link></p>
              {order && (
                <>
                  <p className="flex justify-between"><span style={{ color: "var(--color-text-muted)" }}>Order status</span><span className="capitalize">{order.status}</span></p>
                  <p className="flex justify-between"><span style={{ color: "var(--color-text-muted)" }}>Order total</span><span className="font-medium">{formatBDT(order.total)}</span></p>
                  <p className="flex justify-between"><span style={{ color: "var(--color-text-muted)" }}>Paid via</span><span className="capitalize">{order.payment_method}</span></p>
                </>
              )}
              {ret.refund_amount != null && (
                <p className="flex justify-between"><span style={{ color: "var(--color-text-muted)" }}>Refund amount</span><span className="font-medium">{formatBDT(ret.refund_amount)}</span></p>
              )}
            </div>
          </div>

          {canDecide && (
            <div className="rounded-2xl p-5" style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}>
              <h2 className="font-semibold mb-1">Approve &amp; refund</h2>
              <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
                Approving records the refund, marks the return as refunded and sets
                the order status to “return”. Refunds are paid in cash, or via
                bKash, Nagad, Rocket or card — in store or on delivery, never online.
              </p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="refund-amount" className="block text-xs font-medium mb-1">Refund amount (BDT)</label>
                  <input
                    id="refund-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={amountInput}
                    onChange={(e) => {
                      setRefundAmount(e.target.value);
                      setAmountTouched(true);
                    }}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ border: "1px solid #e5e5e7" }}
                  />
                </div>
                <div>
                  <label htmlFor="refund-method" className="block text-xs font-medium mb-1">Refund method</label>
                  <select
                    id="refund-method"
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as RefundMethodValue)}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ border: "1px solid #e5e5e7" }}
                  >
                    {REFUND_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="refund-reference" className="block text-xs font-medium mb-1">Reference / TrxID (optional)</label>
                  <input
                    id="refund-reference"
                    type="text"
                    value={refundReference}
                    onChange={(e) => setRefundReference(e.target.value)}
                    placeholder="bKash / Nagad / Rocket TrxID, or receipt no."
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ border: "1px solid #e5e5e7" }}
                  />
                </div>
                <button
                  onClick={handleApproveAndRefund}
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  <CheckCircle className="w-4 h-4" />
                  Approve &amp; record refund
                </button>
                {!showReject ? (
                  <button
                    onClick={() => setShowReject(true)}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject request
                  </button>
                ) : (
                  <div className="space-y-2 pt-1">
                    <label htmlFor="reject-note" className="block text-xs font-medium">Rejection note (shown to the customer)</label>
                    <textarea
                      id="reject-note"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      rows={2}
                      placeholder="e.g. Item was used and is outside the return window."
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ border: "1px solid #e5e5e7" }}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleReject} disabled={busy} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                        Confirm rejection
                      </button>
                      <button onClick={() => setShowReject(false)} disabled={busy} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {ret.status === "rejected" && (
            <div className="rounded-2xl p-5 bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 font-medium">This return was rejected.</p>
              {details.admin_note && <p className="text-sm text-red-600 mt-1">{details.admin_note}</p>}
            </div>
          )}
          {ret.status === "completed" && (
            <div className="rounded-2xl p-5 bg-green-50 border border-green-200">
              <p className="text-sm text-green-700 font-medium">This return is complete — the refund has been recorded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
