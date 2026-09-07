// Utility functions

/**
 * Format Bangladeshi Taka
 */
export function formatBDT(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate order number: RY-YYYY-NNNN
 */
export function generateOrderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `RY-${year}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Generate customer username: name-slug-phone
 */
export function generateUsername(
  fullName: string,
  phone: string
): string {
  const nameSlug = fullName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const phoneSuffix = phone.replace(/[^0-9]/g, "").slice(-10);

  return `${nameSlug}-${phoneSuffix}`;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(
  price: number,
  originalPrice: number
): number {
  if (originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Delay utility for animations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Class name merger (simplified clsx)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
