"use client";

import { useState, useEffect } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import StarRating from "@/components/shared/star-rating";
import {
  Star,
  MessageSquare,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Send,
} from "lucide-react";

interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  content: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
  };
}

interface Product {
  id: string;
  name: string;
}

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const customerId = localStorage.getItem("rymos_customer_id");

      const [reviewsRes, productsRes] = await Promise.all([
        supabase
          .from("product_reviews")
          .select("*, products(name)")
          .eq("customer_id", customerId || "")
          .order("created_at", { ascending: false }),
        supabase.from("products").select("id, name").order("name"),
      ]);

      if (reviewsRes.data) setReviews(reviewsRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedProductId) {
      setError("Please select a product to review.");
      return;
    }
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (!content.trim()) {
      setError("Please write your review.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabase();
      const customerId = localStorage.getItem("rymos_customer_id");

      if (!customerId) {
        setError("Unable to identify customer. Please refresh and try again.");
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from("product_reviews").insert({
        product_id: selectedProductId,
        customer_id: customerId,
        rating,
        title: title.trim() || null,
        content: content.trim(),
        is_verified_purchase: false,
        is_approved: false,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setShowForm(false);
      setSelectedProductId("");
      setRating(0);
      setTitle("");
      setContent("");
      fetchData();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (isApproved: boolean) => {
    if (isApproved) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
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

  return (
    <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-500">{reviews.length} reviews written</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Write Review
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Your review has been submitted and is pending approval.
        </div>
      )}

      {/* Write Review Form */}
      {showForm && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Write a Review</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    {rating} star{rating !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts about this product..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Review
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            You haven&apos;t written any reviews yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-gray-900">
                      {review.products?.name || "Unknown Product"}
                    </h3>
                    {review.is_verified_purchase && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={review.rating} size="sm" />
                    {getStatusBadge(review.is_approved)}
                  </div>
                  {review.title && (
                    <p className="font-medium text-gray-800 mb-1">{review.title}</p>
                  )}
                  <p className="text-sm text-gray-600">{review.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      </main>
  );
}
