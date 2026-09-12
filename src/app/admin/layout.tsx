"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Menu,
  X,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-alt)]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-xl border-b border-gray-200">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin/dashboard" className="text-lg font-semibold tracking-tight">RYmos</Link>
        <div className="w-9" />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] flex flex-col transform transition-transform duration-300 ease-out lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} bg-[var(--color-bg)] border-r border-gray-200`}>
        {/* Sidebar Header */}
        <div className="p-5 pb-4 flex items-center justify-between">
          <div>
            <Link href="/admin/dashboard" className="text-[17px] font-semibold tracking-tight">RYmos</Link>
            <p className="text-[11px] mt-0.5 text-gray-500">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-gray-500" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-[7px] text-[13px] font-medium rounded-lg transition-all duration-150 ${active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <item.icon className={`h-[15px] w-[15px] ${active ? "text-blue-600" : "text-gray-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
          <Link href="/" className="flex items-center gap-2.5 px-3 py-[7px] text-[13px] font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <LogOut className="h-[15px] w-[15px] text-gray-500" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 pt-16 lg:p-8 overflow-auto">{children}</main>
    </div>
  );
}
