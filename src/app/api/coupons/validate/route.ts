import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { validateCoupon, type CouponRow } from "@/lib/coupons";
import { getErrorMessage } from "@/lib/utils";

/**
 * GET /api/coupons/validate?code=SAVE20&subtotal=5000
 * POST /api/coupons/validate { code, subtotal }
 *
 * PREVIEW ONLY. Returns what discount a coupon code would give for the
 * given subtotal. The final discount is always re-computed server-side
 * in POST /api/orders/create — never trust this preview at order time.
 *
 * Uses the anon client (via getServerSupabase): anon may SELECT active
 * coupons, which is all this route needs.
 */

function parseParams(request: NextRequest): { code: string; subtotal: number } | null {
  const code = request.nextUrl.searchParams.get("code")?.trim() ?? "";
  const subtotalRaw = request.nextUrl.searchParams.get("subtotal") ?? "";
  const subtotal = Number(subtotalRaw);
  if (!code || !Number.isFinite(subtotal) || subtotal < 0) return null;
  return { code, subtotal };
}

async function handle(code: string, subtotal: number) {
  const supabase = getServerSupabase();
  const { data: couponRow, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  const check = validateCoupon((couponRow as CouponRow | null) ?? null, subtotal);
  return NextResponse.json({
    valid: check.valid,
    discount: check.discount,
    message: check.message,
    code: check.valid ? (couponRow as CouponRow).code : null,
  });
}

export async function GET(request: NextRequest) {
  try {
    const params = parseParams(request);
    if (!params) {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Provide a coupon code and subtotal." },
        { status: 400 }
      );
    }
    return await handle(params.code, params.subtotal);
  } catch (err) {
    console.error("Error validating coupon:", err);
    return NextResponse.json(
      { valid: false, discount: 0, message: getErrorMessage(err, "Could not validate coupon.") },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Invalid JSON body." },
        { status: 400 }
      );
    }
    const { code, subtotal } = body as { code?: unknown; subtotal?: unknown };
    if (typeof code !== "string" || !code.trim() || typeof subtotal !== "number" || subtotal < 0) {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Provide a coupon code and subtotal." },
        { status: 400 }
      );
    }
    return await handle(code.trim(), subtotal);
  } catch (err) {
    console.error("Error validating coupon:", err);
    return NextResponse.json(
      { valid: false, discount: 0, message: getErrorMessage(err, "Could not validate coupon.") },
      { status: 500 }
    );
  }
}
