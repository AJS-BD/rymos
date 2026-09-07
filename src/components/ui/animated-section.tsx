"use client";

import { motion, useScroll, useTransform, useReducedMotion, useSpring, useInView } from "framer-motion";
import { useRef, createContext, useContext, ReactNode, useState, useEffect } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  parallaxSpeed?: number;
  parallaxDirection?: "up" | "down";
  staggerChildren?: boolean;
  staggerDelay?: number;
  entrance?: "fade" | "slide" | "3d" | "scale";
  parallaxBackground?: ReactNode;
}

// Context for stagger coordination
const StaggerContext = createContext<{ registerChild: () => number; staggerDelay: number }>({
  registerChild: () => 0,
  staggerDelay: 0.1,
});

export function StaggerChild({ children, className = "" }: { children: ReactNode; className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 24, rotateX: -8 }
      }
      animate={
        isInView
          ? { opacity: 1, y: 0, rotateX: 0 }
          : { opacity: 0, y: 24, rotateX: -8 }
      }
      transition={{
        type: "spring",
        damping: 22,
        stiffness: 100,
        mass: 0.8,
      }}
      style={{ transformPerspective: 1200 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function AnimatedSection({
  children,
  className = "",
  delay = 0,
  parallaxSpeed = 0,
  parallaxDirection = "up",
  staggerChildren = false,
  staggerDelay = 0.12,
  entrance = "3d",
  parallaxBackground,
}: AnimatedSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [childCount, setChildCount] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Parallax transforms
  const direction = parallaxDirection === "up" ? -1 : 1;
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    parallaxSpeed > 0 ? [parallaxSpeed * direction, -parallaxSpeed * direction] : [0, 0]
  );

  // Spring-based entrance with physics
  const springConfig = { damping: 22, stiffness: 90, mass: 0.9 };
  const entranceY = useSpring(40, springConfig);
  const entranceOpacity = useSpring(0, springConfig);
  const entranceRotateX = useSpring(-12, springConfig);
  const entranceScale = useSpring(0.92, springConfig);

  // Entrance animation variants
  const entranceVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    slide: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
    },
    "3d": {
      initial: { opacity: 0, y: 40, rotateX: -12, scale: 0.92 },
      animate: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.85 },
      animate: { opacity: 1, scale: 1 },
    },
  };

  const variant = entranceVariants[entrance];

  // Animate springs when in view
  useEffect(() => {
    if (prefersReducedMotion) return;
    const initial = variant.initial as Record<string, number>;
    if (isInView) {
      entranceY.set(0);
      entranceOpacity.set(1);
      entranceRotateX.set(0);
      entranceScale.set(1);
    } else {
      entranceY.set(initial.y ?? 0);
      entranceOpacity.set(initial.opacity ?? 0);
      entranceRotateX.set(initial.rotateX ?? 0);
      entranceScale.set(initial.scale ?? 1);
    }
  }, [isInView, prefersReducedMotion, entranceY, entranceOpacity, entranceRotateX, entranceScale, variant]);

  // Handle reduced motion
  if (prefersReducedMotion) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3, delay }}
        className={className}
      >
        {parallaxBackground && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {parallaxBackground}
          </div>
        )}
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={variant.initial}
      animate={isInView ? variant.animate : variant.initial}
      transition={{
        type: "spring",
        damping: 22,
        stiffness: 90,
        mass: 0.9,
        delay,
      }}
      style={{
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
        willChange: "transform, opacity",
      }}
      className={className}
    >
      {/* Parallax background layer */}
      {parallaxBackground && (
        <motion.div
          style={{ y: parallaxY }}
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          {parallaxBackground}
        </motion.div>
      )}

      {/* Content with optional stagger */}
      {staggerChildren ? (
        <StaggerContext.Provider value={{ registerChild: () => { setChildCount(c => c + 1); return childCount; }, staggerDelay }}>
          {children}
        </StaggerContext.Provider>
      ) : (
        children
      )}
    </motion.div>
  );
}
