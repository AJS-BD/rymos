"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Trash2, Edit, Plus, AlertTriangle } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

interface Product {
  id: number;
  name: string;
  brand: string | null;
  price: number;
  stock: number;
  category: string | null;
  is_featured: boolean;
  is_new_arrival: boolean;
}

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const supabase = getSupabase();
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("products").delete().eq("id", deleteId);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      setMessage({ type: "success", text: "Product deleted successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to delete product" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
            Products
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div
            className="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
            style={{ background: "var(--color-bg)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#ffebee" }}
              >
                <AlertTriangle className="h-5 w-5" style={{ color: "#d32f2f" }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Delete Product
              </h3>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ border: "1px solid #e5e5e7", color: "var(--color-text)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#d32f2f" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
            Products
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{products.length} products total</p>
        </div>
        <Link
          href="/admin/products/add"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-medium transition-colors"
          style={{ background: "#0071E3" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0077ed")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0071E3")}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {message && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            background: message.type === "success" ? "#e8f5e9" : "#ffebee",
            border: `1px solid ${message.type === "success" ? "#c8e6c9" : "#ffcdd2"}`,
            color: message.type === "success" ? "#2e7d32" : "#c62828",
          }}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Product
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Category
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Price
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Stock
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Status
                </th>
                <th
                  className="text-right px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)", borderBottom: "1px solid #e5e5e7" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center" style={{ color: "var(--color-text-muted)" }}>
                    No products found. Add your first product to get started.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    style={{ borderBottom: "1px solid #f5f5f7" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "var(--color-bg-alt)" }}
                        >
                          <Package className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[13px] truncate" style={{ color: "var(--color-text)" }}>
                            {product.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {product.brand}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] capitalize" style={{ color: "var(--color-text-muted)" }}>
                      {product.category}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium" style={{ color: "var(--color-text)" }}>
                      ৳{product.price}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: product.stock <= 10 ? "#d32f2f" : "var(--color-text)" }}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: product.is_featured
                            ? "#e3f2fd"
                            : product.is_new_arrival
                            ? "#e8f5e9"
                            : "#f5f5f7",
                          color: product.is_featured
                            ? "#1565c0"
                            : product.is_new_arrival
                            ? "#2e7d32"
                            : "var(--color-text-muted)",
                        }}
                      >
                        {product.is_featured ? "Featured" : product.is_new_arrival ? "New" : "Regular"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
                          style={{ color: "#0071E3" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,113,227,0.08)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
                          style={{ color: "#d32f2f" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#ffebee")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
