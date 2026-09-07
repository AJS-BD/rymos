"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupabase, isConfigured } from "@/lib/supabase";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Search, Grid, List, ChevronRight, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number;
  stock: number;
  specs: any;
  images: string[];
  category: string;
  is_featured: boolean;
  is_new_arrival: boolean;
}

const productImages: Record<string, string> = {
  "Samsung Galaxy S24 Ultra": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
  "iPhone 15 Pro Max": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
  "iPhone 15 128GB": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
  "OnePlus 12": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Xiaomi 14 Ultra": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Samsung Galaxy S23 FE 5G": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
  "AirPods Pro 2nd Gen": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80",
  "Anker 20W Charger": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80",
  "Apple Watch SE 2nd Gen": "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&q=80",
  "Apple Watch Series 9": "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&q=80",
  "Vivo V20 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Realme 12 Pro+ 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Nothing Phone (2a)": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "POCO X6 Pro 5G": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
};

const categoryDescriptions: Record<string, string> = {
  smartphones: "Discover the latest smartphones from top brands including Samsung, iPhone, OnePlus, and more.",
  accessories: "Premium accessories to complement your devices — chargers, cases, cables, and more.",
  wearables: "Stay connected with smartwatches and fitness trackers from leading brands.",
  audio: "Immersive audio experience with earbuds, headphones, and speakers.",
};

function formatCategorySlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    async function loadProducts() {
      if (!isConfigured()) {
        setLoading(false);
        return;
      }
      const supabase = getSupabase();
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category", slug);

      if (data) {
        setProducts(data);
        setFilteredProducts(data);
      }
      setLoading(false);
    }
    loadProducts();
  }, [slug]);

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchQuery, sortBy]);

  const categoryName = formatCategorySlug(slug);
  const categoryDescription =
    categoryDescriptions[slug] ||
    `Browse our collection of ${categoryName.toLowerCase()} products.`;

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-96 mb-8" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/products" className="hover:text-gray-700">
              Products
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{categoryName}</span>
          </nav>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{categoryName}</h1>
            <p className="text-gray-500 mt-1">{categoryDescription}</p>
            <p className="text-sm text-gray-400 mt-1">
              {filteredProducts.length} product{filteredProducts.length !== 1 && "s"}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6">
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search in ${categoryName}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-sm min-w-[140px]"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : ""}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-gray-100" : ""}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h2>
              <p className="text-gray-500">
                {searchQuery
                  ? `No results for "${searchQuery}" in ${categoryName}.`
                  : `There are no products in the ${categoryName} category yet.`}
              </p>
              <Link
                href="/products"
                className="inline-block mt-4 px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                  : "space-y-3 sm:space-y-4"
              }
            >
              {filteredProducts.map((product) => {
                const discount = product.original_price
                  ? Math.round(
                      ((product.original_price - product.price) /
                        product.original_price) *
                        100
                    )
                  : 0;
                const imageUrl =
                  productImages[product.name] ||
                  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80";

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className={`group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    <div
                      className={`bg-gray-100 ${
                        viewMode === "list"
                          ? "w-48 h-48 flex-shrink-0"
                          : "aspect-square"
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-4 flex-1">
                      <p className="text-xs text-gray-500 uppercase">
                        {product.brand}
                      </p>
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-bold">
                          ৳{product.price.toLocaleString()}
                        </span>
                        {discount > 0 && (
                          <span className="text-xs text-red-600">-{discount}%</span>
                        )}
                      </div>
                      {product.stock <= 10 && (
                        <p className="text-xs text-red-500 mt-1">
                          Only {product.stock} left
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
