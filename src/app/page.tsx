"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Banknote,
  Store,
  CreditCard,
  RotateCcw,
} from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import StarRating from "@/components/shared/star-rating";

/**
 * Homepage — Apple.com style.
 *
 * Layout (all content from the database, nothing hardcoded):
 *   1. Hero — top featured product, black, huge name + spec tagline + price
 *   2. Hero — second featured product, light grey, same treatment
 *   3. "The latest." — the rest of the featured products as large tiles
 *   4. "Built for everything." — spec highlights, real spec values only
 *   5. Shop-with-confidence strip — the shop's real payment/return options
 *   6. Testimonials — real approved product reviews only
 *
 * The header is transparent white text over the top of the page until the
 * user scrolls, so the first hero is deliberately black (like Apple's
 * iPhone hero) — a white first hero would make the header unreadable.
 * The second hero is light grey; by then the header has turned dark.
 *
 * Product images come from the product records. A broken/missing image
 * falls back to the neutral local placeholder — never a random stock
 * photo. (Note: a wrong-but-loading image in the DB, e.g. a chair photo
 * on a phone, cannot be detected here — that has to be fixed in the
 * product data itself.)
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

const SPEC_KEY_ORDER = [
  "camera",
  "display",
  "battery",
  "processor",
  "storage",
  "ram",
];

function formatSpecLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** First image of a product, or the neutral placeholder when it has none. */
function productImage(product: FeaturedProduct): string {
  return product.images && product.images.length > 0
    ? product.images[0]
    : placeholderImage;
}

/** next/image that swaps to the neutral placeholder if the DB image fails
 *  (or its host is not in the next.config remotePatterns allowlist). */
function ProductImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={1200}
      height={900}
      loading="lazy"
      onError={() => {
        if (currentSrc !== placeholderImage) setCurrentSrc(placeholderImage);
      }}
      className={className}
    />
  );
}

/** Up to 4 spec-highlight strings from the real specs of featured products. */
function buildSpecHighlights(products: FeaturedProduct[]): string[] {
  const highlights: string[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    if (highlights.length >= 4 || !product.specs) continue;
    const entries = Object.entries(product.specs);
    entries.sort(([a], [b]) => {
      const ai = SPEC_KEY_ORDER.indexOf(a.toLowerCase());
      const bi = SPEC_KEY_ORDER.indexOf(b.toLowerCase());
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    for (const [key, value] of entries) {
      if (highlights.length >= 4) break;
      const text = String(value).trim();
      if (!text) continue;
      const highlight = `${text} ${formatSpecLabel(key)}`;
      if (seen.has(highlight)) continue;
      seen.add(highlight);
      highlights.push(highlight);
    }
  }
  return highlights;
}

/** Short tagline for a hero, derived from the product's real specs. */
function specSummary(product: FeaturedProduct): string | null {
  if (!product.specs) return null;
  const parts = Object.entries(product.specs)
    .filter(([, v]) => String(v).trim() !== "")
    .slice(0, 3)
    .map(([k, v]) => `${String(v).trim()} ${formatSpecLabel(k)}`);
  return parts.length > 0 ? parts.join(". ") : null;
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
      // Supabase not configured (placeholder client) — show the empty
      // state instead of fake products or a crash.
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
  const gridProducts = featuredProducts.slice(2);
  const specHighlights = buildSpecHighlights(featuredProducts);

  return (
    <main className="flex-1 bg-white">
      {/* Hero 1 — top featured product, black like Apple's iPhone hero */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative bg-black overflow-hidden"
      >
        <div className="max-w-5xl mx-auto px-6 pt-24 sm:pt-32 pb-12 sm:pb-16 text-center">
          {loading ? (
            <>
              <div className="h-12 sm:h-16 w-3/4 mx-auto rounded-lg bg-white/10 animate-pulse" />
              <div className="h-6 w-1/2 mx-auto mt-6 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-5 w-40 mx-auto mt-6 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-[320px] sm:h-[480px] w-full mt-12 rounded-3xl bg-white/10 animate-pulse" />
            </>
          ) : heroProduct ? (
            <>
              {heroProduct.brand && (
                <p className="text-sm sm:text-base font-medium text-[#86868b] uppercase tracking-widest mb-3">
                  {heroProduct.brand}
                </p>
              )}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white text-balance"
              >
                {heroProduct.name}
              </motion.h1>
              {specSummary(heroProduct) && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="mt-4 text-xl sm:text-2xl font-normal text-[#a1a1a6] max-w-2xl mx-auto"
                >
                  {specSummary(heroProduct)}
                </motion.p>
              )}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-4 text-base sm:text-lg text-[#86868b]"
              >
                From ৳{heroProduct.price.toLocaleString()}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-6 flex items-center justify-center gap-8"
              >
                <Link
                  href={`/products/${heroProduct.id}`}
                  className="text-[#2997ff] hover:underline text-lg sm:text-xl font-normal"
                >
                  Learn more &gt;
                </Link>
                <Link
                  href={`/products/${heroProduct.id}`}
                  className="text-[#2997ff] hover:underline text-lg sm:text-xl font-normal"
                >
                  Buy &gt;
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="mt-10 sm:mt-14"
              >
                <Link href={`/products/${heroProduct.id}`}>
                  <ProductImage
                    src={productImage(heroProduct)}
                    alt={heroProduct.name}
                    className="mx-auto max-h-[320px] sm:max-h-[480px] w-auto max-w-full object-contain rounded-3xl"
                  />
                </Link>
              </motion.div>
            </>
          ) : (
            <>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white text-balance">
                Technology, Made Yours
              </h1>
              <p className="mt-6 text-xl sm:text-2xl text-[#a1a1a6] max-w-2xl mx-auto">
                Discover the latest smartphones and premium accessories.
              </p>
              <div className="mt-8">
                <Link
                  href="/products"
                  className="text-[#2997ff] hover:underline text-lg sm:text-xl font-normal"
                >
                  Shop all products &gt;
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.section>

      {/* Hero 2 — second featured product, light grey */}
      {secondHeroProduct && (
        <section className="bg-[#f5f5f7] overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center">
            {secondHeroProduct.brand && (
              <p className="text-sm sm:text-base font-medium text-[#86868b] uppercase tracking-widest mb-3">
                {secondHeroProduct.brand}
              </p>
            )}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#1d1d1f] text-balance"
            >
              {secondHeroProduct.name}
            </motion.h2>
            {specSummary(secondHeroProduct) && (
              <p className="mt-4 text-xl sm:text-2xl font-normal text-[#6e6e73] max-w-2xl mx-auto">
                {specSummary(secondHeroProduct)}
              </p>
            )}
            <p className="mt-4 text-base sm:text-lg text-[#86868b]">
              From ৳{secondHeroProduct.price.toLocaleString()}
            </p>
            <div className="mt-6 flex items-center justify-center gap-8">
              <Link
                href={`/products/${secondHeroProduct.id}`}
                className="text-[#0066cc] hover:underline text-lg sm:text-xl font-normal"
              >
                Learn more &gt;
              </Link>
              <Link
                href={`/products/${secondHeroProduct.id}`}
                className="text-[#0066cc] hover:underline text-lg sm:text-xl font-normal"
              >
                Buy &gt;
              </Link>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mt-10 sm:mt-14"
            >
              <Link href={`/products/${secondHeroProduct.id}`}>
                <ProductImage
                  src={productImage(secondHeroProduct)}
                  alt={secondHeroProduct.name}
                  className="mx-auto max-h-[280px] sm:max-h-[440px] w-auto max-w-full object-contain rounded-3xl"
                />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* The latest — remaining featured products, large tiles */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] text-center mb-3">
            The latest.
          </h2>
          <p className="text-xl sm:text-2xl text-[#86868b] text-center mb-12 sm:mb-16">
            Take a look at what&apos;s new.
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[0, 1].map((i) => (
                <div key={i} className="bg-[#f5f5f7] rounded-3xl p-8 text-center">
                  <div className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
                  <div className="h-6 w-3/4 mx-auto mt-6 rounded bg-gray-200 animate-pulse" />
                  <div className="h-4 w-1/3 mx-auto mt-3 rounded bg-gray-200 animate-pulse" />
                </div>
              ))}
            </div>
          ) : gridProducts.length === 0 ? (
            <div className="text-center">
              <p className="text-lg text-[#86868b] mb-6">
                {featuredProducts.length === 0
                  ? "No featured products right now. Check back soon, or browse the full collection."
                  : "That's everything featured right now — browse the full collection for more."}
              </p>
              <Link
                href="/products"
                className="text-[#0066cc] hover:underline text-lg font-normal"
              >
                Browse all products &gt;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {gridProducts.map((product, index) => {
                const outOfStock = product.stock <= 0;
                return (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="bg-[#f5f5f7] rounded-3xl px-6 sm:px-10 pt-10 sm:pt-12 pb-8 text-center flex flex-col"
                  >
                    {product.brand && (
                      <p className="text-xs font-medium text-[#86868b] uppercase tracking-widest mb-2">
                        {product.brand}
                      </p>
                    )}
                    <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
                      <Link href={`/products/${product.id}`}>{product.name}</Link>
                    </h3>
                    <p className="mt-2 text-base text-[#6e6e73]">
                      From ৳{product.price.toLocaleString()}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-6">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-[#0066cc] hover:underline text-base"
                      >
                        Learn more &gt;
                      </Link>
                      {outOfStock ? (
                        <span className="text-base text-[#86868b]">Out of stock</span>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 py-2 text-sm font-medium text-white hover:bg-[#0077ed] transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Add to Bag
                        </button>
                      )}
                    </div>
                    <Link
                      href={`/products/${product.id}`}
                      className="mt-8 block"
                    >
                      <ProductImage
                        src={productImage(product)}
                        alt={product.name}
                        className="mx-auto max-h-[240px] sm:max-h-[300px] w-auto max-w-full object-contain transition-transform duration-500 hover:scale-[1.03]"
                      />
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Spec highlights — real spec values, clean text tiles */}
      {specHighlights.length > 0 && (
        <section className="py-16 sm:py-24 bg-[#f5f5f7]">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f] text-center mb-12 sm:mb-16">
              Built for everything.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {specHighlights.map((highlight, index) => (
                <motion.div
                  key={highlight}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="bg-white rounded-3xl px-8 py-12 sm:py-16 text-center"
                >
                  <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
                    {highlight}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How to pay — the shop's real options, nothing invented */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
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
                <item.icon className="w-6 h-6 mx-auto text-[#1d1d1f]" strokeWidth={1.5} />
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
                      {review.product_name && review.is_verified_purchase ? " · " : ""}
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
