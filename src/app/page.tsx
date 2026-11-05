"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
  Smartphone,
} from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import StarRating from "@/components/shared/star-rating";

/**
 * Homepage v3 — storytelling layout inspired by the Uno Water site Xafor
 * shared (mobile-width screenshot, 5 Nov 2026), adapted to RYmos phones.
 * Uno's page, top to bottom, and how it maps here:
 *   1. Split hero — headline left, big product photo right, dark pill
 *      button. Here: top featured product, headline left, photo right,
 *      dark "Buy" pill + "Learn more" link. (Uno's hero is light; ours
 *      is dark at the top because the site header is white text until
 *      the user scrolls — a light hero would make it unreadable.)
 *   2. One huge full-width lifestyle photo band with the brand overlaid.
 *      Here: a second featured product's photo as a big rounded band,
 *      "RYmos" overlaid — or a bold gradient band when its photo is
 *      unusable.
 *   3. "About" — 2-column tiles (product photo + true line about the
 *      shop; lifestyle/product photo), then a wide tile + a trust tile
 *      with real numbers only (product/category counts from the DB).
 *   4. "Designed for you" — 3 photo tiles in a row with a short caption
 *      under each (real featured products, real photos/names).
 *   5. "Designed for simplicity" — light-grey band, simple steps with
 *      icons, big product photo below.
 *   6. "Take your RYmos anywhere" — 2 photos side by side with short
 *      real captions (battery / camera, from real specs only).
 *   7. Wide lifestyle band — photo left, headline + dark button right.
 *   8. Testimonial — ONE real approved review from the DB, big quote,
 *      reviewer name; initials in a coloured circle instead of photos
 *      of people we don't have. Omitted entirely when there is none.
 *   9. "Better tech, better living" article cards — OMITTED: the site
 *      has no blog/learning content, and nothing is invented here.
 *  10. FAQ — a few REAL questions from src/app/faq (already in the
 *      codebase), as an accordion, with a link to the full FAQ page.
 *  11. Dark footer — the site's own footer, untouched.
 *
 * Everything is from the database, nothing hardcoded: featured
 * products, prices (on product pages — none on the homepage), stock,
 * specs, reviews, category/product counts. No online-payment wording:
 * COD cash, in-store bKash/Nagad/Rocket/card, credit instalments.
 *
 * The DB product images are unreliable (hero Xiaomi has no usable
 * photo, OnePlus 12 is a chair photo, Samsung's box says "S21 Ultra").
 * No section depends on a single photo to carry it: every photo tile
 * has a strong gradient + typography fallback, and every section is
 * still complete as text + colour when a photo is wrong or missing.
 * A wrong-but-loading image cannot be detected in code — that has to
 * be fixed in the product data itself.
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

/** A spec value for one named feature, or null. */
function specValue(
  product: FeaturedProduct,
  keys: string[]
): string | null {
  if (!product.specs) return null;
  for (const key of keys) {
    for (const [k, v] of Object.entries(product.specs)) {
      if (k.toLowerCase() === key) {
        const text = String(v).trim();
        if (text) return text;
      }
    }
  }
  return null;
}

/**
 * A photo tile that never looks empty: the product's DB photo when it
 * loads, otherwise a bold gradient panel with huge typography.
 * `ratio` keeps the tile's shape even when the photo is missing.
 */
function PhotoTile({
  product,
  ratio = "aspect-[4/3]",
  rounded = "rounded-3xl",
  showName = false,
}: {
  product: FeaturedProduct;
  ratio?: string;
  rounded?: string;
  showName?: boolean;
}) {
  const src = productImage(product);
  const [failed, setFailed] = useState(false);
  const showImage = src !== null && !failed;

  if (!showImage) {
    return (
      <div
        className={`relative ${ratio} ${rounded} ${gradientForId(
          product.id
        )} overflow-hidden flex flex-col items-center justify-center px-6 text-center`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-6 select-none text-[8rem] font-bold leading-none text-white/10"
        >
          {(product.brand ?? product.name).charAt(0).toUpperCase()}
        </span>
        <p className="relative text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
          {product.brand ?? "RYmos"}
        </p>
        <p className="relative mt-2 text-3xl font-bold tracking-tight text-white text-balance">
          {product.name}
        </p>
        {showName && (
          <p className="relative mt-2 text-sm text-white/85">
            {punchySubhead(product)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${ratio} ${rounded} overflow-hidden bg-[#f5f5f7]`}>
      <Link href={`/products/${product.id}`} className="block h-full w-full">
        <Image
          src={src}
          alt={product.name}
          fill
          loading="lazy"
          onError={() => setFailed(true)}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </Link>
    </div>
  );
}

/** Real FAQ questions, copied from src/app/faq (already in the app) —
 *  a small selection for the homepage, with a link to the full page. */
const HOME_FAQ = [
  {
    q: "What payment methods do you accept?",
    a: "We accept Cash on Delivery (COD) — pay in cash when your order arrives. If you pick up from our Dhaka store, you can pay in store with bKash, Nagad, Rocket or card. We do not take online payments. We also offer a buy-on-credit program, and instalments are paid in store or by bKash, Nagad, Rocket or card.",
  },
  {
    q: "How do I place an order?",
    a: "Browse our products, add items to your cart, and proceed to checkout. You can pay cash on delivery, pay in store when you pick up your order, or apply for our buy-on-credit program.",
  },
  {
    q: "Do you deliver nationwide?",
    a: "Yes! We deliver to all 64 districts of Bangladesh. Delivery times vary by location: 1-2 days for Dhaka, 2-4 days for major cities, and 3-5 days for other areas.",
  },
  {
    q: "What is your return policy?",
    a: "We offer a 7-day return policy for unused, unopened products in original packaging. For defective items, you have 14 days from delivery to request a return or exchange.",
  },
  {
    q: "How does the buy-on-credit program work?",
    a: "Our buy-on-credit program allows you to purchase products and pay in monthly installments. Apply through your account, get approved, and choose a payment plan that suits your budget.",
  },
  {
    q: "Are all products genuine?",
    a: "Absolutely. We source all products directly from authorized distributors and manufacturers. Every product comes with a valid manufacturer warranty and is 100% genuine.",
  },
];

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.98]);
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [reviews, setReviews] = useState<ApprovedReview[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    async function loadHomepage() {
      // Supabase not configured — show the typographic hero instead of
      // fake products or a crash.
      if (!isConfigured()) {
        setLoading(false);
        return;
      }
      const supabase = getSupabase();
      const [productsRes, reviewsRes, categoriesRes, countRes] =
        await Promise.all([
          supabase
            .from("products")
            .select("id,name,brand,price,original_price,stock,specs,images,category")
            .eq("is_featured", true)
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("product_reviews")
            .select("id,customer_name,rating,content,is_verified_purchase,created_at,products(name)")
            .eq("is_approved", true)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("categories")
            .select("id,name,slug")
            .order("name", { ascending: true })
            .limit(10),
          supabase
            .from("products")
            .select("id", { count: "exact", head: true }),
        ]);
      if (productsRes.error) {
        console.error("Homepage featured products load error:", productsRes.error);
      } else if (productsRes.data) {
        setFeaturedProducts(
          (productsRes.data as FeaturedProduct[]).map((p) => ({
            ...p,
            price: Number(p.price),
            stock: p.stock ?? 0,
          }))
        );
      }
      if (reviewsRes.error) {
        console.error("Homepage reviews load error:", reviewsRes.error);
      } else if (reviewsRes.data) {
        setReviews(
          (reviewsRes.data as unknown as Array<{
            id: string;
            customer_name: string | null;
            rating: number;
            content: string;
            is_verified_purchase: boolean;
            products: { name: string } | { name: string }[] | null;
          }>).map((r) => ({
            id: r.id,
            customer_name: r.customer_name,
            rating: r.rating,
            content: r.content,
            is_verified_purchase: r.is_verified_purchase ?? false,
            product_name: Array.isArray(r.products)
              ? r.products[0]?.name ?? null
              : r.products?.name ?? null,
          }))
        );
      }
      if (!categoriesRes.error && categoriesRes.data) {
        setCategories(categoriesRes.data as Category[]);
      }
      if (!countRes.error && typeof countRes.count === "number") {
        setProductCount(countRes.count);
      }
      setLoading(false);
    }
    loadHomepage();
  }, []);

  const handleAddToCart = (product: FeaturedProduct) => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (product.stock <= 0) return;
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

  const heroProduct = featuredProducts[0] ?? null;
  const bandProduct = featuredProducts[1] ?? null;
  const aboutProduct = featuredProducts[2] ?? heroProduct;
  const designedProducts = featuredProducts.slice(1, 4);
  const anywhereProducts = featuredProducts.slice(1, 3);
  const wideProduct = featuredProducts[3] ?? featuredProducts[1] ?? heroProduct;
  const review = reviews[0] ?? null;

  /** Uno-style dark pill "Buy" + "Learn more" link. */
  const buyButtons = (product: FeaturedProduct, light: boolean) => {
    const outOfStock = product.stock <= 0;
    return (
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {outOfStock ? (
          <span className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-medium text-white/60">
            Out of stock
          </span>
        ) : (
          <button
            onClick={() => handleAddToCart(product)}
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
              light
                ? "bg-[#1d1d1f] text-white hover:bg-black"
                : "bg-white text-[#1d1d1f] hover:bg-white/90"
            }`}
          >
            Buy
          </button>
        )}
        <Link
          href={`/products/${product.id}`}
          className={`text-sm font-medium hover:underline ${
            light ? "text-[#1d1d1f]" : "text-white"
          }`}
        >
          Learn more &gt;
        </Link>
      </div>
    );
  };

  const initials = (name: string | null) =>
    (name ?? "Verified customer")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "R";

  return (
    <main className="flex-1 bg-white">
      {/* 1. Hero — split: headline left, big product photo right (stacks
          on mobile, like the Uno screenshot). Dark, because the header
          is white text until the user scrolls. */}
      {loading ? (
        <section className="bg-[#111111]">
          <div className="max-w-6xl mx-auto px-6 pt-28 sm:pt-36 pb-16">
            <div className="h-10 w-2/3 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-6 w-1/2 mt-5 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-10 w-40 mt-8 rounded-full bg-white/10 animate-pulse" />
            <div className="h-[300px] sm:h-[420px] w-full mt-12 rounded-3xl bg-white/10 animate-pulse" />
          </div>
        </section>
      ) : heroProduct ? (
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="bg-[#111111] text-white overflow-hidden"
        >
          <div className="max-w-6xl mx-auto px-6 pt-28 sm:pt-36 pb-14 sm:pb-20 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
            <div>
              {heroProduct.brand && (
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                  {heroProduct.brand}
                </p>
              )}
              <h1 className="mt-4 text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.02] text-balance">
                {heroProduct.name}
              </h1>
              <p className="mt-5 text-xl sm:text-2xl text-white/70 leading-snug">
                {punchySubhead(heroProduct)}
              </p>
              {buyButtons(heroProduct, false)}
              <p className="mt-6 text-sm text-white/50">
                Pay cash on delivery, or pick up in store.
              </p>
            </div>
            <div>
              <PhotoTile product={heroProduct} ratio="aspect-[4/3]" showName />
            </div>
          </div>
        </motion.section>
      ) : (
        /* Zero featured products: bold colourful typographic hero. */
        <section className="bg-gradient-to-br from-[#0071e3] via-[#5e5ce6] to-[#bf5af2] text-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 pt-28 sm:pt-36 pb-16 sm:pb-24 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
              RYmos
            </p>
            <h1 className="mt-4 text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight text-balance">
              Technology, Made Yours.
            </h1>
            <p className="mt-6 text-xl sm:text-2xl text-white/85 max-w-2xl mx-auto">
              The latest smartphones and premium accessories.
            </p>
            <div className="mt-8">
              <Link
                href="/products"
                className="inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#1d1d1f] hover:bg-white/90 transition-colors"
              >
                Shop all products
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. Full-width lifestyle band — a second product's photo, big and
          rounded, with "RYmos" overlaid. Gradient + huge type when the
          photo is unusable, never a blank band. */}
      {!loading && bandProduct && (
        <section className="px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="relative overflow-hidden rounded-3xl">
            {productImage(bandProduct) ? (
              <div className="relative aspect-[16/10] sm:aspect-[21/9]">
                <Image
                  src={productImage(bandProduct) as string}
                  alt={bandProduct.name}
                  fill
                  loading="lazy"
                  onError={() => {}}
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/25" />
              </div>
            ) : (
              <div
                className={`aspect-[16/10] sm:aspect-[21/9] ${gradientForId(
                  bandProduct.id
                )} flex flex-col items-center justify-center px-6 text-center`}
              >
                <p className="text-5xl sm:text-7xl font-bold tracking-tight text-white">
                  RYmos
                </p>
                <p className="mt-3 text-lg sm:text-2xl text-white/85">
                  {bandProduct.name}
                </p>
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
              <p className="text-4xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-lg">
                RYmos
              </p>
              <p className="mt-2 text-base sm:text-xl text-white/90 drop-shadow">
                The latest phones, right here in Dhaka.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. About RYmos — two tiles, then a wide tile + a trust tile
          with real counts only. */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] text-center">
          About RYmos
        </h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {aboutProduct && (
            <article className="rounded-3xl bg-[#f5f5f7] overflow-hidden">
              <PhotoTile product={aboutProduct} ratio="aspect-[4/3]" rounded="rounded-none" />
              <div className="p-6 sm:p-8">
                <h3 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
                  Since 2019, a Dhaka phone store you can trust.
                </h3>
                <p className="mt-2 text-base text-[#6e6e73] leading-relaxed">
                  RYmos started in 2019 as a small electronics shop in Dhaka.
                  Pay cash on delivery, pay in store, or buy on credit —
                  the way that suits you.
                </p>
              </div>
            </article>
          )}
          {wideProduct && wideProduct.id !== aboutProduct?.id && (
            <article className="rounded-3xl bg-[#f5f5f7] overflow-hidden">
              <PhotoTile product={wideProduct} ratio="aspect-[4/3]" rounded="rounded-none" />
              <div className="p-6 sm:p-8">
                <h3 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
                  {wideProduct.name}
                </h3>
                <p className="mt-2 text-base text-[#6e6e73] leading-relaxed">
                  {punchySubhead(wideProduct)}
                </p>
                <Link
                  href={`/products/${wideProduct.id}`}
                  className="mt-3 inline-block text-sm font-medium text-[#0071e3] hover:underline"
                >
                  Learn more &gt;
                </Link>
              </div>
            </article>
          )}
        </div>
        <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-3xl bg-gradient-to-br from-[#0071e3] to-[#5e5ce6] p-8 sm:p-10 text-white">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Pay your way.
            </h3>
            <p className="mt-2 text-white/85 leading-relaxed">
              Cash on delivery, or pick up and pay in store with bKash,
              Nagad, Rocket or card. No online payments — simple and
              straightforward.
            </p>
          </div>
          <div className="rounded-3xl bg-[#f5f5f7] p-8 sm:p-10 flex flex-col justify-center">
            {productCount !== null && productCount > 0 ? (
              <>
                <p className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f]">
                  {productCount}+ products
                </p>
                <p className="mt-2 text-base text-[#6e6e73] leading-relaxed">
                  Smartphones and accessories in the store
                  {categories.length > 0
                    ? ` across ${categories.length} categories`
                    : ""}
                  .
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
                  Genuine phones, real warranty.
                </p>
                <p className="mt-2 text-base text-[#6e6e73] leading-relaxed">
                  Every product comes from authorized distributors, with a
                  valid manufacturer warranty.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. Designed for you — 3 photo tiles with a caption under each. */}
      {designedProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] text-center">
            Designed for you
          </h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {designedProducts.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <PhotoTile product={product} ratio="aspect-[4/5]" />
                <h3 className="mt-4 text-lg font-semibold text-[#1d1d1f]">
                  <Link href={`/products/${product.id}`}>{product.name}</Link>
                </h3>
                <p className="mt-1 text-sm text-[#6e6e73] leading-relaxed">
                  {punchySubhead(product)}
                </p>
              </motion.article>
            ))}
          </div>
        </section>
      )}

      {/* 5. Designed for simplicity — light-grey band, simple steps,
          big product photo below. */}
      <section className="mt-16 sm:mt-24 bg-[#f5f5f7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] text-center">
            Designed for simplicity
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#6e6e73] text-center max-w-2xl mx-auto">
            No accounts to set up, no online payment to figure out. Just
            pick a phone and pay the way you like.
          </p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: Smartphone,
                title: "Choose your phone",
                text: "Browse the latest smartphones and accessories.",
              },
              {
                icon: Banknote,
                title: "Pay your way",
                text: "Cash on delivery, or in store with bKash, Nagad, Rocket or card.",
              },
              {
                icon: RotateCcw,
                title: "Easy returns",
                text: "Changed your mind? 7-day returns on unused products.",
              },
            ].map((item) => (
              <div key={item.title}>
                <item.icon
                  className="w-7 h-7 mx-auto text-[#1d1d1f]"
                  strokeWidth={1.5}
                />
                <h3 className="mt-4 text-lg font-semibold text-[#1d1d1f]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-[#6e6e73] leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          {heroProduct && (
            <div className="mt-12 max-w-3xl mx-auto">
              <PhotoTile product={heroProduct} ratio="aspect-[16/9]" />
            </div>
          )}
        </div>
      </section>

      {/* 6. Take your RYmos anywhere — 2 photos, short real captions. */}
      {anywhereProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] text-center">
            Take your RYmos anywhere.
          </h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {anywhereProducts.map((product) => {
              const battery = specValue(product, ["battery"]);
              const camera = specValue(product, ["rear_camera", "camera"]);
              const caption = battery
                ? `${battery} battery — all day, every day.`
                : camera
                  ? `${camera} camera — every shot, ready.`
                  : punchySubhead(product);
              return (
                <article key={product.id}>
                  <PhotoTile product={product} ratio="aspect-[4/3]" />
                  <h3 className="mt-4 text-lg font-semibold text-[#1d1d1f]">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#6e6e73] leading-relaxed">
                    {caption}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. Wide lifestyle band — photo left, headline + dark button right. */}
      {wideProduct && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24">
          <div className="rounded-3xl bg-[#f5f5f7] overflow-hidden grid grid-cols-1 md:grid-cols-2">
            <PhotoTile product={wideProduct} ratio="aspect-[4/3] md:aspect-auto" rounded="rounded-none" />
            <div className="p-8 sm:p-12 flex flex-col justify-center">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f]">
                The latest phones. No extra hassle.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#6e6e73] leading-relaxed">
                Order online and pay cash on delivery, or pick up in our
                Dhaka store and pay with bKash, Nagad, Rocket or card.
                Buying on credit? Apply and pay in instalments.
              </p>
              <div className="mt-6">
                <Link
                  href="/products"
                  className="inline-block rounded-full bg-[#1d1d1f] px-6 py-2.5 text-sm font-medium text-white hover:bg-black transition-colors"
                >
                  Shop all products
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. Testimonial — ONE real approved review, big quote, initials
          in a coloured circle. Omitted entirely when there is none. */}
      {review && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 text-center">
          <div className="flex justify-center">
            <span
              className={`w-16 h-16 rounded-full ${gradientForId(
                review.id
              )} flex items-center justify-center text-2xl font-bold text-white`}
            >
              {initials(review.customer_name)}
            </span>
          </div>
          <blockquote className="mt-6 text-2xl sm:text-3xl font-medium tracking-tight text-[#1d1d1f] leading-snug text-balance">
            &ldquo;{review.content}&rdquo;
          </blockquote>
          <div className="mt-5 flex justify-center">
            <StarRating rating={review.rating} />
          </div>
          <p className="mt-3 text-base font-semibold text-[#1d1d1f]">
            {review.customer_name ?? "Verified customer"}
          </p>
          <p className="text-sm text-[#86868b]">
            {review.product_name ? `on ${review.product_name}` : ""}
            {review.product_name && review.is_verified_purchase ? " · " : ""}
            {review.is_verified_purchase ? "Verified purchase" : ""}
          </p>
        </section>
      )}

      {/* 9. "Better tech, better living" article cards — OMITTED. The site
          has no blog/learning content, and nothing is invented here. */}

      {/* 10. FAQ — real questions from src/app/faq, as an accordion. */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-24">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] text-center">
          Frequently asked questions
        </h2>
        <p className="mt-3 text-base text-[#6e6e73] text-center">
          Can&apos;t find what you&apos;re looking for?{" "}
          <Link href="/faq" className="text-[#0071e3] hover:underline">
            See all FAQs
          </Link>
        </p>
        <div className="mt-8 space-y-3">
          {HOME_FAQ.map((item, index) => (
            <div
              key={index}
              className="border border-[#e5e5ea] rounded-2xl overflow-hidden bg-white"
            >
              <button
                onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#f5f5f7] transition-colors"
                aria-expanded={faqOpen === index}
              >
                <span className="font-medium text-[#1d1d1f] pr-4">
                  {item.q}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-[#86868b] flex-shrink-0 transition-transform duration-200 ${
                    faqOpen === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  faqOpen === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-5 pb-4 text-[#6e6e73] text-sm leading-relaxed">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="inline-block rounded-full bg-[#1d1d1f] px-6 py-2.5 text-sm font-medium text-white hover:bg-black transition-colors"
          >
            See all FAQs
          </Link>
        </div>
      </section>

      {/* Shop with confidence — the shop's real options, kept from v2
          (Uno has no equivalent strip, but the shop's payment/returns
          options are the trust message that replaces it). */}
      <section className="border-t border-[#f5f5f7]">
        <div className="max-w-7xl mx-auto px-6 py-14 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] text-center">
            Shop with confidence.
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              {
                icon: Banknote,
                title: "Cash on delivery",
                text: "Pay in cash when your order arrives.",
              },
              {
                icon: Store,
                title: "Pay in store",
                text: "Pick up and pay with bKash, Nagad, Rocket or card.",
              },
              {
                icon: CreditCard,
                title: "Buy on credit",
                text: "Apply for credit and pay in instalments.",
              },
              {
                icon: RotateCcw,
                title: "Easy returns",
                text: "Changed your mind? Request a return from your orders.",
              },
            ].map((item) => (
              <div key={item.title}>
                <item.icon
                  className="w-7 h-7 mx-auto text-[#1d1d1f]"
                  strokeWidth={1.5}
                />
                <h3 className="mt-4 text-lg font-semibold text-[#1d1d1f]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-[#86868b] leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
