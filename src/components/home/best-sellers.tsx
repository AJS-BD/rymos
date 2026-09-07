import ProductCard from "@/components/products/product-card";

const bestSellers = [
  {
    id: "airpods-pro-2",
    name: "AirPods Pro 2nd Gen",
    price: 24999,
    originalPrice: 29999,
    rating: 4.7,
    reviewCount: 456,
    image: "/images/products/placeholder.png",
  },
  {
    id: "anker-20w-charger",
    name: "Anker 20W Charger",
    price: 1399,
    originalPrice: 1999,
    rating: 4.5,
    reviewCount: 234,
    image: "/images/products/placeholder.png",
  },
  {
    id: "iphone-15-128gb",
    name: "iPhone 15 128GB",
    price: 69999,
    originalPrice: 79999,
    rating: 4.8,
    reviewCount: 567,
    image: "/images/products/placeholder.png",
  },
  {
    id: "samsung-s23-fe",
    name: "Samsung Galaxy S23 FE 5G",
    price: 54999,
    originalPrice: 64999,
    rating: 4.6,
    reviewCount: 345,
    image: "/images/products/placeholder.png",
  },
  {
    id: "apple-watch-se-2",
    name: "Apple Watch SE 2nd Gen",
    price: 29999,
    originalPrice: 34999,
    rating: 4.4,
    reviewCount: 189,
    image: "/images/products/placeholder.png",
  },
];

export default function BestSellers() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8">
          Best Sellers
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
