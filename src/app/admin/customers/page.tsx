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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500">{customers.length} customers total</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg border">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Created Via</label>
          <select
            value={createdViaFilter}
            onChange={(e) => setCreatedViaFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All</option>
            <option value="pos">POS</option>
            <option value="online_signup">Online Signup</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Customer Type</label>
          <select
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All</option>
            <option value="walk_in">Walk-in</option>
            <option value="online">Online</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div className="flex items-end">
          <span className="text-sm text-gray-500">
            Showing {filteredCustomers.length} of {customers.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Phone</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Address</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Via</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Profile</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No customers found
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{customer.full_name}</p>
                    <p className="text-xs text-gray-500">@{customer.username}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{customer.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.address || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      customer.customer_type === "online" ? "bg-blue-100 text-blue-700" :
                      customer.customer_type === "walk_in" ? "bg-green-100 text-green-700" :
                      "bg-purple-100 text-purple-700"
                    }`}>
                      {customer.customer_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      customer.created_via === 'pos' ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {customer.created_via || 'online_signup'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      customer.profile_completed ? "bg-green-100 text-green-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {customer.profile_completed ? 'Complete' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString()}
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
