/**
 * Shared coupon logic for the checkout API routes.
 *
 * Mirrors the real `coupons` table (see supabase/migrations/
 * 20260907000000_initial_schema.sql and supabase/sync_20260922_prod_sync.sql):
 *   code, discount_type ('percentage' | 'fixed'), discount_value,
 *   min_order_amount, max_discount, usage_limit, usage_count,
 *   starts_at, expires_at, is_active.
 *
 * The validate route (/api/coupons/validate) is a PREVIEW only: it tells
 * the shopper what discount a code would give. The create-order route
 * (/api/orders/create) re-validates and re-computes the discount
 * server-side from the database — the preview value is never trusted.
 */

export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface CouponCheck {
  valid: boolean;
  discount: number;
  message: string;
}

/** Discount for a coupon against a subtotal, before any validity checks. */
export function computeDiscount(coupon: CouponRow, subtotal: number): number {
  let discount = 0;
  if (coupon.discount_type === "percentage") {
    discount = (subtotal * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount != null) {
      discount = Math.min(discount, Number(coupon.max_discount));
    }
  } else {
    discount = Number(coupon.discount_value);
  }
  // A discount can never exceed the subtotal, and never goes negative.
  return Math.max(0, Math.min(discount, subtotal));
}

/**
 * Validate a coupon row against the current time, the order subtotal
 * and its usage limit. Returns the discount to apply (0 when invalid).
 */
export function validateCoupon(
  coupon: CouponRow | null,
  subtotal: number
): CouponCheck {
  if (!coupon) {
    return { valid: false, discount: 0, message: "Coupon code not found." };
  }
  if (!coupon.is_active) {
    return { valid: false, discount: 0, message: "This coupon is not active." };
  }
  const now = new Date();
  if (new Date(coupon.starts_at) > now) {
    return { valid: false, discount: 0, message: "This coupon is not active yet." };
  }
  if (new Date(coupon.expires_at) < now) {
    return { valid: false, discount: 0, message: "This coupon has expired." };
  }
  if (
    coupon.usage_limit != null &&
    coupon.usage_count >= coupon.usage_limit
  ) {
    return {
      valid: false,
      discount: 0,
      message: "This coupon has reached its usage limit.",
    };
  }
  const minOrder = Number(coupon.min_order_amount ?? 0);
  if (subtotal < minOrder) {
    return {
      valid: false,
      discount: 0,
      message: `This coupon needs a minimum order of ৳${minOrder}.`,
    };
  }
  const discount = computeDiscount(coupon, subtotal);
  if (discount <= 0) {
    return {
      valid: false,
      discount: 0,
      message: "This coupon gives no discount on this order.",
    };
  }
  return { valid: true, discount, message: "Coupon applied." };
}
