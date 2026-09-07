import ProductCard from "@/components/products/product-card";

const newArrivals = [
  {
    id: "vivo-v20-5g",
    name: "Vivo V20 5G",
    price: 19999,
    originalPrice: 24999,
    rating: 4.3,
    reviewCount: 67,
    image: "/images/products/placeholder.png",
  },
  {
    id: "realme-12-pro-plus",
    name: "Realme 12 Pro+ 5G",
    price: 25999,
    originalPrice: 29999,
    rating: 4.4,
    reviewCount: 89,
    image: "/images/products/placeholder.png",
  },
  {
    id: "nothing-phone-2a",
    name: "Nothing Phone (2a)",
    price: 39999,
    originalPrice: 44999,
    rating: 4.5,
    reviewCount: 123,
    image: "/images/products/placeholder.png",
  },
  {
    id: "poco-x6-pro-5g",
    name: "POCO X6 Pro 5G",
    price: 24999,
    originalPrice: 29999,
    rating: 4.6,
    reviewCount: 156,
    image: "/images/products/placeholder.png",
  },
];

export default function NewArrivals() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8">
          New Arrivals
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
