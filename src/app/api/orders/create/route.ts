import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase-server";
import { validateCoupon, type CouponRow } from "@/lib/coupons";
import { getErrorMessage } from "@/lib/utils";

/**
 * POST /api/orders/create — server-side order creation.
 *
 * Replaces the old client-side checkout insert (src/app/customer/checkout/
 * page.tsx), which trusted browser prices/totals, used a racy COUNT(*)+1
 * order number, and decremented stock with a non-atomic read-modify-write.
 *
 * This route:
 *  - validates the body with zod (never trusts client totals),
 *  - re-prices every line from the products table,
 *  - validates stock (quantity <= stock) and the coupon server-side,
 *  - generates the order number as RY-YYYY-<6 random digits> with a
 *    retry loop on unique-conflict (never COUNT(*)+1),
 *  - decrements stock atomically per item with a conditional update
 *    (.gte("stock", qty)) and verifies a row was returned,
 *  - inserts the order, then the credit application (credit orders) and
 *    the coupon usage increment.
 *
 * Payment is COD / shop pickup / credit only — no online payment gateway.
 * COD = cash on delivery, shop pickup = paid in-store with bKash / Nagad /
 * Rocket / card, credit = instalments paid with those same methods.
 *
 * Auth: the route uses the service-role client when
 * SUPABASE_SERVICE_ROLE_KEY is set (see src/lib/supabase-server.ts),
 * otherwise the anon client. The anon fallback can still create plain
 * COD / pickup orders, but coupon usage counting and credit-application
 * creation need the service-role key (RLS blocks anon from both).
 */

const creditSchema = z.object({
  monthlyIncome: z.number().positive(),
  occupation: z.string().trim().min(1),
  employer: z.string().trim().min(1),
  installmentPeriod: z.number().int().positive(),
});

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
  shippingAddress: z.string().trim().max(500).optional().nullable(),
  pickupNote: z.string().trim().max(500).optional().nullable(),
  orderType: z.enum(["cod", "shop_pickup", "credit"]),
  couponCode: z.string().trim().max(50).optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  credit: creditSchema.optional().nullable(),
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** RY-YYYY-<6 random digits>. Random, not sequential — no COUNT(*)+1. */
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  return `RY-${year}-${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
}

interface PricedItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  stock: number;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first ? first.message : "Invalid request." },
      { status: 400 }
    );
  }
  const input = parsed.data;

  if (input.orderType === "cod" && !input.shippingAddress?.trim()) {
    return NextResponse.json(
      { error: "Please enter a shipping address for Cash on Delivery orders." },
      { status: 400 }
    );
  }
  if (input.orderType === "credit" && !input.credit) {
    return NextResponse.json(
      { error: "Credit orders need monthly income, occupation, employer and an installment period." },
      { status: 400 }
    );
  }

  const supabase = getServerSupabase();

  try {
    // ---- Resolve the customer (client resolves/creates it from the auth
    // session and passes customerId; phone lookup is the fallback). ----
    let customerId: string | null = input.customerId ?? null;
    if (customerId) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("id", customerId)
        .maybeSingle();
      if (!existing) {
        return NextResponse.json(
          { error: "Customer not found. Please log in again." },
          { status: 400 }
        );
      }
    } else if (input.phone) {
      const { data: byPhone } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", input.phone)
        .maybeSingle();
      if (byPhone) customerId = byPhone.id;
    }
    if (!customerId) {
      return NextResponse.json(
        { error: "Unable to identify customer. Please log in again." },
        { status: 400 }
      );
    }

    // ---- Merge duplicate lines, then re-price from the DB. ----
    const merged = new Map<string, number>();
    for (const item of input.items) {
      merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
    }
    const productIds = [...merged.keys()];

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, stock")
      .in("id", productIds);
    if (productsError) throw productsError;
    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products could not be found. Please refresh your bag and try again." },
        { status: 400 }
      );
    }

    const pricedItems: PricedItem[] = [];
    for (const product of products) {
      const quantity = merged.get(product.id) ?? 0;
      const stock = Number(product.stock ?? 0);
      if (quantity > stock) {
        return NextResponse.json(
          {
            error: `Only ${stock} left of "${product.name}". Please reduce the quantity.`,
            productId: product.id,
          },
          { status: 400 }
        );
      }
      pricedItems.push({
        productId: product.id,
        name: product.name,
        quantity,
        price: Number(product.price),
        stock,
      });
    }

    const subtotal = round2(
      pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    // ---- Validate the coupon server-side (preview values are never trusted). ----
    let coupon: CouponRow | null = null;
    let discount = 0;
    const couponCode = input.couponCode?.trim().toUpperCase() || null;
    if (couponCode) {
      const { data: couponRow, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .maybeSingle();
      if (couponError) throw couponError;
      const check = validateCoupon((couponRow as CouponRow | null) ?? null, subtotal);
      if (!check.valid) {
        return NextResponse.json({ error: check.message }, { status: 400 });
      }
      coupon = couponRow as CouponRow;
      discount = round2(check.discount);
    }
    const total = round2(subtotal - discount);

    const orderItems = pricedItems.map((item) => ({
      product_id: item.productId,
      name: item.name,
      qty: item.quantity,
      price: item.price,
    }));

    const orderRow: Record<string, unknown> = {
      customer_id: customerId,
      status: "pending",
      order_type: input.orderType,
      items: orderItems,
      subtotal,
      total,
      discount,
      payment_method: input.orderType === "credit" ? "credit" : "cod",
      shipping_address:
        input.orderType === "cod"
          ? { address: input.shippingAddress?.trim(), type: "delivery" }
          : null,
      pickup_note:
        input.orderType === "shop_pickup"
          ? input.pickupNote?.trim() || null
          : null,
      credit_application:
        input.orderType === "credit" && input.credit
          ? {
              monthly_income: input.credit.monthlyIncome,
              occupation: input.credit.occupation,
              employer: input.credit.employer,
              installment_period: input.credit.installmentPeriod,
            }
          : null,
    };
    // coupon_id / coupon_code columns were added by migration
    // 20261105_checkout_coupons.sql (prod already had them). Only send
    // them when a coupon was actually applied.
    if (coupon) {
      orderRow.coupon_id = coupon.id;
      orderRow.coupon_code = coupon.code;
    }

    // ---- Insert the order, retrying the random order number on conflict. ----
    let insertedOrder: { id: string; order_number: string } | null = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from("orders")
        .insert({ ...orderRow, order_number: generateOrderNumber() })
        .select("id, order_number")
        .single();
      if (!error) {
        insertedOrder = data as { id: string; order_number: string };
        break;
      }
      // 23505 = unique violation on order_number: try a new random number.
      if (error.code === "23505") {
        lastError = error;
        continue;
      }
      lastError = error;
      break;
    }
    if (!insertedOrder) {
      console.error("Order insert failed:", lastError);
      return NextResponse.json(
        { error: "Failed to place order. Please try again." },
        { status: 500 }
      );
    }
    const orderNumber = insertedOrder.order_number;

    // ---- Decrement stock atomically per item. The .gte("stock", qty)
    // guard makes the update a no-op (0 rows) if another order took the
    // last units in between — that is the oversell protection. ----
    for (const item of pricedItems) {
      const { data: updated, error: stockError } = await supabase
        .from("products")
        .update({ stock: item.stock - item.quantity })
        .eq("id", item.productId)
        .gte("stock", item.quantity)
        .select("id");
      if (stockError || !updated || updated.length === 0) {
        console.error(
          `Stock decrement failed for ${item.name} (${item.productId}):`,
          stockError ?? "no row updated — insufficient stock"
        );
        // Compensate: remove the just-created order so the customer is
        // not left with an order for stock we could not reserve. (This
        // delete needs the service-role client — anon is revoked DELETE
        // on orders — so with the anon fallback it logs and the order
        // stays for an admin to cancel; see src/lib/supabase-server.ts.)
        const { error: deleteError } = await supabase
          .from("orders")
          .delete()
          .eq("id", insertedOrder.id);
        if (deleteError) {
          console.error("Failed to roll back order after stock failure:", deleteError);
        }
        return NextResponse.json(
          {
            error: `Sorry — "${item.name}" just went out of stock. Please refresh your bag and try again.`,
            productId: item.productId,
          },
          { status: 400 }
        );
      }
    }

    // ---- Credit orders also create a credit_applications record
    // (same fields as the old client-side checkout). A failure here is
    // logged but does not void the order, as before. ----
    if (input.orderType === "credit" && input.credit) {
      const { error: creditAppError } = await supabase
        .from("credit_applications")
        .insert({
          customer_id: customerId,
          order_id: insertedOrder.id,
          status: "pending",
          requested_amount: total,
          proposed_down_payment: 0,
          proposed_installments: input.credit.installmentPeriod,
          monthly_income: input.credit.monthlyIncome,
          occupation: input.credit.occupation,
          employer: input.credit.employer,
          application_type: "checkout",
        });
      if (creditAppError) {
        console.error("Failed to create credit application:", creditAppError);
      }
    }

    // ---- Coupon usage: increment only after the order succeeded.
    // Guarded on the previously-read usage_count so a concurrent
    // redemption cannot silently double-count. A failure here is
    // logged, not fatal — the order itself is already placed. ----
    if (coupon) {
      const { data: bumped, error: couponError } = await supabase
        .from("coupons")
        .update({ usage_count: coupon.usage_count + 1 })
        .eq("id", coupon.id)
        .eq("usage_count", coupon.usage_count)
        .select("id");
      if (couponError || !bumped || bumped.length === 0) {
        console.error(
          `Coupon usage increment failed for ${coupon.code}:`,
          couponError ?? "concurrent redemption — usage_count changed"
        );
      }
    }

    return NextResponse.json(
      {
        orderId: insertedOrder.id,
        orderNumber,
        subtotal,
        discount,
        total,
        couponCode: coupon ? coupon.code : null,
        paymentMethod: orderRow.payment_method,
        orderType: input.orderType,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating order:", err);
    return NextResponse.json(
      { error: getErrorMessage(err, "Failed to place order. Please try again.") },
      { status: 500 }
    );
  }
}
