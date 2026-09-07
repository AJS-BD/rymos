"use client";

import { useState, useEffect } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";

interface Customer {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  shop_name: string;
  address: string;
  customer_type: string;
  created_via: string;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [createdViaFilter, setCreatedViaFilter] = useState<string>("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      if (!isConfigured()) {
        setLoading(false);
        return;
      }
      const supabase = getSupabase();
      const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (data) {
        setCustomers(data);
        setFilteredCustomers(data);
      }
      setLoading(false);
    }
    loadCustomers();
  }, []);

  useEffect(() => {
    let filtered = customers;
    if (createdViaFilter !== "all") {
      filtered = filtered.filter(c => c.created_via === createdViaFilter);
    }
    if (customerTypeFilter !== "all") {
      filtered = filtered.filter(c => c.customer_type === customerTypeFilter);
    }
    setFilteredCustomers(filtered);
  }, [customers, createdViaFilter, customerTypeFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
            Customers
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
          Customers
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{customers.length} customers total</p>
      </div>

      {/* Filters */}
      <div
        className="flex gap-4 p-4 rounded-2xl"
        style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
      >
        <div>
          <label
            className="block text-[11px] font-medium uppercase tracking-wide mb-1.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Created Via
          </label>
          <select
            value={createdViaFilter}
            onChange={(e) => setCreatedViaFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{
              border: "1px solid #e5e5e7",
              color: "var(--color-text)",
              background: "var(--color-bg)",
            }}
          >
            <option value="all">All</option>
            <option value="pos">POS</option>
            <option value="online_signup">Online Signup</option>
          </select>
        </div>
        <div>
          <label
            className="block text-[11px] font-medium uppercase tracking-wide mb-1.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Customer Type
          </label>
          <select
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{
              border: "1px solid #e5e5e7",
              color: "var(--color-text)",
              background: "var(--color-bg)",
            }}
          >
            <option value="all">All</option>
            <option value="walk_in">Walk-in</option>
            <option value="online">Online</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div className="flex items-end">
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Showing {filteredCustomers.length} of {customers.length}
          </span>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                {["Name", "Phone", "Address", "Type", "Via", "Profile", "Joined"].map(
                  (header) => (
                    <th
                      key={header}
                      className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                      style={{
                        color: "var(--color-text-muted)",
                        borderBottom: "1px solid #e5e5e7",
                      }}
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    style={{ borderBottom: "1px solid #f5f5f7" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[13px]" style={{ color: "var(--color-text)" }}>
                        {customer.full_name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        @{customer.username}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                      {customer.phone}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] max-w-[200px] truncate" style={{ color: "var(--color-text-muted)" }}>
                      {customer.address || "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background:
                            customer.customer_type === "online"
                              ? "#e3f2fd"
                              : customer.customer_type === "walk_in"
                              ? "#e8f5e9"
                              : "#f3e5f5",
                          color:
                            customer.customer_type === "online"
                              ? "#1565c0"
                              : customer.customer_type === "walk_in"
                              ? "#2e7d32"
                              : "#7b1fa2",
                        }}
                      >
                        {customer.customer_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: customer.created_via === "pos" ? "#fff3e0" : "#f5f5f7",
                          color:
                            customer.created_via === "pos"
                              ? "#e65100"
                              : "var(--color-text-muted)",
                        }}
                      >
                        {customer.created_via || "online_signup"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: customer.profile_completed ? "#e8f5e9" : "#fff8e1",
                          color: customer.profile_completed ? "#2e7d32" : "#f57f17",
                        }}
                      >
                        {customer.profile_completed ? "Complete" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(customer.created_at).toLocaleDateString()}
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
