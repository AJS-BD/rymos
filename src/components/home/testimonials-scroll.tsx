"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useReducedMotion, useSpring, useMotionValue, useTransform } from "framer-motion";
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
  const prefersReducedMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);

  // Spring-based auto-scroll with smooth easing
  const scrollX = useMotionValue(0);
  const smoothScrollX = useSpring(scrollX, {
    damping: 50,
    stiffness: 60,
    mass: 1.2,
    restDelta: 0.5,
  });

  // Auto-scroll animation with smooth easing
  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const container = containerRef.current;
    if (!container) return;

    const totalWidth = container.scrollWidth / 2;
    let animationId: number;
    let startTime: number | null = null;
    const duration = 30000; // 30 seconds for full scroll (smoother, slower)

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      const x = -progress * totalWidth;

      scrollX.set(x);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [prefersReducedMotion, isPaused, scrollX]);

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  // Double the testimonials for seamless infinite scroll
  const doubledTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-[var(--color-bg-alt)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-8 sm:mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", damping: 22, stiffness: 100, mass: 0.8 }}
          className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight text-[var(--color-text)]"
        >
          What people are saying.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", damping: 22, stiffness: 100, mass: 0.8, delay: 0.1 }}
          className="mt-2 text-base sm:text-lg text-[var(--color-text-muted)]"
        >
          Real reviews from our customers.
        </motion.p>
      </div>

      {/* Auto-scrolling container */}
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {prefersReducedMotion ? (
          /* Static layout for reduced motion */
          <div className="flex gap-6 px-4 overflow-x-auto scrollbar-hide">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        ) : (
          <motion.div
            style={{ x: smoothScrollX }}
            className="flex gap-6"
          >
            {doubledTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`${testimonial.id}-${index}`}
                testimonial={testimonial}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D hover effect with spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 350, mass: 0.4 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);
  const scale = useSpring(1, { damping: 18, stiffness: 250, mass: 0.6 });
  const shadowY = useSpring(0, { damping: 25, stiffness: 200 });
  const shadowBlur = useSpring(0, { damping: 25, stiffness: 200 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [prefersReducedMotion, mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    if (prefersReducedMotion) return;
    scale.set(1.03);
    shadowY.set(8);
    shadowBlur.set(20);
  }, [prefersReducedMotion, scale, shadowY, shadowBlur]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
    shadowY.set(0);
    shadowBlur.set(0);
  }, [mouseX, mouseY, scale, shadowY, shadowBlur]);

  const boxShadow = useTransform(
    [shadowY, shadowBlur] as const,
    ([y, blur]) => `0px ${y}px ${blur}px rgba(0, 0, 0, 0.08)`
  );

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 1, y: 0, rotateX: 0 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      style={{
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        scale,
        boxShadow,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      className="flex-shrink-0 w-[280px] sm:w-[340px] lg:w-[400px] bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm cursor-pointer"
    >
      <Quote className="h-8 w-8 text-[var(--color-border)] mb-4" />
      <p className="text-sm sm:text-base lg:text-lg text-[var(--color-text)] leading-relaxed line-clamp-4">
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
