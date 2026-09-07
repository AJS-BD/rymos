import { getSupabase, isConfigured } from "@/lib/supabase";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProductReviews from "@/components/reviews/product-reviews";

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
    .limit(4);
  return data || [];
}

const productImages: Record<string, string> = {
  "Samsung Galaxy S24 Ultra": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80",
  "iPhone 15 Pro Max": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
  "iPhone 15 128GB": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
  "OnePlus 12": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  "Xiaomi 14 Ultra": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  "Samsung Galaxy S23 FE 5G": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80",
  "AirPods Pro 2nd Gen": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80",
  "Anker 20W Charger": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80",
  "Apple Watch SE 2nd Gen": "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600&q=80",
  "Apple Watch Series 9": "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600&q=80",
  "Vivo V20 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  "Realme 12 Pro+ 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  "Nothing Phone (2a)": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  "POCO X6 Pro 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
};

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
            <p className="text-gray-500 mt-2">The product you're looking for doesn't exist.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const related = await getRelatedProducts(product.category, product.id);
  const imageUrl = productImages[product.name] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80";
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-gray-700">Home</a>
        <span>/</span>
        <a href="/products" className="hover:text-gray-700">Products</a>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* Product Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            {product.brand && (
              <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">{product.brand}</p>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">
              ৳{product.price.toLocaleString()}
            </span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-lg sm:text-xl text-gray-400 line-through">
                  ৳{product.original_price.toLocaleString()}
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-gray-600">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          {/* Specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Specifications</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 capitalize">{key}</p>
                    <p className="text-sm font-medium text-gray-900">{value as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
              Add to Cart
            </button>
            <button className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Buy Now
            </button>
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            {product.is_featured && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Featured
              </span>
            )}
            {product.is_new_arrival && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                New Arrival
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Product Reviews Section */}
      <ProductReviews productId={product.id} />

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p: any) => (
              <a key={p.id} href={`/products/${p.id}`} className="group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={productImages[p.name] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80"}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="mt-2 font-medium text-sm text-gray-900">{p.name}</h3>
                <p className="text-sm text-gray-500">৳{p.price.toLocaleString()}</p>
              </a>
            ))}
          </div>
        </div>
        )}
        </div>
      </main>
      <Footer />
    </>
  );
}
