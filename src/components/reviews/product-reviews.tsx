"use client";

import { useState, useEffect } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import StarRating from "@/components/shared/star-rating";
import {
  Star,
  Send,
  Loader2,
  CheckCircle,
  ShieldCheck,
  MessageSquare,
  ThumbsUp,
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
  customers?: {
    full_name: string;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isVerifiedPurchaser, setIsVerifiedPurchaser] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkVerifiedPurchase();
  }, [productId]);

  const fetchReviews = async () => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("product_reviews")
        .select("*, customers(full_name)")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      setReviews(data || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkVerifiedPurchase = async () => {
    if (!isConfigured()) return;

    try {
      const supabase = getSupabase();
      const customerId = localStorage.getItem("rymos_customer_id");

      if (!customerId) return;

      // Check if customer has a delivered order containing this product
      const { data: orders } = await supabase
        .from("orders")
        .select("items")
        .eq("customer_id", customerId)
        .eq("status", "delivered");

      if (orders && orders.length > 0) {
        const hasProduct = orders.some((order: any) => {
          const items = Array.isArray(order.items) ? order.items : [];
          return items.some((item: any) => item.product_id === productId);
        });
        setIsVerifiedPurchaser(hasProduct);
      }
    } catch (err) {
      console.error("Failed to check purchase:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
        setError("Please log in to submit a review.");
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from("product_reviews").insert({
        product_id: productId,
        customer_id: customerId,
        rating,
        title: title.trim() || null,
        content: content.trim(),
        is_verified_purchase: isVerifiedPurchaser,
        is_approved: false,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setShowForm(false);
      setRating(0);
      setTitle("");
      setContent("");

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(averageRating)} size="sm" />
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} out of 5 ({reviews.length} review
                {reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Your review has been submitted and is pending admin approval. Thank you!
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Write Your Review</h3>

          {isVerifiedPurchaser && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Verified Purchaser — your review will be marked as verified.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Rating *
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
                      className={`w-7 h-7 ${
                        star <= rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    {rating === 1
                      ? "Poor"
                      : rating === 2
                      ? "Fair"
                      : rating === 3
                      ? "Good"
                      : rating === 4
                      ? "Very Good"
                      : "Excellent"}
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
                Your Review *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What did you like or dislike? How was the quality?"
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
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} size="sm" />
                  {review.is_verified_purchase && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.title && (
                <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
              )}
              <p className="text-sm text-gray-600">{review.content}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                <ThumbsUp className="w-3 h-3" />
                <span>Reviewed by {review.customers?.full_name || "Anonymous"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
