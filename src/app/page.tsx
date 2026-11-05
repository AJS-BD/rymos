"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Store,
  CreditCard,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Headphones,
  Tag,
  ShoppingBag,
} from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";
import StarRating from "@/components/shared/star-rating";

/**
 * Homepage v4 — mobile e-commerce shop page (Daraz / Amazon mobile /
 * phone-shop app feel), NOT a brand-story page.
 *
 * Xafor's feedback on v3 (Uno Water storytelling): "More optimized,
 * make the design more like for mobile e-commerce website — still it
 * feels like other website. Change text, and some designs make it
 * more convenient."
 *
 * So, top to bottom, short and shoppable:
 *   1. Compact deal banner — top product, short shop text, "Shop now".
 *   2. Category chips (horizontal scroll on mobile) — All, Deals, and
 *      the real categories from the DB; tapping one opens that list.
 *   3. "Top picks" product grid — THE page. 2 columns on mobile, real
 *      photo, name, REAL PRICE in BDT big and clear, real stars only
 *      when the product has real approved reviews, stock badge, and an
 *      "Add to Bag" button on the card itself.
 *   4. Compact trust chips — COD, pay in store, credit, 7-day returns.
 *   5. "Shop by category" tiles — real categories, real product counts.
 *   6. One compact review card (real approved review only, if any).
 *   7. Short FAQ accordion (3 real questions, collapsed) — it still
 *      lives in full at /faq.
 *
 * Cut from v3: the "About RYmos" essay, "Designed for you/simplicity",
 * lifestyle bands, "Take your RYmos anywhere", the big testimonial,
 * and all long brand copy. Text throughout is short shop text:
 * "Top phones", "Best deals", "Shop now", "Add to Bag".
 *
 * Everything is from the database, nothing hardcoded: featured
 * products, prices in BDT, stock, categories, counts, reviews. A
 * discount badge ("-X%") only appears when the product's own
 * original_price in the DB is higher than its price — no invented
 * deals. No online-payment wording: COD cash, in-store
 * bKash/Nagad/Rocket/card, credit instalments.
 *
 * The DB product images are unreliable (hero Xiaomi has no usable
 * photo, OnePlus 12 is a chair photo, Samsung's box says "S21 Ultra").
 * Every card looks complete with a gradient + big brand-initial
 * fallback when a photo is missing or fails to load. A wrong-but-
 * loading image cannot be detected in code — that has to be fixed
 * in the product data itself.
 */
const placeholderImage = "/images/placeholder.svg";

interface FeaturedProduct {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  specs: Record<string, string | number | boolean> | null;
  images: string[] | null;
  category: string | null;
}

interface ApprovedReview {
  id: string;
  customer_name: string | null;
  rating: number;
  content: string;
  is_verified_purchase: boolean;
  product_name: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string | null;
}

/** Bold gradients, one per product (stable hash of the product id, so
 *  the same product always gets the same colour). Full class strings
 *  are written out literally so Tailwind picks them up. */
const GRADIENTS = [
  "bg-gradient-to-br from-[#0071e3] via-[#5e5ce6] to-[#bf5af2]",
  "bg-gradient-to-br from-[#ff375f] via-[#ff9f0a] to-[#ffd60a]",
  "bg-gradient-to-br from-[#30b0c7] via-[#0071e3] to-[#0a84ff]",
  "bg-gradient-to-br from-[#ff6482] via-[#bf5af2] to-[#5e5ce6]",
  "bg-gradient-to-br from-[#30d158] via-[#64d2ff] to-[#0071e3]",
  "bg-gradient-to-br from-[#ff9f0a] via-[#ff375f] to-[#bf5af2]",
];

function gradientForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 997;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

/** First image of a product, or null when it has none. */
function productImage(product: FeaturedProduct): string | null {
  return product.images && product.images.length > 0
    ? product.images[0]
    : null;
}

/** Real discount % from the DB's own original_price, or null — never
 *  invented. Only when original_price is genuinely higher than price. */
function discountPercent(product: FeaturedProduct): number | null {
  if (
    product.original_price !== null &&
    product.original_price > product.price &&
    product.original_price > 0
  ) {
    return Math.round((1 - product.price / product.original_price) * 100);
  }
  return null;
}

/**
 * ONE short punchy line per product, built only from its real spec
 * values. Picks the single most attractive spec. Never invents a spec:
 * with no usable spec it falls back to a plain generic line.
 */
function punchySubhead(product: FeaturedProduct): string {
  if (product.specs) {
    const specs: Record<string, string> = {};
    for (const [key, value] of Object.entries(product.specs)) {
      const text = String(value).trim();
      if (text) specs[key.toLowerCase()] = text;
    }
    const pick = (
      keys: string[],
      format: (value: string) => string
    ): string | null => {
      for (const key of keys) {
        if (specs[key]) return format(specs[key]);
      }
      return null;
    };
    const line =
      pick(["processor", "chip", "chipset"], (v) => `Powered by ${v}.`) ??
      pick(["rear_camera", "camera"], (v) => `${v} camera.`) ??
      pick(["battery"], (v) => `${v} battery.`) ??
      pick(["display", "screen"], (v) => `${v} display.`) ??
      pick(["charging"], (v) => `${v} charging.`) ??
      pick(["ram"], (v) => `${v} RAM.`) ??
      pick(["storage"], (v) => `${v} storage.`) ??
      pick(["os"], (v) => `Runs ${v}.`);
    if (line) {
      return line.length > 64 ? `${line.slice(0, 61).trimEnd()}…` : line;
    }
  }
  if (product.brand) return `The latest from ${product.brand}.`;
  return "New in. Ready for everything.";
}

/**
 * Product photo that never looks empty: the product's DB photo when it
 * loads, otherwise a bold gradient panel with a big brand initial and
 * the product name — a complete card, not a blank box.
 */
function ProductPhoto({ product }: { product: FeaturedProduct }) {
  const src = productImage(product);
  const [failed, setFailed] = useState(false);
  const showImage = src !== null && !failed;

  if (!showImage) {
    return (
      <div
        className={`relative aspect-square ${gradientForId(
          product.id
        )} overflow-hidden flex flex-col items-center justify-center px-3 text-center`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-4 select-none text-[6rem] font-bold leading-none text-white/15"
        >
          {(product.brand ?? product.name).charAt(0).toUpperCase()}
        </span>
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
          {product.brand ?? "RYmos"}
        </p>
        <p className="relative mt-1 text-lg font-bold tracking-tight text-white leading-tight line-clamp-2">
          {product.name}
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden bg-[#f5f5f7]">
      <Image
        src={src}
        alt={product.name}
        fill
        loading="lazy"
        onError={() => setFailed(true)}
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 25vw"
      />
    </div>
  );
}

/** The product card — the heart of the page. Price, stock, Add to Bag
 *  all on the card, thumb-friendly. */
function ProductCard({ product, rating }: {
  product: FeaturedProduct;
  rating: { avg: number; count: number } | null;
}) {
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const outOfStock = product.stock <= 0;
  const discount = discountPercent(product);

  const handleAddToBag = () => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (outOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand ?? "",
      price: product.price,
      stock: product.stock,
      images:
        product.images && product.images.length > 0
          ? product.images
          : [placeholderImage],
      category: product.category ?? "",
    });
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <Link href={`/products/${product.id}`} className="block">
        <ProductPhoto product={product} />
      </Link>
      <div className="flex flex-1 flex-col p-3">
        {product.brand && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {product.brand}
          </p>
        )}
        <h3 className="mt-0.5 text-sm font-semibold leading-snug text-gray-900 line-clamp-2 min-h-[2.5rem]">
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        {rating && (
          <div className="mt-1 flex items-center gap-1.5">
            <StarRating rating={Math.round(rating.avg)} />
            <span className="text-xs text-gray-500">
              {rating.avg.toFixed(1)} ({rating.count})
            </span>
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold tracking-tight text-gray-900">
            {formatBDT(product.price)}
          </span>
          {product.original_price !== null &&
            product.original_price > product.price && (
              <span className="text-xs text-gray-400 line-through">
                {formatBDT(product.original_price)}
              </span>
            )}
          {discount !== null && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
              -{discount}%
            </span>
          )}
        </div>
        <p className="mt-1 text-xs">
          {outOfStock ? (
            <span className="font-medium text-red-600">Out of stock</span>
          ) : (
            <span className="font-medium text-green-600">In stock</span>
          )}
        </p>
        <button
          onClick={handleAddToBag}
          disabled={outOfStock}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <ShoppingBag className="h-4 w-4" />
          {outOfStock ? "Out of stock" : "Add to Bag"}
        </button>
      </div>
    </article>
  );
}

/** Short FAQ — 3 real questions from src/app/faq, collapsed. */
const HOME_FAQ = [
  {
    q: "What payment methods do you accept?",
    a: "Cash on Delivery — pay in cash when your order arrives. Pick up in store and pay with bKash, Nagad, Rocket or card. We do not take online payments. Buy on credit is also available, with instalments paid the same ways.",
  },
  {
    q: "Do you deliver nationwide?",
    a: "Yes — all 64 districts of Bangladesh. 1–2 days in Dhaka, 2–4 days in major cities, 3–5 days elsewhere.",
  },
  {
    q: "What is your return policy?",
    a: "7-day returns for unused, unopened products in original packaging. Defective items: 14 days for a return or exchange.",
  },
];

function categoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("accessor") || n.includes("audio") || n.includes("ear") || n.includes("headphone"))
    return Headphones;
  return Smartphone;
}

export default function HomePage() {
  const router = useRouter();

  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [ratings, setRatings] = useState<
    Record<string, { avg: number; count: number }>
  >({});
  const [review, setReview] = useState<ApprovedReview | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    async function loadHomepage() {
      if (!isConfigured()) {
        setLoading(false);
        return;
      }
      const supabase = getSupabase();
      const [productsRes, categoriesRes, allCategoriesRes, reviewsRes] =
        await Promise.all([
          supabase
            .from("products")
            .select("id,name,brand,price,original_price,stock,specs,images,category")
            .eq("is_featured", true)
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("categories")
            .select("id,name,slug")
            .order("name", { ascending: true })
            .limit(12),
          supabase.from("products").select("category"),
          supabase
            .from("product_reviews")
            .select("id,customer_name,rating,content,is_verified_purchase,created_at,products(name)")
            .eq("is_approved", true)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

      let featured: FeaturedProduct[] = [];
      if (productsRes.error) {
        console.error("Homepage featured products load error:", productsRes.error);
      } else if (productsRes.data) {
        featured = (productsRes.data as FeaturedProduct[]).map((p) => ({
          ...p,
          price: Number(p.price),
          stock: p.stock ?? 0,
        }));
        setFeaturedProducts(featured);
      }
      if (!categoriesRes.error && categoriesRes.data) {
        setCategories(categoriesRes.data as Category[]);
      }
      if (!allCategoriesRes.error && allCategoriesRes.data) {
        const counts: Record<string, number> = {};
        for (const row of allCategoriesRes.data as { category: string | null }[]) {
          if (row.category) counts[row.category] = (counts[row.category] ?? 0) + 1;
        }
        setCategoryCounts(counts);
      }
      if (!reviewsRes.error && reviewsRes.data && reviewsRes.data.length > 0) {
        const r = reviewsRes.data[0] as unknown as {
          id: string;
          customer_name: string | null;
          rating: number;
          content: string;
          is_verified_purchase: boolean;
          products: { name: string } | { name: string }[] | null;
        };
        setReview({
          id: r.id,
          customer_name: r.customer_name,
          rating: r.rating,
          content: r.content,
          is_verified_purchase: r.is_verified_purchase ?? false,
          product_name: Array.isArray(r.products)
            ? r.products[0]?.name ?? null
            : r.products?.name ?? null,
        });
      }
      // Real per-product ratings — approved reviews only, averaged.
      if (featured.length > 0) {
        const { data: ratingRows, error: ratingError } = await supabase
          .from("product_reviews")
          .select("product_id,rating")
          .eq("is_approved", true)
          .in(
            "product_id",
            featured.map((p) => p.id)
          );
        if (!ratingError && ratingRows) {
          const sums: Record<string, { total: number; count: number }> = {};
          for (const row of ratingRows as { product_id: string; rating: number }[]) {
            const s = sums[row.product_id] ?? { total: 0, count: 0 };
            s.total += row.rating;
            s.count += 1;
            sums[row.product_id] = s;
          }
          const avgs: Record<string, { avg: number; count: number }> = {};
          for (const [id, s] of Object.entries(sums)) {
            avgs[id] = { avg: s.total / s.count, count: s.count };
          }
          setRatings(avgs);
        }
      }
      setLoading(false);
    }
    loadHomepage();
  }, []);

  const heroProduct = featuredProducts[0] ?? null;
  const hasDeals = featuredProducts.some((p) => discountPercent(p) !== null);

  const goCategory = (slug: string | null) => {
    if (!slug) {
      router.push("/products");
    } else {
      router.push(`/products?category=${encodeURIComponent(slug)}`);
    }
  };

  return (
    <main className="flex-1 bg-[#fafafa] pb-4">
      {/* 1. Compact deal banner — top product, short shop text, Shop now.
          Dark, because the header is white text until the user scrolls. */}
      {loading ? (
        <section className="bg-[#111111] px-5 pb-8 pt-24 sm:pt-28">
          <div className="mx-auto max-w-6xl">
            <div className="h-8 w-2/3 rounded-lg bg-white/10 animate-pulse" />
            <div className="mt-3 h-5 w-1/2 rounded-lg bg-white/10 animate-pulse" />
            <div className="mt-5 h-11 w-40 rounded-full bg-white/10 animate-pulse" />
          </div>
        </section>
      ) : heroProduct ? (
        <section className="bg-[#111111] px-5 pb-8 pt-24 text-white sm:pt-28">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                Top phones. Best prices in Dhaka.
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {heroProduct.name}
              </h1>
              <p className="mt-1.5 text-base text-white/70">
                {punchySubhead(heroProduct)}
              </p>
              <p className="mt-3 text-2xl font-bold">
                {formatBDT(heroProduct.price)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/products/${heroProduct.id}`}
                  className="inline-flex min-h-[44px] items-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Shop now
                </Link>
                <Link
                  href="/products"
                  className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-white/85 hover:text-white"
                >
                  See all phones
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="w-full max-w-[220px] shrink-0 overflow-hidden rounded-2xl sm:w-[220px]">
              <ProductPhoto product={heroProduct} />
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-br from-[#0071e3] via-[#5e5ce6] to-[#bf5af2] px-5 pb-10 pt-24 text-center text-white sm:pt-28">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Top phones. Best prices in Dhaka.
          </h1>
          <p className="mx-auto mt-2 max-w-md text-white/85">
            Smartphones and accessories — pay cash on delivery, or pick up
            in store.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900"
          >
            Shop all products
          </Link>
        </section>
      )}

      {/* 2. Category chips — horizontal scroll on mobile, sticky under
          the fixed header (h-12 mobile / h-14 desktop). */}
      <section className="sticky top-12 z-10 border-b border-gray-100 bg-white/95 backdrop-blur sm:top-14">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => router.push("/products")}
            className="shrink-0 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            All
          </button>
          <button
            onClick={() => router.push("/products?deals=true")}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-900"
          >
            <Tag className="h-3.5 w-3.5" />
            Deals
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => goCategory(cat.slug)}
              className="shrink-0 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-900"
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Top picks grid — the heart of the page. */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Top picks
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Best deals on the latest phones.
            </p>
          </div>
          <Link
            href="/products"
            className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-blue-600 hover:underline"
          >
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
              >
                <div className="aspect-square animate-pulse bg-gray-100" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                  <div className="h-5 w-1/2 animate-pulse rounded bg-gray-100" />
                  <div className="h-10 w-full animate-pulse rounded-full bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  rating={ratings[product.id] ?? null}
                />
              ))}
            </div>
            {hasDeals && (
              <div className="mt-5 text-center">
                <Link
                  href="/products?deals=true"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white"
                >
                  <Tag className="h-4 w-4" />
                  See all deals
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-8 text-center">
            <p className="font-semibold text-gray-900">
              No top picks right now.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Browse the full collection instead.
            </p>
            <Link
              href="/products"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Shop all products
            </Link>
          </div>
        )}
      </section>

      {/* 4. Trust chips — short shop language only. */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { icon: Banknote, label: "Cash on Delivery" },
            { icon: Store, label: "Pay in store: bKash, Nagad, Rocket, card" },
            { icon: CreditCard, label: "Buy on Credit" },
            { icon: RotateCcw, label: "Easy 7-day Returns" },
          ].map((item) => (
            <span
              key={item.label}
              className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700"
            >
              <item.icon className="h-4 w-4 text-gray-900" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {/* 5. Shop by category — real categories, real counts. */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Shop by category
            </h2>
            <Link
              href="/products"
              className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-blue-600 hover:underline"
            >
              See all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((cat) => {
              const Icon = categoryIcon(cat.name);
              const count = cat.slug ? categoryCounts[cat.slug] ?? 0 : 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => goCategory(cat.slug)}
                  className="flex min-h-[88px] flex-col items-start justify-center gap-1 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-gray-900"
                >
                  <Icon className="h-6 w-6 text-gray-900" />
                  <span className="text-sm font-semibold text-gray-900">
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {count} {count === 1 ? "product" : "products"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. One compact review — real approved review only, if any. */}
      {review && (
        <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} />
              <span className="text-sm font-semibold text-gray-900">
                {review.customer_name ?? "Verified customer"}
              </span>
              {review.is_verified_purchase && (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  Verified purchase
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-700 line-clamp-3">
              &ldquo;{review.content}&rdquo;
            </p>
            {review.product_name && (
              <p className="mt-1.5 text-xs text-gray-500">
                on {review.product_name}
              </p>
            )}
          </div>
        </section>
      )}

      {/* 7. Short FAQ — 3 real questions, collapsed by default. */}
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Quick answers
        </h2>
        <div className="mt-4 space-y-2">
          {HOME_FAQ.map((item, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
            >
              <button
                onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                className="flex min-h-[48px] w-full items-center justify-between px-4 py-3 text-left"
                aria-expanded={faqOpen === index}
              >
                <span className="text-sm font-semibold text-gray-900">
                  {item.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                    faqOpen === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  faqOpen === index ? "max-h-64" : "max-h-0"
                }`}
              >
                <p className="px-4 pb-4 text-sm leading-relaxed text-gray-600">
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-gray-500">
          More questions?{" "}
          <Link href="/faq" className="font-medium text-blue-600 hover:underline">
            See all FAQs
          </Link>
        </p>
      </section>
    </main>
  );
}
