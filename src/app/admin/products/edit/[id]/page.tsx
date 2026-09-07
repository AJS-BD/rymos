"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, ArrowLeft, Save } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    stock: "",
    price: "",
    original_price: "",
    description: "",
    is_featured: false,
    is_new_arrival: false,
  });

  useEffect(() => {
    async function fetchData() {
      setFetching(true);
      const supabase = getSupabase();

      const [productRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("categories").select("*").order("sort_order"),
      ]);

      if (productRes.data) {
        const p = productRes.data;
        setFormData({
          name: p.name || "",
          brand: p.brand || "",
          category: p.category || "",
          stock: String(p.stock ?? ""),
          price: String(p.price ?? ""),
          original_price: p.original_price != null ? String(p.original_price) : "",
          description: p.description || "",
          is_featured: p.is_featured || false,
          is_new_arrival: p.is_new_arrival || false,
        });
      }

      if (categoriesRes.data) setCategories(categoriesRes.data);
      setFetching(false);
    }
    if (id) fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          brand: formData.brand || null,
          category: formData.category || null,
          stock: parseInt(formData.stock) || 0,
          price: parseFloat(formData.price) || 0,
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          description: formData.description || null,
          is_featured: formData.is_featured,
          is_new_arrival: formData.is_new_arrival,
        })
        .eq("id", id);

      if (error) throw error;

      setMessage({ type: "success", text: "Product updated successfully!" });
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to update product" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-500">Update product details</p>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., iPhone 15 Pro Max"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="e.g., Apple"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
            <input
              type="number"
              name="stock"
              min="0"
              required
              value={formData.stock}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (BDT) *</label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              required
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (BDT)</label>
            <input
              type="number"
              name="original_price"
              min="0"
              step="0.01"
              value={formData.original_price}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Product description..."
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Featured Product</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_new_arrival"
              checked={formData.is_new_arrival}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">New Arrival</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {loading ? "Updating..." : "Update Product"}
          </button>
          <Link
            href="/admin/products"
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
