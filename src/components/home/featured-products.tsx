import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import ProductCard from "@/components/products/product-card";

async function getFeaturedProducts() {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured — returning empty products");
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .limit(4);

  if (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }

  return data;
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            Featured Products
          </h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-white rounded-lg">
              All
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-alt)] rounded-lg">
              Smartphones
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-alt)] rounded-lg">
              Accessories
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-alt)] rounded-lg">
              Wearables
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                specs: product.specs
                  ? Object.entries(product.specs)
                      .slice(0, 2)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" • ")
                  : undefined,
                price: product.price,
                originalPrice: product.original_price,
                discount: product.original_price
                  ? Math.round(
                      ((product.original_price - product.price) /
                        product.original_price) *
                        100
                    )
                  : 0,
                rating: 4.5,
                reviewCount: Math.floor(Math.random() * 200) + 50,
                image: "/images/products/placeholder.png",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
