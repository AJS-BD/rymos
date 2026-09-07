import { getSupabase, isConfigured } from "@/lib/supabase";
import ProductDetailClient from "./product-detail-client";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

async function getProduct(id: string) {
  if (!isConfigured()) return null;
  const supabase = getSupabase();
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  return data;
}

async function getRelatedProducts(category: string, excludeId: string) {
  if (!isConfigured()) return [];
  const supabase = getSupabase();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .neq("id", excludeId)
    .limit(6);
  return data || [];
}

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
            <p className="text-gray-500 mt-2">The product you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const related = await getRelatedProducts(product.category, product.id);

  return (
    <>
      <Header />
      <main className="flex-1">
        <ProductDetailClient product={product} related={related} />
      </main>
      <Footer />
    </>
  );
}
