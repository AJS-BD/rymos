"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  LogIn,
  Wallet,
  Tag,
  Star,
  Menu,
  X,
} from "lucide-react";
import AdminUnreadBadge from "../../components/layout/admin-unread-badge";
import { AdminAuthProvider, useAdminAuth } from "../../context/admin-auth-context";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pos", label: "POS", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/credit-applications", label: "Credit", icon: CreditCard },
  { href: "/admin/installments", label: "Instalment", icon: Wallet },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading, isAdmin, adminLogout } = useAdminAuth();
  const isMessagesPage = pathname.startsWith("/admin/messages/");

  // Gate: unauthenticated visitors are sent to the login page
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/admin/login");
    }
  }, [loading, isAdmin, router]);

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  // While the session check is in flight, avoid flashing admin content
  if (loading || !isAdmin) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[var(--color-bg-alt)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-gray-800 animate-spin" />
          <p className="text-sm text-gray-500">
            {loading ? "Checking session…" : "Redirecting to login…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col lg:flex-row bg-[var(--color-bg-alt)]">
      {admin?.fallback && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[12px] text-amber-800 flex items-center justify-between gap-3">
          <span>
            Admin protection is not active yet — run{" "}
            <code className="px-1 py-0.5 bg-amber-100 rounded font-mono text-[11px]">supabase/sync_20260922_prod_sync.sql</code>{" "}
            in the Supabase SQL Editor to enable login.
          </span>
        </div>
      )}
      {/* Mobile Header */}
      <div className="lg:hidden flex-shrink-0 px-4 py-3 flex items-center justify-between backdrop-blur-xl border-b border-gray-200">
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
      <aside className={`fixed lg:static lg:flex-0 inset-y-0 left-0 z-50 w-[260px] flex flex-col transform transition-transform duration-300 ease-out lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} bg-[var(--color-bg)] border-r border-gray-200 flex-shrink-0`}>
        {/* Sidebar Header */}
        <div className="p-5 pb-4 flex items-center justify-between">
          <div>
            <Link href="/admin/dashboard" className="text-[17px] font-semibold tracking-tight">RYmos</Link>
            <p className="text-[11px] mt-0.5 text-gray-500">
              {admin ? `${admin.fullName || admin.email} · ${admin.role}` : "Admin Panel"}
            </p>
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
                {item.href === "/admin/messages" && <AdminUnreadBadge />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 space-y-0.5">
          <button
            onClick={() => adminLogout()}
            className="w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-[15px] w-[15px] text-gray-500" />
            Sign Out
          </button>
          <Link href="/" className="flex items-center gap-2.5 px-3 py-[7px] text-[13px] font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <LogIn className="h-[15px] w-[15px] text-gray-500 rotate-180" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 min-h-0 ${isMessagesPage ? "overflow-hidden flex flex-col" : "overflow-auto p-4 pt-16 lg:p-8"}`}>{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  // The login page lives inside this layout but must render bare:
  // no sidebar, no auth gate (it would redirect-loop otherwise).
  if (isLoginPage) {
    return <AdminAuthProvider>{children}</AdminAuthProvider>;
  }

  return <AdminAuthProvider><AdminShell>{children}</AdminShell></AdminAuthProvider>;
}
