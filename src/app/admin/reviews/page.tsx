"use client";

import { useState, useEffect } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import {
  Star,
  Trash2,
  Check,
  X,
  Plus,
  Filter,
  AlertTriangle,
  Loader2,
  MessageSquare,
  CheckCircle,
  XCircle,
  ShieldCheck,
  User,
} from "lucide-react";

interface Review {
  id: number;
  product_id: number;
  customer_name: string;
  rating: number;
  content: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  admin_seed: boolean;
  created_at: string;
  products?: {
    name: string;
  };
}

interface Product {
  id: number;
  name: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterVerified, setFilterVerified] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Seed form
  const [showSeedForm, setShowSeedForm] = useState(false);
  const [seedProductId, setSeedProductId] = useState<string>("");
  const [seedCustomerName, setSeedCustomerName] = useState("");
  const [seedRating, setSeedRating] = useState<string>("5");
  const [seedContent, setSeedContent] = useState("");
  const [seedVerified, setSeedVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reviews, filterProduct, filterRating, filterVerified]);

  function applyFilters() {
    let filtered = [...reviews];

    if (filterProduct !== "all") {
      filtered = filtered.filter((r) => r.product_id === parseInt(filterProduct));
    }
    if (filterRating !== "all") {
      filtered = filtered.filter((r) => r.rating === parseInt(filterRating));
    }
    if (filterVerified === "verified") {
      filtered = filtered.filter((r) => r.is_verified_purchase);
    } else if (filterVerified === "unverified") {
      filtered = filtered.filter((r) => !r.is_verified_purchase);
    }

    setFilteredReviews(filtered);
  }

  async function fetchReviews() {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("reviews")
        .select("*, products(name)")
        .order("created_at", { ascending: false });
      if (data) setReviews(data);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    if (!isConfigured()) return;
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("products")
        .select("id, name")
        .order("name", { ascending: true });
      if (data) setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }

  const handleToggleApprove = async (reviewId: number, currentStatus: boolean) => {
    setUpdating(reviewId);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: !currentStatus })
        .eq("id", reviewId);
      if (error) throw error;
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_approved: !currentStatus } : r))
      );
      setMessage({ type: "success", text: `Review ${!currentStatus ? "approved" : "rejected"} successfully!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to update review" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("reviews").delete().eq("id", deleteId);
      if (error) throw error;
      setReviews((prev) => prev.filter((r) => r.id !== deleteId));
      setMessage({ type: "success", text: "Review deleted successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to delete review" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleSeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedProductId || !seedCustomerName || !seedContent) {
      setMessage({ type: "error", text: "Please fill all required fields." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setSubmitting(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("reviews").insert({
        product_id: parseInt(seedProductId),
        customer_name: seedCustomerName,
        rating: parseInt(seedRating),
        content: seedContent,
        is_verified_purchase: seedVerified,
        is_approved: true,
        admin_seed: true,
      });
      if (error) throw error;

      // Reset form
      setSeedProductId("");
      setSeedCustomerName("");
      setSeedRating("5");
      setSeedContent("");
      setSeedVerified(false);
      setShowSeedForm(false);
      setMessage({ type: "success", text: "Review seeded successfully!" });
      setTimeout(() => setMessage(null), 3000);
      fetchReviews();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to seed review" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-3.5 w-3.5"
            style={{ color: i < rating ? "#f5a623" : "#e5e5e7", fill: i < rating ? "#f5a623" : "transparent" }}
          />
        ))}
      </div>
    );
  };

  const clearFilters = () => {
    setFilterProduct("all");
    setFilterRating("all");
    setFilterVerified("all");
  };

  const hasActiveFilters = filterProduct !== "all" || filterRating !== "all" || filterVerified !== "all";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
            Reviews
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading reviews...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div
            className="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
            style={{ background: "var(--color-bg)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#ffebee" }}
              >
                <AlertTriangle className="h-5 w-5" style={{ color: "#d32f2f" }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Delete Review
              </h3>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ border: "1px solid #e5e5e7", color: "var(--color-text)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#d32f2f" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
            Reviews
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {reviews.length} reviews total &middot; {filteredReviews.length} shown
          </p>
        </div>
        <button
          onClick={() => setShowSeedForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-medium transition-colors"
          style={{ background: "#0071E3" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0077ed")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0071E3")}
        >
          <Plus className="h-4 w-4" />
          Seed Review
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            background: message.type === "success" ? "#e8f5e9" : "#ffebee",
            border: `1px solid ${message.type === "success" ? "#c8e6c9" : "#ffcdd2"}`,
            color: message.type === "success" ? "#2e7d32" : "#c62828",
          }}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Seed Review Form */}
      {showSeedForm && (
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[17px] font-semibold" style={{ color: "var(--color-text)" }}>
              Seed New Review
            </h2>
            <button
              onClick={() => setShowSeedForm(false)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-alt)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSeedSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                  Product <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <select
                  value={seedProductId}
                  onChange={(e) => setSeedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                  style={{ border: "1px solid #e5e5e7", color: "var(--color-text)", background: "var(--color-bg)" }}
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                  Customer Name <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <input
                  type="text"
                  value={seedCustomerName}
                  onChange={(e) => setSeedCustomerName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                  style={{ border: "1px solid #e5e5e7", color: "var(--color-text)", background: "var(--color-bg)" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                  Rating <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSeedRating(String(val))}
                      className="p-1 rounded transition-colors"
                    >
                      <Star
                        className="h-5 w-5"
                        style={{
                          color: val <= parseInt(seedRating) ? "#f5a623" : "#e5e5e7",
                          fill: val <= parseInt(seedRating) ? "#f5a623" : "transparent",
                        }}
                      />
                    </button>
                  ))}
                  <span className="text-sm ml-1" style={{ color: "var(--color-text-muted)" }}>
                    {seedRating}/5
                  </span>
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seedVerified}
                    onChange={(e) => setSeedVerified(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "#0071E3" }}
                  />
                  <span className="text-[13px]" style={{ color: "var(--color-text)" }}>
                    Verified Purchase
                  </span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                Review Content <span style={{ color: "#d32f2f" }}>*</span>
              </label>
              <textarea
                value={seedContent}
                onChange={(e) => setSeedContent(e.target.value)}
                placeholder="Write the review content here..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors resize-none"
                style={{ border: "1px solid #e5e5e7", color: "var(--color-text)", background: "var(--color-bg)" }}
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSeedForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ border: "1px solid #e5e5e7", color: "var(--color-text)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#0071E3" }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = "#0077ed")}
                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.background = "#0071E3")}
              >
                {submitting ? "Seeding..." : "Seed Review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-xl transition-colors"
          style={{
            border: "1px solid #e5e5e7",
            color: showFilters ? "#0071E3" : "var(--color-text)",
            background: showFilters ? "rgba(0,113,227,0.08)" : "var(--color-bg)",
          }}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span
              className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: "#0071E3", color: "#fff" }}
            >
              {[filterProduct !== "all", filterRating !== "all", filterVerified !== "all"].filter(Boolean).length}
            </span>
          )}
        </button>
        {showFilters && (
          <div
            className="mt-3 p-4 rounded-2xl"
            style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                  Product
                </label>
                <select
                  value={filterProduct}
                  onChange={(e) => setFilterProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                  style={{ border: "1px solid #e5e5e7", color: "var(--color-text)", background: "var(--color-bg-alt)" }}
                >
                  <option value="all">All Products</option>
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                  Rating
                </label>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                  style={{ border: "1px solid #e5e5e7", color: "var(--color-text)", background: "var(--color-bg-alt)" }}
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                  Verified Status
                </label>
                <select
                  value={filterVerified}
                  onChange={(e) => setFilterVerified(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                  style={{ border: "1px solid #e5e5e7", color: "var(--color-text)", background: "var(--color-bg-alt)" }}
                >
                  <option value="all">All</option>
                  <option value="verified">Verified Only</option>
                  <option value="unverified">Unverified Only</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors"
                style={{ color: "#d32f2f" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ffebee")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reviews Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
      >
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare
              className="h-12 w-12 mx-auto mb-3"
              style={{ color: "#d1d1d6" }}
            />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {reviews.length === 0
                ? "No reviews yet. Seed your first review to get started."
                : "No reviews match your filters. Try adjusting your criteria."}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Product
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Customer
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Rating
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Content
                </th>
                <th
                  className="text-center px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Verified
                </th>
                <th
                  className="text-center px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Status
                </th>
                <th
                  className="text-right px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr
                  key={review.id}
                  style={{ borderBottom: "1px solid #f5f5f7" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-[13px] truncate max-w-[180px]" style={{ color: "var(--color-text)" }}>
                          {review.products?.name || `Product #${review.product_id}`}
                        </p>
                        {review.admin_seed && (
                          <span className="inline-flex items-center gap-0.5 mt-0.5 text-[10px] font-medium" style={{ color: "#0071E3" }}>
                            <User className="h-2.5 w-2.5" />
                            Admin Seeded
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>
                      {review.customer_name}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    {renderStars(review.rating)}
                  </td>
                  <td className="px-5 py-3.5 max-w-[240px]">
                    <p className="text-[13px] truncate" style={{ color: "var(--color-text-muted)" }}>
                      {review.content}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {review.is_verified_purchase ? (
                      <ShieldCheck className="h-4 w-4 mx-auto" style={{ color: "#2e7d32" }} />
                    ) : (
                      <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                        &mdash;
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: review.is_approved ? "#e8f5e9" : "#fff3e0",
                        color: review.is_approved ? "#2e7d32" : "#e65100",
                      }}
                    >
                      {review.is_approved ? (
                        <>
                          <Check className="h-2.5 w-2.5" />
                          Approved
                        </>
                      ) : (
                        <>
                          <X className="h-2.5 w-2.5" />
                          Pending
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {updating === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-text-muted)" }} />
                      ) : (
                        <>
                          {review.is_approved ? (
                            <button
                              onClick={() => handleToggleApprove(review.id, review.is_approved)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
                              style={{ color: "#e65100" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#fff3e0")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              title="Reject Review"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleApprove(review.id, review.is_approved)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
                              style={{ color: "#2e7d32" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f5e9")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              title="Approve Review"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteId(review.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
                            style={{ color: "#d32f2f" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#ffebee")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            title="Delete Review"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </>
                      )}
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
