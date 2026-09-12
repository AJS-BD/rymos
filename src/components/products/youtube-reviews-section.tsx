"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Video } from "lucide-react";

interface YouTubeReview {
  id: string;
  youtube_url: string;
  title: string;
  creator_name: string;
  thumbnail_url?: string;
}

interface YouTubeReviewsSectionProps {
  youtubeReviews: YouTubeReview[];
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

function getThumbnailUrl(videoId: string, fallback?: string): string {
  if (fallback) return fallback;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export default function YouTubeReviewsSection({ youtubeReviews }: YouTubeReviewsSectionProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  if (!youtubeReviews || youtubeReviews.length === 0) return null;

  const handleCardClick = (review: YouTubeReview) => {
    const videoId = extractVideoId(review.youtube_url);
    if (videoId) {
      setExpandedCard(review.id);
      setActiveVideo(videoId);
    }
  };

  const handleClose = () => {
    setActiveVideo(null);
    setExpandedCard(null);
  };

  return (
    <section className="py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Video className="w-5 h-5 text-red-500" />
            <span className="text-xs font-medium tracking-widest uppercase text-red-500">Video Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight">
            YouTube Reviews
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500 font-light">
            Watch what creators are saying about this product
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {youtubeReviews.map((review, idx) => {
            const videoId = extractVideoId(review.youtube_url);
            if (!videoId) return null;
            const isExpanded = expandedCard === review.id;

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div
                  className="group cursor-pointer"
                  onClick={() => !isExpanded && handleCardClick(review)}
                >
                  {/* Thumbnail / Video Player */}
                  <AnimatePresence mode="wait">
                    {isExpanded ? (
                      <motion.div
                        key="player"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative aspect-video rounded-2xl overflow-hidden bg-black"
                      >
                        <iframe
                          src={getEmbedUrl(activeVideo!)}
                          title={review.title}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleClose(); }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-black/80 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="thumbnail"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100"
                      >
                        <img
                          src={getThumbnailUrl(videoId, review.thumbnail_url)}
                          alt={review.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg group-hover:bg-red-600 transition-colors"
                          >
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white ml-0.5" />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Info */}
                  <div className="mt-4 px-1">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {review.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                        <Video className="w-3 h-3 text-red-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">{review.creator_name}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
