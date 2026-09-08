"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { User, Mail, Phone, Package, MessageSquare, LogOut, ChevronRight, MapPin } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, loading, logout } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to initialize
    if (loading) return;
    
    if (isLoggedIn) {
      fetchOrders();
    } else {
      setDataLoading(false);
    }
  }, [loading, isLoggedIn]);

  const fetchOrders = async () => {
    if (!isConfigured() || !user?.id) {
      setDataLoading(false);
      return;
    }
    const supabase = getSupabase();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setOrders(data);
    setDataLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Show loading while auth initializes
  if (loading) {
    return (
      <main className="flex-1">
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  // After loading, if still not logged in, redirect
  if (!isLoggedIn) {
    return (
      <main className="flex-1">
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Please sign in</h1>
            <p className="text-gray-500 mb-6">You need to be logged in to view your profile.</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">{user?.fullName || "User"}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </span>
                )}
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/customer/orders"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Orders</h3>
              <p className="text-sm text-gray-500">View order history</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/customer/messages"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Messages</h3>
              <p className="text-sm text-gray-500">Chat with support</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/track-order"
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Track Order</h3>
              <p className="text-sm text-gray-500">Check delivery status</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/customer/orders" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          {dataLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders yet</p>
              <Link
                href="/products"
                className="inline-block mt-4 text-blue-600 hover:underline text-sm"
              >
                Start shopping →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">৳{order.total?.toLocaleString()}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
