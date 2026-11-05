"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import StarRating from "@/components/shared/star-rating";

const fallbackImage =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80";

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

interface SpecTile {
  title: string;
  img: string;
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

/** Build up to 4 spec-highlight tiles from the real specs of the featured products. */
function buildSpecTiles(products: FeaturedProduct[]): SpecTile[] {
  const tiles: SpecTile[] = [];
  const seen = new Set<string>();

  const orderedProducts = [...products];
  for (const product of orderedProducts) {
    if (tiles.length >= 4 || !product.specs) continue;
    const entries = Object.entries(product.specs);
    entries.sort(([a], [b]) => {
      const ai = SPEC_KEY_ORDER.indexOf(a.toLowerCase());
      const bi = SPEC_KEY_ORDER.indexOf(b.toLowerCase());
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    for (const [key, value] of entries) {
      if (tiles.length >= 4) break;
      const label = formatSpecLabel(key);
      if (seen.has(label)) continue;
      const text = String(value).trim();
      if (!text) continue;
      seen.add(label);
      tiles.push({
        title: `${text} ${label}`,
        img:
          product.images && product.images.length > 0
            ? product.images[0]
            : fallbackImage,
      });
    }
  }
  return tiles;
}

/** Short description for the featured product, derived from its real specs. */
function specSummary(product: FeaturedProduct): string | null {
  if (!product.specs) return null;
  const parts = Object.entries(product.specs)
    .filter(([, v]) => String(v).trim() !== "")
    .slice(0, 3)
    .map(([k, v]) => `${String(v).trim()} ${k.toLowerCase()}`);
  return parts.length > 0 ? parts.join(" · ") : null;
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
          : [fallbackImage],
      category: product.category ?? "",
    });
  };

  const featuredProduct = featuredProducts[0] ?? null;
  const specTiles = buildSpecTiles(featuredProducts);
  const featuredImage =
    featuredProduct?.images && featuredProduct.images.length > 0
      ? featuredProduct.images[0]
      : fallbackImage;
  const featuredSummary = featuredProduct
    ? specSummary(featuredProduct)
    : null;

  return (
    <main className="flex-1">
      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen min-h-dvh flex items-center justify-center bg-black overflow-hidden"
      >
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-8xl font-semibold tracking-tight text-white"
          >
            Technology,<br />Made Yours
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-6 sm:mt-8 text-xl sm:text-2xl md:text-3xl font-normal text-gray-400 max-w-2xl mx-auto"
          >
            Discover the latest smartphones and premium accessories.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-10 flex items-center justify-center gap-8"
          >
            <Link
              href="/products"
              className="text-blue-400 hover:text-blue-300 text-lg sm:text-xl font-normal transition-colors"
            >
              Shop Now →
            </Link>
            <Link
              href="/about"
              className="text-gray-400 hover:text-white text-lg sm:text-xl font-normal transition-colors"
            >
              Learn More
            </Link>
          </motion.div>
        </div>

        {/* Hero Image - Full screen coverage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1920&q=85)` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
      </motion.section>

      {/* Product Showcase */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 text-center mb-4">
            The latest.
          </h2>
          <p className="text-xl sm:text-2xl text-gray-500 text-center mb-16 sm:mb-24">
            Take a look at what&apos;s new.
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="aspect-square rounded-2xl mb-6 bg-gray-100 animate-pulse" />
                  <div className="h-5 w-3/4 mx-auto rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-1/2 mx-auto mt-2 rounded bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center">
              <p className="text-lg text-gray-500 mb-6">
                No featured products right now. Check back soon, or browse the
                full collection.
              </p>
              <Link
                href="/products"
                className="text-blue-500 hover:text-blue-600 text-lg font-normal"
              >
                Browse all products →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, index) => {
                const outOfStock = product.stock <= 0;
                const img =
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : fallbackImage;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group text-center"
                  >
                    <Link href={`/products/${product.id}`}>
                      <div
                        className="aspect-square rounded-2xl overflow-hidden mb-6 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${img})` }}
                      />
                    </Link>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                      <Link href={`/products/${product.id}`}>{product.name}</Link>
                    </h3>
                    <p className="text-base text-gray-500">
                      ৳{product.price.toLocaleString()}
                    </p>
                    {outOfStock ? (
                      <span className="mt-3 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium inline-flex items-center gap-2">
                        Out of stock
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Bag
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Product — first featured product from the database */}
      {featuredProduct && (
        <section className="py-20 sm:py-32 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-sm font-medium text-blue-500 uppercase tracking-wider mb-3">
                  Featured
                </p>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 mb-6">
                  {featuredProduct.name}
                </h2>
                {featuredSummary && (
                  <p className="text-xl sm:text-2xl text-gray-500 mb-10 max-w-lg">
                    {featuredSummary}
                  </p>
                )}
                <div className="flex items-center gap-8">
                  <Link href={`/products/${featuredProduct.id}`} className="text-blue-500 hover:text-blue-600 text-lg font-normal">
                    Learn more →
                  </Link>
                  <Link href={`/products/${featuredProduct.id}`} className="text-blue-500 hover:text-blue-600 text-lg font-normal">
                    Buy
                  </Link>
                </div>
              </div>
              <div
                className="aspect-square rounded-3xl overflow-hidden shadow-sm bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${featuredImage})` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Spec Highlights — derived from the real specs of featured products */}
      {specTiles.length > 0 && (
        <section className="py-20 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 text-center mb-16 sm:mb-24">
              Built for everything.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {specTiles.map((spec, index) => (
                <motion.div
                  key={spec.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative aspect-video rounded-2xl overflow-hidden group bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${spec.img})` }}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-4 left-4">
                    <p className="text-white text-lg font-medium drop-shadow-lg">{spec.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials — real approved product reviews from the database */}
      {reviews.length > 0 && (
        <section className="py-20 sm:py-32 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 text-center mb-16">
              What people are saying.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-8 rounded-2xl shadow-sm"
                >
                  <div className="mb-4">
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-lg text-gray-900 leading-relaxed mb-6">&ldquo;{review.content}&rdquo;</p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-semibold text-gray-900">
                      {review.customer_name ?? "Verified customer"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {review.product_name ? `on ${review.product_name}` : ""}
                      {review.product_name && review.is_verified_purchase ? " · " : ""}
                      {review.is_verified_purchase ? "Verified purchase" : ""}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
