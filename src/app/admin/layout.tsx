"use client";

import { useState } from "react";
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

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg-alt)" }}>
      {/* Mobile Header */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: "var(--color-bg)", borderBottom: "1px solid #e5e5e7" }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--color-text)" }}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/admin/dashboard"
          className="text-lg font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          RYmos
        </Link>
        <div className="w-9" />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "var(--color-bg)", borderRight: "1px solid #e5e5e7" }}
      >
        <div
          className="p-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid #e5e5e7" }}
        >
          <div>
            <Link
              href="/admin/dashboard"
              className="text-xl font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              RYmos
            </Link>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Admin Panel
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-[14px] font-medium rounded-lg transition-colors"
              style={{ color: "var(--color-text)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-bg-alt)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <item.icon className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: "1px solid #e5e5e7" }}>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-[14px] font-medium rounded-lg transition-colors"
            style={{ color: "var(--color-text)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-bg-alt)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 pt-16 lg:p-8 overflow-auto">{children}</main>
    </div>
  );
}
