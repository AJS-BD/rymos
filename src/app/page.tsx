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
} from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import StarRating from "@/components/shared/star-rating";

/**
 * Homepage — Apple.com structure, rebuilt from a fresh look at apple.com
 * (5 Nov 2026).
 *
 * What Apple actually does on its homepage:
 *   - Dark nav, then ONE product per full-width band: huge product name,
 *     ONE short punchy subhead ("Pro further.", "Hello, hello.",
 *     "Sound in living color."), two pill buttons (solid blue "Learn
 *     more" + outlined "Buy"), and ONE single large product photo doing
 *     most of the work.
 *   - Then 2-column tile rows repeating the same pattern at half width
 *     (light grey band next to a black band, alternating).
 *   - Then a services/offers row, then entertainment, then the footer.
 *   - Apple shows NO prices on the homepage — price lives on the
 *     product page. This page follows that: no prices anywhere here.
 *
 * Layout here (all content from the database, nothing hardcoded):
 *   1. Hero band 1 — top featured product, black
 *   2. Hero band 2 — second featured product, light grey (#f5f5f7)
 *   3. Hero band 3 — third featured product, black (only if it exists)
 *   4. Promo tiles — the remaining featured products, 2-column, light
 *      and black alternating, same band pattern at half width
 *   5. Shop with confidence — the shop's real options only
 *   6. Testimonials — real approved product reviews only
 *
 * Why the first preview looked empty: the Vercel Preview deployment had
 * no Supabase env vars, so zero products loaded and the page fell back
 * to plain text. That is an env problem, not a design problem — but this
 * rebuild also makes sure a band is NEVER blank: if a product has no
 * usable image, the visual is a bold gradient panel with huge
 * typography instead of an empty placeholder box, and with zero
 * featured products the hero is a bold colourful typographic band.
 *
 * The header is transparent white text over the top of the page until
 * the user scrolls, so the first hero is deliberately black (like
 * Apple's iPhone hero) — a white first hero would make the header
 * unreadable.
 *
 * Product images come from the product records. A wrong-but-loading
 * image in the DB (e.g. a chair photo on a phone) cannot be detected
 * here — that has to be fixed in the product data itself.
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

/** Bold Apple-style gradients, one per product (picked by a stable hash
 *  of the product id, so the same product always gets the same colour).
 *  Full class strings are written out literally so Tailwind picks them up. */
const GRADIENTS = [
  "bg-gradient-to-br from-[#0071e3] via-[#5e5ce6] to-[#bf5af2]",
  "bg-gradient-to-br from-[#ff375f] via-[#ff9f0a] to-[#ffd60a]",
  "bg-gradient-to-br from-[#30b0c7] via-[#0071e3] to-[#0a84ff]",
  "bg-gradient-to-br from-[#ff6482] via-[#bf5af2] to-[#5e5ce6]",
  "bg-gradient-to-br from-[#30d158] via-[#64d2ff] to-[#0071e3]",
  "bg-gradient-to-br from-[#ff9f0a] via-[#ff375f] to-[#bf5af2]",
];

function gradientFor(product: FeaturedProduct): string {
  let hash = 0;
  for (let i = 0; i < product.id.length; i++) {
    hash = (hash * 31 + product.id.charCodeAt(i)) % 997;
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
 * The big visual of a band: the product's DB photo, large.
 * When there is no usable photo (none in the DB, or it fails to load),
 * the band stays full and striking — a bold gradient panel with huge
 * typography — instead of an empty placeholder box.
 */
function ProductVisual({
  product,
  dark,
  large,
}: {
  product: FeaturedProduct;
  dark: boolean;
  large?: boolean;
}) {
  const src = productImage(product);
  const [failed, setFailed] = useState(false);
  const showImage = src !== null && !failed;

  if (!showImage) {
    return (
      <div
        className={`relative mx-auto mt-10 sm:mt-14 w-full max-w-4xl overflow-hidden rounded-3xl ${gradientFor(product)} ${
          large ? "min-h-[340px] sm:min-h-[480px]" : "min-h-[280px] sm:min-h-[360px]"
        } flex flex-col items-center justify-center px-6 py-12 text-center`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 select-none text-[11rem] sm:text-[15rem] font-bold leading-none text-white/10"
        >
          {(product.brand ?? product.name).charAt(0).toUpperCase()}
        </span>
        <p className="relative text-sm sm:text-base font-semibold uppercase tracking-[0.3em] text-white/80">
          {product.brand ?? "RYmos"}
        </p>
        <p className="relative mt-3 text-5xl sm:text-7xl font-bold tracking-tight text-white text-balance">
          {product.name}
        </p>
        <p className="relative mt-4 text-lg sm:text-xl text-white/85">
          {punchySubhead(product)}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 sm:mt-14">
      <Link href={`/products/${product.id}`}>
        <Image
          src={src}
          alt={product.name}
          width={1200}
          height={900}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`mx-auto w-auto max-w-full object-contain ${
            large
              ? "max-h-[340px] sm:max-h-[520px]"
              : "max-h-[260px] sm:max-h-[360px]"
          } ${dark ? "" : ""}`}
        />
      </Link>
    </div>
  );
}

/**
 * ONE short punchy subhead per band, built only from the product's real
 * spec values — Apple style ("Pro further.", "Sound in living color.").
 * Picks the single most attractive spec and phrases it in one line.
 * Never invents a spec: with no usable spec it falls back to a plain
 * generic line, not a made-up feature.
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

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [reviews, setReviews] = useState<ApprovedReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomepage() {
      // Supabase not configured (placeholder client) — show the bold
      // typographic hero instead of fake products or a crash.
      if (!isConfigured()) {
        setLoading(false);
        return;
      }
      const supabase = getSupabase();
      const [productsRes, reviewsRes] = await Promise.all([
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
            products:
              | { name: string }
              | { name: string }[]
              | null;
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
  const secondHeroProduct = featuredProducts[1] ?? null;
  const thirdHeroProduct = featuredProducts[2] ?? null;
  const tileProducts = featuredProducts.slice(3);

  /** Apple's two pill buttons: solid blue "Learn more" + outlined "Buy". */
  const bandButtons = (product: FeaturedProduct, dark: boolean) => {
    const outOfStock = product.stock <= 0;
    return (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/products/${product.id}`}
          className="rounded-full bg-[#0071e3] px-5 py-2 text-sm sm:text-base font-medium text-white hover:bg-[#0077ed] transition-colors"
        >
          Learn more
        </Link>
        {outOfStock ? (
          <span
            className={`rounded-full border px-5 py-2 text-sm sm:text-base font-medium ${
              dark
                ? "border-white/30 text-white/50"
                : "border-[#86868b] text-[#86868b]"
            }`}
          >
            Out of stock
          </span>
        ) : (
          <button
            onClick={() => handleAddToCart(product)}
            className={`rounded-full border px-5 py-2 text-sm sm:text-base font-medium transition-colors ${
              dark
                ? "border-[#2997ff] text-[#2997ff] hover:bg-[#2997ff]/10"
                : "border-[#0066cc] text-[#0066cc] hover:bg-[#0066cc]/10"
            }`}
          >
            Buy
          </button>
        )}
      </div>
    );
  };

  /** One full-width Apple band: huge name, one punchy subhead, two pill
   *  buttons, one large photo (or a bold gradient visual). */
  const heroBand = (
    product: FeaturedProduct,
    dark: boolean,
    headingLevel: 1 | 2,
    withMotion: boolean
  ) => {
    const bg = dark ? "bg-black" : "bg-[#f5f5f7]";
    const nameColor = dark ? "text-white" : "text-[#1d1d1f]";
    const subColor = dark ? "text-[#a1a1a6]" : "text-[#6e6e73]";
    const Heading = headingLevel === 1 ? "h1" : "h2";
    const inner = (
      <div className="max-w-5xl mx-auto px-6 pt-24 sm:pt-32 pb-12 sm:pb-16 text-center">
        {product.brand && (
          <p className="text-sm sm:text-base font-medium text-[#86868b] uppercase tracking-widest mb-3">
            {product.brand}
          </p>
        )}
        <Heading className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-balance">
          <span className={nameColor}>{product.name}</span>
        </Heading>
        <p
          className={`mt-4 text-xl sm:text-2xl md:text-[28px] font-normal leading-snug ${subColor} max-w-2xl mx-auto`}
        >
          {punchySubhead(product)}
        </p>
        {bandButtons(product, dark)}
        <ProductVisual product={product} dark={dark} large />
      </div>
    );
    return withMotion ? (
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className={`relative overflow-hidden ${bg}`}
      >
        {inner}
      </motion.section>
    ) : (
      <section className={`overflow-hidden ${bg}`}>{inner}</section>
    );
  };

  /** Half-width promo tile: the same band pattern, smaller. */
  const promoTile = (product: FeaturedProduct, index: number) => {
    const dark = index % 2 === 1;
    const bg = dark ? "bg-black" : "bg-[#f5f5f7]";
    const nameColor = dark ? "text-white" : "text-[#1d1d1f]";
    const subColor = dark ? "text-[#a1a1a6]" : "text-[#6e6e73]";
    return (
      <motion.article
        key={product.id}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: (index % 2) * 0.08 }}
        className={`overflow-hidden px-6 pt-12 sm:pt-16 pb-10 sm:pb-12 text-center flex flex-col ${bg}`}
      >
        {product.brand && (
          <p className="text-xs sm:text-sm font-medium text-[#86868b] uppercase tracking-widest mb-2">
            {product.brand}
          </p>
        )}
        <h3 className="text-3xl sm:text-4xl md:text-[40px] font-semibold tracking-tight text-balance">
          <Link href={`/products/${product.id}`} className={nameColor}>
            {product.name}
          </Link>
        </h3>
        <p className={`mt-3 text-lg sm:text-xl font-normal ${subColor}`}>
          {punchySubhead(product)}
        </p>
        {bandButtons(product, dark)}
        <div className="flex-1 flex flex-col justify-end">
          <ProductVisual product={product} dark={dark} />
        </div>
      </motion.article>
    );
  };

  return (
    <main className="flex-1 bg-white">
      {loading ? (
        /* Loading: dark band skeleton so the page never opens blank. */
        <section className="bg-black overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 pt-24 sm:pt-32 pb-16 text-center">
            <div className="h-12 sm:h-16 w-3/4 mx-auto rounded-lg bg-white/10 animate-pulse" />
            <div className="h-6 w-1/2 mx-auto mt-6 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-10 w-48 mx-auto mt-8 rounded-full bg-white/10 animate-pulse" />
            <div className="h-[320px] sm:h-[480px] w-full mt-12 rounded-3xl bg-white/10 animate-pulse" />
          </div>
        </section>
      ) : heroProduct ? (
        <>
          {/* Hero band 1 — top featured product, black */}
          <div ref={heroRef}>{heroBand(heroProduct, true, 1, true)}</div>
          {/* Hero band 2 — second featured product, light grey */}
          {secondHeroProduct && heroBand(secondHeroProduct, false, 2, false)}
          {/* Hero band 3 — third featured product, black */}
          {thirdHeroProduct && heroBand(thirdHeroProduct, true, 2, false)}
        </>
      ) : (
        /* Zero featured products: a bold, colourful typographic hero —
         * gradient, huge type, shop button — never a plain empty message. */
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0071e3] via-[#5e5ce6] to-[#bf5af2]">
          <div className="max-w-5xl mx-auto px-6 pt-24 sm:pt-32 pb-16 sm:pb-24 text-center">
            <p className="text-sm sm:text-base font-semibold uppercase tracking-[0.3em] text-white/80">
              RYmos
            </p>
            <h1 className="mt-4 text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight text-white text-balance">
              Technology, Made Yours.
            </h1>
            <p className="mt-6 text-xl sm:text-2xl md:text-[28px] text-white/85 max-w-2xl mx-auto">
              The latest smartphones and premium accessories.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/products"
                className="rounded-full bg-white px-6 py-2.5 text-sm sm:text-base font-medium text-[#1d1d1f] hover:bg-white/90 transition-colors"
              >
                Shop all products
              </Link>
              <Link
                href="/products"
                className="rounded-full border border-white/70 px-6 py-2.5 text-sm sm:text-base font-medium text-white hover:bg-white/10 transition-colors"
              >
                Browse the collection
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Promo tiles — remaining featured products, 2-column, Apple style */}
      {!loading && tileProducts.length > 0 && (
        <section className="px-3 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tileProducts.map((product, index) => promoTile(product, index))}
          </div>
        </section>
      )}

      {/* Shop with confidence — the shop's real options, nothing invented */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] text-center">
            Shop with confidence.
          </h2>
          <p className="mt-3 text-lg sm:text-xl text-[#86868b] text-center">
            Pay your way, and return it easily if you change your mind.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
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

      {/* Testimonials — real approved product reviews from the database */}
      {reviews.length > 0 && (
        <section className="py-16 sm:py-24 bg-[#f5f5f7]">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] text-center mb-12 sm:mb-16">
              What people are saying.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review, index) => (
                <motion.figure
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="bg-white p-8 rounded-3xl"
                >
                  <div className="mb-4">
                    <StarRating rating={review.rating} />
                  </div>
                  <blockquote className="text-lg text-[#1d1d1f] leading-relaxed mb-6">
                    &ldquo;{review.content}&rdquo;
                  </blockquote>
                  <figcaption className="border-t border-[#f5f5f7] pt-4">
                    <p className="font-semibold text-[#1d1d1f]">
                      {review.customer_name ?? "Verified customer"}
                    </p>
                    <p className="text-sm text-[#86868b]">
                      {review.product_name ? `on ${review.product_name}` : ""}
                      {review.product_name && review.is_verified_purchase
                        ? " · "
                        : ""}
                      {review.is_verified_purchase ? "Verified purchase" : ""}
                    </p>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
