"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { motion, useInView } from "framer-motion";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { formatBDT } from "@/lib/utils";

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
  images?: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type SortOption = "name" | "price-asc" | "price-desc";

const fallbackImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80";

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-lg mx-auto">
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search products..."
        className="w-full pl-12 pr-4 py-3.5 rounded-full bg-gray-100 border-0 text-base font-light text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
    </div>
  );
}

function CategoryFilter({ categories, active, onSelect }: { categories: Category[]; active: string; onSelect: (c: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      <button
        onClick={() => onSelect("all")}
        className={`px-4 sm:px-5 py-2 rounded-full text-sm font-light transition-all duration-200 ${active === "all" ? "bg-gray-900 text-white shadow-sm" : "bg-transparent text-gray-500 border border-gray-200 hover:border-gray-900 hover:text-gray-900"}`}
      >
        All
      </button>
      {categories.map((cat) => {
        const isActive = cat.slug === active;
        return (
          <button key={cat.id} onClick={() => onSelect(cat.slug)}
            className={`px-4 sm:px-5 py-2 rounded-full text-sm font-light transition-all duration-200 ${isActive ? "bg-gray-900 text-white shadow-sm" : "bg-transparent text-gray-500 border border-gray-200 hover:border-gray-900 hover:text-gray-900"}`}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

function SortDropdown({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options: { value: SortOption; label: string }[] = [
    { value: "name", label: "Sort by Name" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-light text-gray-500 border border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
        </svg>
        {options.find((o) => o.value === value)?.label ?? "Sort"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
          {options.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-light transition-colors ${opt.value === value ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const imageUrl = product.images?.[0] || fallbackImage;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand || "",
      price: product.price,
      stock: 10,
      images: [imageUrl],
      category: product.category,
    });
  };

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}>
      <a href={`/products/${product.id}`} className="group block">
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageUrl})` }}>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-light text-gray-900 leading-snug line-clamp-2">{product.name}</h3>
          <p className="text-sm sm:text-base font-light text-gray-500">{formatBDT(product.price)}</p>
        </div>
        <button onClick={handleAddToCart}
          className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Add to Bag
        </button>
      </a>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="block">
      <div className="aspect-square bg-gray-100 rounded-2xl mb-4 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name");

  useEffect(() => {
    async function loadData() {
      if (!isConfigured()) { setLoading(false); return; }
      const supabase = getSupabase();
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("*").order("name"),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory !== "all") result = result.filter((p) => p.category === selectedCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(query) || p.brand?.toLowerCase().includes(query));
    }
    switch (sortOption) {
      case "price-asc": result = [...result].sort((a, b) => a.price - b.price); break;
      case "price-desc": result = [...result].sort((a, b) => b.price - a.price); break;
      default: result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [products, searchQuery, selectedCategory, sortOption]);

  return (
    <main className="flex-1 min-h-screen bg-white">
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center bg-gray-50">
        <motion.div className="text-center px-6 py-20 sm:py-32" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-light tracking-tight text-gray-900 mb-4 sm:mb-6">Products.</h1>
          <p className="text-base sm:text-lg md:text-xl font-light text-gray-500 max-w-xl mx-auto leading-relaxed">Explore our complete collection.</p>
        </motion.div>
      </section>

      <section className="py-8 sm:py-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </section>

      <section className="py-6 sm:py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <CategoryFilter categories={categories} active={selectedCategory} onSelect={setSelectedCategory} />
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-end mb-8">
            <SortDropdown value={sortOption} onChange={setSortOption} />
          </div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-light text-gray-500">No products found.</p>
              {(searchQuery || selectedCategory !== "all") && (
                <button onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }} className="mt-4 text-sm font-light text-blue-600 hover:text-blue-700">Clear filters</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
