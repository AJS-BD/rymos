"use client";

import { useState, useEffect } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import StarRating from "@/components/shared/star-rating";
import {
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Loader2,
  Star,
  MessageSquare,
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
  customers?: {
    full_name: string;
    phone: string;
  };
}

const STATUS_FILTERS = [
  { value: "all", label: "All", icon: Filter },
  { value: "pending", label: "Pending", icon: Clock },
  { value: "approved", label: "Approved", icon: CheckCircle },
  { value: "rejected", label: "Rejected", icon: XCircle },
];

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    let filtered = reviews;
    if (statusFilter === "pending") {
      filtered = filtered.filter((r) => !r.is_approved);
    } else if (statusFilter === "approved") {
      filtered = filtered.filter((r) => r.is_approved);
    } else if (statusFilter === "rejected") {
      // Rejected reviews would need a separate field; for now, show none
      filtered = [];
    }
    setFilteredReviews(filtered);
  }, [reviews, statusFilter]);

  const fetchReviews = async () => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("product_reviews")
        .select("*, products(name), customers(full_name, phone)")
        .order("created_at", { ascending: false });

      setReviews(data || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    setUpdating(reviewId);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("product_reviews")
        .update({ is_approved: true })
        .eq("id", reviewId);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_approved: true } : r))
      );
    } catch (err) {
      console.error("Failed to approve review:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (reviewId: string) => {
    setUpdating(reviewId);
    try {
      const supabase = getSupabase();
      // For rejection, we delete the review (or could add a rejected flag)
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error("Failed to reject review:", err);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusCounts = () => {
    return {
      all: reviews.length,
      pending: reviews.filter((r) => !r.is_approved).length,
      approved: reviews.filter((r) => r.is_approved).length,
      rejected: 0,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
        <p className="text-gray-500">{reviews.length} reviews total</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === filter.value
                ? "bg-black text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            <filter.icon className="w-3.5 h-3.5" />
            {filter.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({statusCounts[filter.value as keyof typeof statusCounts]})
            </span>
          </button>
        ))}
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {reviews.length === 0
                ? "No reviews yet"
                : "No reviews match your filter"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Rating
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Review
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr
                  key={review.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    {review.products?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium">
                      {review.customers?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {review.customers?.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-sm text-gray-500">
                        {review.rating}/5
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs">
                    {review.title && (
                      <p className="font-medium text-gray-900 truncate">
                        {review.title}
                      </p>
                    )}
                    <p className="text-gray-600 truncate">{review.content}</p>
                    {review.is_verified_purchase && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600">
                        <CheckCircle className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {review.is_approved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {updating === review.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <div className="flex items-center gap-2">
                        {!review.is_approved && (
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleReject(review.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
