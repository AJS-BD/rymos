"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, ArrowLeft, Save, Plus, Trash2, Star, Video, MessageSquare } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import ProductImageUpload from "@/components/ProductImageUpload";
import StarRating from "@/components/shared/star-rating";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface YouTubeReview {
  id?: number;
  product_id?: number;
  title: string;
  youtube_url: string;
  thumbnail_url: string;
  creator_name: string;
  sort_order?: number;
  created_at?: string;
}

interface CustomerReview {
  id?: number;
  product_id?: number;
  customer_name: string;
  rating: number;
  content: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  admin_seed: boolean;
  created_at?: string;
}

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [images, setImages] = useState<string[]>([]);
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

  // YouTube Reviews state
  const [youtubeReviews, setYoutubeReviews] = useState<YouTubeReview[]>([]);
  const [ytSaving, setYtSaving] = useState(false);
  const [ytMessage, setYtMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Customer Reviews state
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New YouTube review form
  const [newYtReview, setNewYtReview] = useState<YouTubeReview>({
    title: "",
    youtube_url: "",
    thumbnail_url: "",
    creator_name: "",
  });

  // New customer review form (seed)
  const [newReview, setNewReview] = useState({
    customer_name: "",
    rating: 5,
    content: "",
    is_verified_purchase: false,
  });

  useEffect(() => {
    async function fetchData() {
      setFetching(true);
      const supabase = getSupabase();

      const [productRes, categoriesRes, ytRes, reviewsRes] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("youtube_reviews").select("*").eq("product_id", id).order("sort_order"),
        supabase.from("reviews").select("*").eq("product_id", id).order("created_at", { ascending: false }),
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
        setImages(p.images || []);
      }

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (ytRes.data) setYoutubeReviews(ytRes.data);
      if (reviewsRes.data) setCustomerReviews(reviewsRes.data);
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
          images: images,
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

  // --- YouTube Reviews handlers ---
  const handleAddYoutubeReview = async () => {
    if (!newYtReview.title || !newYtReview.youtube_url) {
      setYtMessage({ type: "error", text: "Title and YouTube URL are required" });
      return;
    }
    setYtSaving(true);
    setYtMessage(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("youtube_reviews").insert({
        product_id: parseInt(id),
        title: newYtReview.title,
        youtube_url: newYtReview.youtube_url,
        thumbnail_url: newYtReview.thumbnail_url || null,
        creator_name: newYtReview.creator_name || null,
        sort_order: youtubeReviews.length,
      });

      if (error) throw error;

      // Refresh list
      const { data } = await supabase
        .from("youtube_reviews")
        .select("*")
        .eq("product_id", id)
        .order("sort_order");

      if (data) setYoutubeReviews(data);
      setNewYtReview({ title: "", youtube_url: "", thumbnail_url: "", creator_name: "" });
      setYtMessage({ type: "success", text: "YouTube review added!" });
    } catch (err: any) {
      setYtMessage({ type: "error", text: err?.message || "Failed to add YouTube review" });
    } finally {
      setYtSaving(false);
    }
  };

  const handleRemoveYoutubeReview = async (reviewId: number) => {
    setYtSaving(true);
    setYtMessage(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("youtube_reviews").delete().eq("id", reviewId);

      if (error) throw error;

      setYoutubeReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setYtMessage({ type: "success", text: "YouTube review removed" });
    } catch (err: any) {
      setYtMessage({ type: "error", text: err?.message || "Failed to remove" });
    } finally {
      setYtSaving(false);
    }
  };

  // --- Customer Reviews handlers ---
  const handleSeedReview = async () => {
    if (!newReview.customer_name || !newReview.content) {
      setReviewMessage({ type: "error", text: "Customer name and content are required" });
      return;
    }
    setReviewSaving(true);
    setReviewMessage(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("reviews").insert({
        product_id: parseInt(id),
        customer_name: newReview.customer_name,
        rating: newReview.rating,
        content: newReview.content,
        is_verified_purchase: newReview.is_verified_purchase,
        is_approved: true,
        admin_seed: true,
      });

      if (error) throw error;

      // Refresh list
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      if (data) setCustomerReviews(data);
      setNewReview({ customer_name: "", rating: 5, content: "", is_verified_purchase: false });
      setReviewMessage({ type: "success", text: "Review seeded successfully!" });
    } catch (err: any) {
      setReviewMessage({ type: "error", text: err?.message || "Failed to seed review" });
    } finally {
      setReviewSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    setReviewSaving(true);
    setReviewMessage(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

      if (error) throw error;

      setCustomerReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setReviewMessage({ type: "success", text: "Review deleted" });
    } catch (err: any) {
      setReviewMessage({ type: "error", text: err?.message || "Failed to delete" });
    } finally {
      setReviewSaving(false);
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

        <ProductImageUpload
          images={images}
          onChange={setImages}
          disabled={loading}
        />

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

      {/* ===== YouTube Reviews Section ===== */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <Video className="h-5 w-5 text-red-500" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">YouTube Reviews</h2>
            <p className="text-sm text-gray-500">Manage YouTube video reviews for this product</p>
          </div>
        </div>

        {ytMessage && (
          <div
            className={`flex items-center gap-3 p-4 rounded-lg ${
              ytMessage.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {ytMessage.type === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm">{ytMessage.text}</p>
          </div>
        )}

        {/* Add new YouTube review form */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add YouTube Video
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={newYtReview.title}
                onChange={(e) => setNewYtReview((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Video title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL *</label>
              <input
                type="url"
                value={newYtReview.youtube_url}
                onChange={(e) => setNewYtReview((prev) => ({ ...prev, youtube_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Creator Name</label>
              <input
                type="text"
                value={newYtReview.creator_name}
                onChange={(e) => setNewYtReview((prev) => ({ ...prev, creator_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Creator/channel name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
              <input
                type="url"
                value={newYtReview.thumbnail_url}
                onChange={(e) => setNewYtReview((prev) => ({ ...prev, thumbnail_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://..."
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddYoutubeReview}
            disabled={ytSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {ytSaving ? "Adding..." : "Add Video"}
          </button>
        </div>

        {/* Existing YouTube reviews list */}
        {youtubeReviews.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Added Videos ({youtubeReviews.length})</h3>
            <div className="space-y-2">
              {youtubeReviews.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-20 h-14 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <Video className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                    <p className="text-xs text-gray-500 truncate">{video.creator_name || "Unknown creator"}</p>
                    <a
                      href={video.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate block"
                    >
                      {video.youtube_url}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => video.id && handleRemoveYoutubeReview(video.id)}
                    disabled={ytSaving}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove video"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {youtubeReviews.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No YouTube videos added yet</p>
        )}
      </div>

      {/* ===== Customer Reviews Section ===== */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Customer Reviews</h2>
            <p className="text-sm text-gray-500">View and seed customer reviews for this product</p>
          </div>
        </div>

        {reviewMessage && (
          <div
            className={`flex items-center gap-3 p-4 rounded-lg ${
              reviewMessage.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {reviewMessage.type === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm">{reviewMessage.text}</p>
          </div>
        )}

        {/* Seed new review form */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Star className="h-4 w-4" />
            Seed New Review
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                value={newReview.customer_name}
                onChange={(e) => setNewReview((prev) => ({ ...prev, customer_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview((prev) => ({ ...prev, rating: star }))}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= newReview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm text-gray-500 ml-2">{newReview.rating}/5</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Content *</label>
            <textarea
              rows={3}
              value={newReview.content}
              onChange={(e) => setNewReview((prev) => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Write the review content..."
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newReview.is_verified_purchase}
                onChange={(e) => setNewReview((prev) => ({ ...prev, is_verified_purchase: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Verified Purchase</span>
            </label>
          </div>
          <button
            type="button"
            onClick={handleSeedReview}
            disabled={reviewSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {reviewSaving ? "Seeding..." : "Seed Review"}
          </button>
        </div>

        {/* Existing reviews list */}
        {customerReviews.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              Reviews ({customerReviews.length})
              <span className="text-gray-400 font-normal ml-2">
                {customerReviews.filter((r) => r.is_approved).length} approved
              </span>
            </h3>
            <div className="space-y-2">
              {customerReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{review.customer_name}</span>
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        )}
                        {review.admin_seed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Admin
                          </span>
                        )}
                        {!review.is_approved && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="text-sm text-gray-600">{review.content}</p>
                      {review.created_at && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => review.id && handleDeleteReview(review.id)}
                      disabled={reviewSaving}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                      title="Delete review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {customerReviews.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No reviews yet — seed one above</p>
        )}
      </div>
    </div>
  );
}
