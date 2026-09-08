"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";
import {
  Heart,
  Trash2,
  ShoppingCart,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    brand: string;
    price: number;
    original_price: number;
    stock: number;
    images: string[];
  };
}

const productImages: Record<string, string> = {
  "Samsung Galaxy S24 Ultra":
    "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
  "iPhone 15 Pro Max":
    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
  "iPhone 15 128GB":
    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
  "OnePlus 12":
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Xiaomi 14 Ultra":
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Samsung Galaxy S23 FE 5G":
    "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
  "AirPods Pro 2nd Gen":
    "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80",
  "Anker 20W Charger":
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80",
  "Apple Watch SE 2nd Gen":
    "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&q=80",
  "Apple Watch Series 9":
    "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&q=80",
  "Vivo V20 5G":
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Realme 12 Pro+ 5G":
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "Nothing Phone (2a)":
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
  "POCO X6 Pro 5G":
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80",
};

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchWishlist = useCallback(async () => {
    if (!isConfigured()) {
      // Try to load from localStorage as fallback
      const stored = localStorage.getItem("rymos_wishlist");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setWishlistItems(parsed);
        } catch {
          setWishlistItems([]);
        }
      }
      setLoading(false);
      return;
    }

    const customerId = localStorage.getItem("rymos_customer_id");
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("wishlists")
        .select("*, products(*)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setWishlistItems(data || []);
    } catch (err: any) {
      // Fallback to localStorage
      const stored = localStorage.getItem("rymos_wishlist");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setWishlistItems(parsed);
        } catch {
          setWishlistItems([]);
        }
      } else {
        setError(err.message || "Failed to load wishlist.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (item: WishlistItem) => {
    setRemoving(item.id);

    // Optimistic update
    setWishlistItems((prev) => prev.filter((i) => i.id !== item.id));

    if (isConfigured()) {
      try {
        const supabase = getSupabase();
        const { error: deleteError } = await supabase
          .from("wishlists")
          .delete()
          .eq("id", item.id);

        if (deleteError) throw deleteError;
      } catch (err) {
        // Revert on error
        fetchWishlist();
      }
    } else {
      // Update localStorage
      const stored = localStorage.getItem("rymos_wishlist");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const updated = parsed.filter((i: WishlistItem) => i.id !== item.id);
          localStorage.setItem("rymos_wishlist", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
    }

    setRemoving(null);
  };

  const getProductImage = (product: WishlistItem["products"]) => {
    return (
      productImages[product.name] ||
      product.images?.[0] ||
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80"
    );
  };

  if (loading) {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </main>
    );
  }

  if (!isConfigured() && wishlistItems.length === 0) {
    const stored = localStorage.getItem("rymos_wishlist");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setWishlistItems(parsed);
        }
      } catch {
        // ignore
      }
    }
  }

  return (
    <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-500">{wishlistItems.length} items saved</p>
          </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">
            Your wishlist is empty. Save products you love!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((item) => {
            const product = item.products;
            const discount = product.original_price
              ? Math.round(
                  ((product.original_price - product.price) /
                    product.original_price) *
                    100
                )
              : 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border overflow-hidden group hover:shadow-md transition-shadow"
              >
                <Link
                  href={`/products/${product.id}`}
                  className="block"
                >
                  <div
                    className="aspect-square relative overflow-hidden bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${getProductImage(product)})` }}
                  >
                    <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-500" />
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded">
                        -{discount}%
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <p className="text-xs text-gray-500 uppercase">
                      {product.brand}
                    </p>
                    <h3 className="font-medium text-gray-900 text-sm mt-0.5 line-clamp-2 hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-bold text-gray-900">
                      {formatBDT(product.price)}
                    </span>
                    {product.original_price > product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatBDT(product.original_price)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      View
                    </Link>
                    <button
                      onClick={() => handleRemove(item)}
                      disabled={removing === item.id}
                      className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors disabled:opacity-50"
                      title="Remove from wishlist"
                    >
                      {removing === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      </main>
  );
}
