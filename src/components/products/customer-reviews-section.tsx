"use client";

import { motion } from "framer-motion";
import { ShieldCheck, User } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  is_verified_purchase: boolean;
  created_at: string;
  customers?: {
    full_name: string;
  } | null;
}

interface CustomerReviewsSectionProps {
  reviews: Review[];
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function RatingBar({ stars, percentage }: { stars: number; percentage: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-6 text-right">{stars}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="h-full bg-yellow-400 rounded-full"
        />
      </div>
      <span className="text-xs text-gray-400 w-8">{percentage}%</span>
    </div>
  );
}

export default function CustomerReviewsSection({ reviews }: CustomerReviewsSectionProps) {
  if (!reviews || reviews.length === 0) return null;

  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  const roundedAverage = Math.round(averageRating * 10) / 10;

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percentage: Math.round((reviews.filter((r) => r.rating === stars).length / totalReviews) * 100),
  }));

  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight">
            Customer Reviews
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500 font-light">
            See what our customers are saying
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16">
          {/* Rating Summary */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:col-span-4"
          >
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm sticky top-20">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight">
                  {roundedAverage.toFixed(1)}
                </div>
                <div className="mt-3 flex justify-center">
                  <StarRating rating={Math.round(averageRating)} size="md" />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="mt-6 sm:mt-8 space-y-2.5">
                {ratingDistribution.map((item) => (
                  <RatingBar key={item.stars} stars={item.stars} percentage={item.percentage} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Review Cards */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {review.customers?.full_name || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} size="sm" />
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-600">
                            <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <time className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>

                {/* Content */}
                <div className="mt-4">
                  {review.title && (
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                      {review.title}
                    </h4>
                  )}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {review.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
