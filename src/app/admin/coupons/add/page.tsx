"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, ArrowLeft, Save } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function AddCoupon() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    min_order_amount: "",
    max_discount: "",
    usage_limit: "",
    starts_at: "",
    expires_at: "",
    is_active: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("coupons").insert([
        {
          code: formData.code.toUpperCase().trim(),
          description: formData.description || null,
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value) || 0,
          min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
          max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
          usage_count: 0,
          starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : new Date().toISOString(),
          expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: formData.is_active,
        },
      ]);

      if (error) throw error;

      setMessage({ type: "success", text: "Coupon created successfully!" });
      setTimeout(() => {
        router.push("/admin/coupons");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to create coupon" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/coupons" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Coupon</h1>
          <p className="text-gray-500">Create a new discount coupon</p>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
            <input
              type="text"
              name="code"
              required
              value={formData.code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black uppercase font-mono"
              placeholder="e.g., SAVE20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., Summer sale discount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
            <select
              name="discount_type"
              value={formData.discount_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (৳)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value * {formData.discount_type === "percentage" ? "(%)" : "(৳)"}
            </label>
            <input
              type="number"
              name="discount_value"
              min="0"
              step={formData.discount_type === "percentage" ? "1" : "0.01"}
              required
              value={formData.discount_value}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder={formData.discount_type === "percentage" ? "20" : "500"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (৳)</label>
            <input
              type="number"
              name="min_order_amount"
              min="0"
              step="0.01"
              value={formData.min_order_amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., 1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (৳)</label>
            <input
              type="number"
              name="max_discount"
              min="0"
              step="0.01"
              value={formData.max_discount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., 2000 (for percentage coupons)"
            />
            <p className="text-xs text-gray-500 mt-1">Only applicable for percentage discounts</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
            <input
              type="number"
              name="usage_limit"
              min="1"
              value={formData.usage_limit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., 100"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited usage</p>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Active</span>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Validity Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="datetime-local"
                name="starts_at"
                value={formData.starts_at}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for immediate start</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="datetime-local"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for 30 days from now</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {loading ? "Creating..." : "Create Coupon"}
          </button>
          <Link
            href="/admin/coupons"
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
