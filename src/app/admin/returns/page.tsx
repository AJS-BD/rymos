"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Eye, RotateCcw, Loader2, Package } from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";
import {
  RETURN_STATUS_COLORS,
  RETURN_STATUS_LABELS,
  ReturnRequest,
  parseReturnDetails,
  returnReasonLabel,
} from "@/lib/returns";
import Link from "next/link";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Refunded" },
];

export default function AdminReturns() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadReturns() {
      if (!isConfigured()) {
        setLoading(false);
        return;
      }
      try {
        const supabase = getSupabase();
        const { data } = await supabase
          .from("returns")
          .select("*, orders(order_number, total), customers(full_name, phone)")
          .order("created_at", { ascending: false });
        setReturns((data || []) as ReturnRequest[]);
      } catch (err) {
        console.error("Failed to fetch returns:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReturns();
  }, []);

  const filteredReturns = useMemo(() => {
    let filtered = returns;
    if (statusFilter !== "all") {
      filtered = filtered.filter((ret) => {
        // 'requested' tab also covers the legacy 'pending' status.
        if (statusFilter === "requested") return ret.status === "requested" || ret.status === "pending";
        return ret.status === statusFilter;
      });
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ret) =>
          ret.orders?.order_number?.toLowerCase().includes(query) ||
          ret.customers?.full_name?.toLowerCase().includes(query) ||
          ret.customers?.phone?.includes(query) ||
          ret.id.slice(0, 8).toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [returns, statusFilter, searchQuery]);

  const openCount = returns.filter(
    (r) => r.status === "requested" || r.status === "pending"
  ).length;

  const getStatusCounts = () => ({
    all: returns.length,
    requested: openCount,
    approved: returns.filter((r) => r.status === "approved").length,
    rejected: returns.filter((r) => r.status === "rejected").length,
    completed: returns.filter((r) => r.status === "completed").length,
  });
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
          Returns &amp; Refunds
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          {returns.length} return requests total · {openCount} waiting for review
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5"
            style={{
              background: statusFilter === filter.value ? "var(--color-text)" : "var(--color-bg)",
              color: statusFilter === filter.value ? "white" : "var(--color-text)",
              border: `1px solid ${statusFilter === filter.value ? "var(--color-text)" : "#e5e5e7"}`,
            }}
          >
            {filter.label}
            <span className="ml-1 text-xs opacity-70">
              ({statusCounts[filter.value as keyof typeof statusCounts]})
            </span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order #, customer name, or phone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
          style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7", color: "var(--color-text)" }}
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

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}>
        {filteredReturns.length === 0 ? (
          <div className="p-8 text-center">
            <RotateCcw className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {returns.length === 0 ? "No return requests yet" : "No returns match your filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr>
                  {["Order #", "Customer", "Reason", "Items", "Refund", "Status", "Date", "Actions"].map((header) => (
                    <th key={header} className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((ret) => {
                  const details = parseReturnDetails(ret.product_details);
                  const items = details.items || [];
                  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0) || ret.quantity || 0;
                  const colors = RETURN_STATUS_COLORS[ret.status] || { background: "#f5f5f7", color: "#666" };
                  return (
                    <tr key={ret.id} style={{ borderBottom: "1px solid #f5f5f7" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-5 py-3.5 text-[13px] font-medium">
                        <Link href={`/admin/returns/${ret.id}`} className="hover:underline" style={{ color: "#0071E3" }}>
                          {ret.orders?.order_number || ret.order_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-[13px]">
                        <p className="font-medium" style={{ color: "var(--color-text)" }}>
                          {ret.customers?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {ret.customers?.phone}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-[13px]" style={{ color: "var(--color-text)" }}>
                        {returnReasonLabel(ret.reason)}
                      </td>
                      <td className="px-5 py-3.5 text-[13px]">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
                          <span style={{ color: "var(--color-text-muted)" }}>{itemCount} items</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-medium" style={{ color: "var(--color-text)" }}>
                        {ret.refund_amount != null ? formatBDT(ret.refund_amount) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: colors.background, color: colors.color }}>
                          {RETURN_STATUS_LABELS[ret.status] || ret.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(ret.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/returns/${ret.id}`} className="p-1.5 rounded-lg transition-colors inline-block" style={{ color: "var(--color-text-muted)" }} title="View details" onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
