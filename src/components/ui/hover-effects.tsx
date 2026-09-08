"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useSpring, useTransform, type SpringOptions } from "framer-motion";

// ─── Card3D ──────────────────────────────────────────────────────────────────

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  perspective?: number;
  maxRotation?: number;
  springConfig?: SpringOptions;
  glowColor?: string;
  glowIntensity?: number;
}

export function Card3D({
  children,
  className = "",
  perspective = 1000,
  maxRotation = 15,
  springConfig = { stiffness: 300, damping: 25 },
  glowColor = "rgba(0, 113, 227, 0.15)",
  glowIntensity = 20,
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const rotateX = useTransform(y, [-0.5, 0.5], [maxRotation, -maxRotation]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-maxRotation, maxRotation]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = (e.clientX - centerX) / (rect.width / 2);
      const mouseY = (e.clientY - centerY) / (rect.height / 2);

      x.set(mouseX * 0.5);
      y.set(mouseY * 0.5);
    },
    [x, y]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective,
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className}`}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>

      {/* Glow effect overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          background: `radial-gradient(circle at ${x.get() * 50 + 50}% ${y.get() * 50 + 50}%, ${glowColor}, transparent ${glowIntensity}%)`,
        }}
      />
    </motion.div>
  );
}

// ─── ImageZoom ────────────────────────────────────────────────────────────────

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomScale?: number;
  duration?: number;
}

export function ImageZoom({
  src,
  alt,
  className = "",
  zoomScale = 1.1,
  duration = 0.4,
}: ImageZoomProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        whileHover={{
          scale: zoomScale,
        }}
        transition={{
          duration,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      />
    </div>
  );
}

// ─── ImageZoom with Container ────────────────────────────────────────────────

interface ImageZoomContainerProps {
  children: React.ReactNode;
  className?: string;
  zoomScale?: number;
  duration?: number;
}

export function ImageZoomContainer({
  children,
  className = "",
  zoomScale = 1.08,
  duration = 0.5,
}: ImageZoomContainerProps) {
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      whileHover="hover"
    >
      <motion.div
        variants={{
          hover: { scale: zoomScale },
        }}
        transition={{
          duration,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── ButtonPress ──────────────────────────────────────────────────────────────

interface ButtonPressProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function ButtonPress({
  children,
  className = "",
  scale = 0.96,
  onClick,
  disabled = false,
  type = "button",
}: ButtonPressProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ─── GlowEffect ───────────────────────────────────────────────────────────────

interface GlowEffectProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  glowSize?: number;
  borderRadius?: string;
}

export function GlowEffect({
  children,
  className = "",
  glowColor = "rgba(0, 113, 227, 0.4)",
  glowSize = 20,
  borderRadius = "inherit",
}: GlowEffectProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{
        boxShadow: `0 0 ${glowSize}px ${glowColor}`,
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      style={{ borderRadius }}
    >
      {children}
    </motion.div>
  );
}

// ─── GlowRing ─────────────────────────────────────────────────────────────────

interface GlowRingProps {
  children: React.ReactNode;
  className?: string;
  ringColor?: string;
  ringWidth?: number;
}

export function GlowRing({
  children,
  className = "",
  ringColor = "var(--color-primary)",
  ringWidth = 2,
}: GlowRingProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{
        boxShadow: `0 0 0 ${ringWidth}px ${ringColor}`,
      }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── TiltCard ─────────────────────────────────────────────────────────────────

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
}

export function TiltCard({
  children,
  className = "",
  maxTilt = 10,
  perspective = 800,
  scale = 1.02,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const tiltX = (y - 0.5) * maxTilt * 2;
      const tiltY = (x - 0.5) * maxTilt * 2 * -1;

      ref.current.style.transform = `perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scale})`;
    },
    [maxTilt, perspective, scale]
  );

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
  }, [perspective]);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

// ─── MagneticButton ───────────────────────────────────────────────────────────

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.3,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0px, 0px)";
  }, []);

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </motion.button>
  );
}

// ─── HoverLift ────────────────────────────────────────────────────────────────

interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
  lift?: number;
  duration?: number;
}

export function HoverLift({
  children,
  className = "",
  lift = -8,
  duration = 0.3,
}: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y: lift }}
      transition={{ duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── BorderGlow ───────────────────────────────────────────────────────────────

interface BorderGlowProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  borderRadius?: string;
}

export function BorderGlow({
  children,
  className = "",
  glowColor = "var(--color-primary)",
  borderRadius = "12px",
}: BorderGlowProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Glow border */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="absolute inset-0"
          style={{
            borderRadius,
            padding: "1px",
            background: `linear-gradient(135deg, ${glowColor}, transparent, ${glowColor})`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      </motion.div>
      {children}
    </div>
  );
}

// ─── PulseGlow ────────────────────────────────────────────────────────────────

interface PulseGlowProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export function PulseGlow({
  children,
  className = "",
  glowColor = "rgba(0, 113, 227, 0.3)",
  intensity = 15,
}: PulseGlowProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        boxShadow: [
          `0 0 0px ${glowColor}`,
          `0 0 ${intensity}px ${glowColor}`,
          `0 0 0px ${glowColor}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── InteractiveCard ──────────────────────────────────────────────────────────

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export function InteractiveCard({
  children,
  className = "",
  href,
  onClick,
}: InteractiveCardProps) {
  const Component = href ? "a" : "div";

  return (
    <motion.div
      className={`block ${className}`}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="w-full h-full"
        whileHover={{
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
