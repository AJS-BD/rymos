import { getSupabase, isConfigured } from "@/lib/supabase";
import ProductDetailClient from "./product-detail-client";

async function getProduct(id: string) {
  if (!isConfigured()) return null;
  const supabase = getSupabase();
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  return data;
}

async function getRelatedProducts(category: string, excludeId: string) {
  if (!isConfigured()) return [];
  const supabase = getSupabase();
  const { data } = await supabase.from("products").select("*").eq("category", category).neq("id", excludeId).limit(6);
  return data || [];
}

async function getYouTubeReviews(productId: string) {
  if (!isConfigured()) return [];
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("youtube_reviews")
      .select("id, youtube_url, title, creator_name, thumbnail_url")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Error fetching youtube_reviews:", error);
    return [];
  }
}

async function getProductReviews(productId: string) {
  if (!isConfigured()) return [];
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, content, is_verified_purchase, created_at, customer_name")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    return (data || []).map((review: any) => ({
      id: review.id,
      rating: review.rating,
      content: review.content,
      is_verified_purchase: review.is_verified_purchase,
      created_at: review.created_at,
      customers: { full_name: review.customer_name },
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
          <p className="text-gray-500 mt-2">The product you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </main>
    );
  }

  const [related, youtubeReviews, reviews] = await Promise.all([
    getRelatedProducts(product.category, product.id),
    getYouTubeReviews(product.id),
    getProductReviews(product.id),
  ]);

  return (
    <ProductDetailClient
      product={product}
      related={related}
      youtubeReviews={youtubeReviews}
      reviews={reviews}
    />
  );
}
