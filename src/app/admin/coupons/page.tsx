"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tag, Trash2, Plus, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

type FilterType = "all" | "active" | "expired";

export default function AdminCoupons() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    const supabase = getSupabase();
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCoupons(data as Coupon[]);
    setLoading(false);
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("coupons").delete().eq("id", deleteId);
      if (error) throw error;
      setCoupons((prev) => prev.filter((c) => c.id !== deleteId));
      setMessage({ type: "success", text: "Coupon deleted successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to delete coupon" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const isExpired = (coupon: Coupon) => {
    return new Date(coupon.expires_at) < new Date();
  };

  const isActive = (coupon: Coupon) => {
    const now = new Date();
    return coupon.is_active &&
      new Date(coupon.starts_at) <= now &&
      new Date(coupon.expires_at) >= now;
  };

  const filteredCoupons = coupons.filter((coupon) => {
    if (filter === "active") return isActive(coupon);
    if (filter === "expired") return isExpired(coupon) || !coupon.is_active;
    return true;
  });

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: "Inactive", color: "bg-gray-100 text-gray-700", icon: XCircle };
    if (isExpired(coupon)) return { label: "Expired", color: "bg-red-100 text-red-700", icon: XCircle };
    if (new Date(coupon.starts_at) > new Date()) return { label: "Scheduled", color: "bg-yellow-100 text-yellow-700", icon: Clock };
    return { label: "Active", color: "bg-green-100 text-green-700", icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Deals</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading coupons...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Coupon</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this coupon? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Deals</h1>
          <p className="text-gray-500">{coupons.length} coupons total</p>
        </div>
        <Link
          href="/admin/coupons/add"
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Coupon
        </Link>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "active", "expired"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-black text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "all" && ` (${coupons.length})`}
            {f === "active" && ` (${coupons.filter(isActive).length})`}
            {f === "expired" && ` (${coupons.filter((c) => isExpired(c) || !c.is_active).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Code</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Discount</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Min Order</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Usage</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Validity</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No coupons found. Add your first coupon to get started.
                </td>
              </tr>
            ) : (
              filteredCoupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                const StatusIcon = status.icon;
                return (
                  <tr key={coupon.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Tag className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm font-mono">{coupon.code}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{coupon.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}%`
                          : `৳${coupon.discount_value}`}
                      </span>
                      {coupon.max_discount && (
                        <p className="text-xs text-gray-500">Max: ৳{coupon.max_discount}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {coupon.min_order_amount ? `৳${coupon.min_order_amount}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {coupon.usage_count}
                      {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600">
                        {new Date(coupon.starts_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        to {new Date(coupon.expires_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteId(coupon.id)}
                        className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
