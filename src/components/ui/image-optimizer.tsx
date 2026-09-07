"use client";

import Image, { ImageProps } from "next/image";
import { useState, useCallback } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "placeholder" | "blurDataURL"> {
  fallbackSrc?: string;
  aspectRatio?: string;
  rounded?: boolean;
  roundedSize?: "sm" | "md" | "lg" | "xl" | "full";
}

const roundedClasses: Record<string, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

// Generate a tiny blur placeholder (1x1 pixel SVG)
const BLUR_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23f5f5f7'/%3E%3C/svg%3E";

export function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  fallbackSrc = "/images/placeholder.svg",
  aspectRatio,
  rounded = false,
  roundedSize = "md",
  className = "",
  priority = false,
  quality = 85,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = useCallback(() => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  }, [imgSrc, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const roundedClass = rounded ? roundedClasses[roundedSize] : "";

  const wrapperStyle = aspectRatio ? { aspectRatio } : undefined;

  return (
    <div
      className={`relative overflow-hidden ${roundedClass} ${className}`}
      style={wrapperStyle}
    >
      {/* Skeleton loader */}
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
          style={{ backgroundSize: "200% 100%" }}
        />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={quality}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        onError={handleError}
        onLoad={handleLoad}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className={`transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${roundedClass}`}
        style={{
          objectFit: "cover",
          width: "100%",
          height: "auto",
        }}
        {...props}
      />
    </div>
  );
}

// Product image with specific sizing
export function ProductImage({
  src,
  alt,
  size = "md",
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}) {
  const sizeMap = {
    sm: { width: 150, height: 150 },
    md: { width: 300, height: 300 },
    lg: { width: 500, height: 500 },
    xl: { width: 800, height: 800 },
  };

  const { width, height } = sizeMap[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      aspectRatio="1/1"
      rounded
      roundedSize="lg"
      className={className}
      priority={priority}
    />
  );
}

// Hero image with full-width sizing
export function HeroImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      aspectRatio="16/9"
      priority
      quality={90}
      className={className}
    />
  );
}

// Category image
export function CategoryImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={300}
      aspectRatio="4/3"
      rounded
      roundedSize="xl"
      className={className}
    />
  );
}

export default OptimizedImage;
