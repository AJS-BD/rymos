import Link from "next/link";
import { Package } from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";

async function getProducts() {
  if (!isConfigured()) return [];
  const supabase = getSupabase();
  const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  return data || [];
}

export default async function AdminProducts() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">{products.length} products total</p>
        </div>
        <Link
          href="/admin/products/add"
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Product</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Price</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Stock</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No products found. Add your first product to get started.
                </td>
              </tr>
            ) : (
              products.map((product: any) => (
                <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{product.category}</td>
                  <td className="px-4 py-3 text-sm font-medium">৳{product.price}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${product.stock <= 10 ? "text-red-600" : "text-gray-900"}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.is_featured ? "bg-blue-100 text-blue-700" :
                      product.is_new_arrival ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {product.is_featured ? "Featured" : product.is_new_arrival ? "New" : "Regular"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/edit/${product.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
