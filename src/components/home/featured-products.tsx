import ProductCard from "@/components/products/product-card";

const featuredProducts = [
  {
    id: "samsung-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    specs: "256GB • 12GB RAM",
    price: 129999,
    originalPrice: 149999,
    discount: 12,
    rating: 4.8,
    reviewCount: 245,
    image: "/images/products/placeholder.png",
  },
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    specs: "256GB • 8GB RAM",
    price: 164999,
    originalPrice: 179999,
    discount: 9,
    rating: 4.9,
    reviewCount: 312,
    image: "/images/products/placeholder.png",
  },
  {
    id: "oneplus-12",
    name: "OnePlus 12",
    specs: "256GB • 12GB RAM",
    price: 79999,
    originalPrice: 89999,
    discount: 10,
    rating: 4.6,
    reviewCount: 189,
    image: "/images/products/placeholder.png",
  },
  {
    id: "xiaomi-14-ultra",
    name: "Xiaomi 14 Ultra",
    specs: "512GB • 16GB RAM",
    price: 54999,
    originalPrice: 64999,
    discount: 3,
    rating: 4.5,
    reviewCount: 98,
    image: "/images/products/placeholder.png",
  },
];

export default function FeaturedProducts() {
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
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
