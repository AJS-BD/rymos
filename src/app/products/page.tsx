"use client";

import { useState, useEffect } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/animated-section";
import { ProductCardSkeletonGrid, Stagger, StaggerItem } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number;
  specs: any;
  category: string;
  is_featured: boolean;
  is_new_arrival: boolean;
}

/* ------------------------------------------------------------------ */
/*  Blur placeholder (tiny SVG data URI for CLS-safe placeholder)     */
/* ------------------------------------------------------------------ */

const blurDataUri =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3Crect width='4' height='4' fill='%23f3f4f6'/%3E%3C/svg%3E";

/* ------------------------------------------------------------------ */
/*  Product Card (inline — uses blur placeholder)                      */
/* ------------------------------------------------------------------ */

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

function ProductCard({ product }: { product: Product }) {
  const imageUrl = productImages[product.name] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80";

  return (
    <motion.a
      href={`/products/${product.id}`}
      className="group bg-[var(--color-bg-alt)] rounded-2xl p-4 hover:shadow-lg transition-shadow block"
    >
      <div className="aspect-square bg-white rounded-xl overflow-hidden mb-4 relative">
        {/* Blur placeholder layer */}
        <img
          src={blurDataUri}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl"
        />
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-[1]"
        />
      </div>
      <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">
        {product.name}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)]">
        {new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(product.price)}
      </p>
    </motion.a>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      if (!isConfigured()) {
        setLoading(false);
        return;
      }
      const supabase = getSupabase();
      const { data } = await supabase.from("products").select("*").order("name");
      if (data) setProducts(data);
      setLoading(false);
    }
    loadProducts();
  }, []);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="py-20 sm:py-32 bg-[var(--color-bg-alt)] text-center">
        <AnimatedSection>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[var(--color-text)] mb-4">
            All Products
          </h1>
          <p className="text-lg sm:text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto">
            Browse our complete collection of smartphones and accessories.
          </p>
        </AnimatedSection>
      </section>

      {/* Products Grid with stagger entrance */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <ProductCardSkeletonGrid count={8} />
          ) : (
            <Stagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>
    </main>
  );
}
