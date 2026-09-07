import { getSupabase, isConfigured } from "@/lib/supabase";

async function getDashboardStats() {
  if (!isConfigured()) {
    return {
      totalProducts: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      recentOrders: [],
      lowStockProducts: [],
    };
  }

  const supabase = getSupabase();

  const [products, orders, customers, recentOrders, lowStock] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*, customers(full_name, phone)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("*")
      .lte("stock", 10)
      .order("stock", { ascending: true })
      .limit(5),
  ]);

  return {
    totalProducts: products.count || 0,
    totalOrders: orders.count || 0,
    totalCustomers: customers.count || 0,
    totalRevenue: 0,
    recentOrders: recentOrders.data || [],
    lowStockProducts: lowStock.data || [],
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-[28px] font-semibold tracking-tight"
          style={{ color: "var(--color-text)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Welcome to RYmos admin panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            Total Products
          </p>
          <p
            className="text-[32px] font-semibold mt-2 tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            {stats.totalProducts}
          </p>
        </div>

        {/* Orders */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            Total Orders
          </p>
          <p
            className="text-[32px] font-semibold mt-2 tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            {stats.totalOrders}
          </p>
        </div>

        {/* Customers */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            Total Customers
          </p>
          <p
            className="text-[32px] font-semibold mt-2 tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            {stats.totalCustomers}
          </p>
        </div>

        {/* Revenue */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            Revenue
          </p>
          <p
            className="text-[32px] font-semibold mt-2 tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            ৳0
          </p>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #e5e5e7" }}>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
              Recent Orders
            </h2>
          </div>
          <div className="p-5">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No orders yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid #f5f5f7" }}
                  >
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
                        {order.order_number}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {order.customers?.full_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
                        ৳{order.total}
                      </p>
                      <span
                        className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background:
                            order.status === "delivered"
                              ? "#e8f5e9"
                              : order.status === "pending"
                              ? "#fff8e1"
                              : "#e3f2fd",
                          color:
                            order.status === "delivered"
                              ? "#2e7d32"
                              : order.status === "pending"
                              ? "#f57f17"
                              : "#1565c0",
                        }}
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

        {/* Low Stock */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #e5e5e7" }}>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
              Low Stock Alert
            </h2>
          </div>
          <div className="p-5">
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                All products are well stocked
              </p>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid #f5f5f7" }}
                  >
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
                        {product.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {product.brand}
                      </p>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: product.stock <= 5 ? "#d32f2f" : "#f57f17" }}
                    >
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
