import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import ProductCard from "@/components/products/product-card";

async function getBestSellers() {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured — returning empty products");
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", false)
    .order("price", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching best sellers:", error);
    return [];
  }

  return data;
}

export default async function BestSellers() {
  const products = await getBestSellers();

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8">
          Best Sellers
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
