"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  content: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Rahim Ahmed",
    location: "Dhaka",
    content: "Amazing service! Got my iPhone 15 Pro Max delivered same day. The credit option made it so much easier to buy.",
  },
  {
    id: 2,
    name: "Fatima Rahman",
    location: "Chattogram",
    content: "Best phone shop in Bangladesh. Genuine products, fast delivery, and excellent customer support.",
  },
  {
    id: 3,
    name: "Karim Hossain",
    location: "Sylhet",
    content: "Great prices and the COD option is very convenient. Will definitely shop again!",
  },
  {
    id: 4,
    name: "Nusrat Jahan",
    location: "Rajshahi",
    content: "The quiz feature helped me find the perfect phone. Loving my new Samsung S24 Ultra!",
  },
  {
    id: 5,
    name: "Tanvir Hassan",
    location: "Khulna",
    content: "Excellent credit plan options. Very flexible and the staff is super helpful.",
  },
];

export default function TestimonialsScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Double the testimonials for seamless infinite scroll
  const doubledTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-20 sm:py-32 bg-[var(--color-bg-alt)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--color-text)]">
          What people are saying.
        </h2>
        <p className="mt-2 text-lg text-[var(--color-text-muted)]">
          Real reviews from our customers.
        </p>
      </div>

      {/* Auto-scrolling container */}
      <div ref={containerRef} className="relative">
        <div className="flex gap-6 animate-scroll">
          {doubledTestimonials.map((testimonial, index) => (
            <TestimonialCard
              key={`${testimonial.id}-${index}`}
              testimonial={testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="flex-shrink-0 w-[340px] sm:w-[400px] bg-white rounded-2xl p-8 shadow-sm"
    >
      <Quote className="h-8 w-8 text-[var(--color-border)] mb-4" />
      <p className="text-base sm:text-lg text-[var(--color-text)] leading-relaxed">
        &ldquo;{testimonial.content}&rdquo;
      </p>
      <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
        <p className="text-sm font-medium text-[var(--color-text)]">
          {testimonial.name}
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {testimonial.location}
        </p>
      </div>
    </motion.div>
  );
}
