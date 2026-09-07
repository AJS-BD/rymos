"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import StarRating from "@/components/shared/star-rating";

const testimonials = [
  {
    id: 1,
    name: "Rahim Ahmed",
    location: "Dhaka",
    rating: 5,
    content: "Amazing service! Got my iPhone 15 Pro Max delivered same day. The credit option made it so much easier to buy.",
    verified: true,
    avatar: "RA",
  },
  {
    id: 2,
    name: "Fatima Rahman",
    location: "Chattogram",
    rating: 5,
    content: "Best phone shop in Bangladesh. Genuine products, fast delivery, and excellent customer support.",
    verified: true,
    avatar: "FR",
  },
  {
    id: 3,
    name: "Karim Hossain",
    location: "Sylhet",
    rating: 4,
    content: "Great prices and the COD option is very convenient. Will definitely shop again!",
    verified: true,
    avatar: "KH",
  },
  {
    id: 4,
    name: "Nusrat Jahan",
    location: "Rajshahi",
    rating: 5,
    content: "The quiz feature helped me find the perfect phone. Loving my new Samsung S24 Ultra!",
    verified: true,
    avatar: "NJ",
  },
  {
    id: 5,
    name: "Tanvir Hassan",
    location: "Khulna",
    rating: 5,
    content: "Excellent credit plan options. Very flexible and the staff is super helpful.",
    verified: true,
    avatar: "TH",
  },
];

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (!isClient) return null;

  return (
    <section className="py-16 bg-[var(--color-bg-alt)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">
              What Our Customers Say
            </h2>
            <p className="text-[var(--color-text-muted)] mt-1">
              Real reviews from verified buyers
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="p-2 border border-[var(--color-border)] rounded-full hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="p-2 border border-[var(--color-border)] rounded-full hover:bg-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
            >
              {[0, 1, 2].map((offset) => {
                const testimonial = testimonials[(current + offset) % testimonials.length];
                return (
                  <div
                    key={`${current}-${offset}`}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all relative"
                  >
                    <Quote className="absolute top-4 right-4 h-8 w-8 text-[var(--color-border)]" />
                    <StarRating rating={testimonial.rating} />
                    <p className="mt-4 text-[var(--color-text)] text-sm leading-relaxed">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--color-text)]">
                            {testimonial.name}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {testimonial.location}
                          </p>
                        </div>
                      </div>
                      {testimonial.verified && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === current ? "bg-[var(--color-primary)] w-6" : "bg-[var(--color-border)] w-2"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
