import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Wallet,
  Tag,
  Star,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pos", label: "POS", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/credit-applications", label: "Credit", icon: CreditCard },
  { href: "/admin/installments", label: "কিস্তি বাকি", icon: Wallet },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r flex flex-col">
        <div className="p-4 border-b">
          <Link href="/admin/dashboard" className="text-xl font-bold text-gray-900">
            RYmos
          </Link>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
