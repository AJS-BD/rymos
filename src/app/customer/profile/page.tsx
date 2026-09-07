"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Store,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Pencil,
} from "lucide-react";

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  shop_name: string | null;
  created_at: string;
}

export default function CustomerProfile() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    shop_name: "",
  });

  const fetchCustomer = useCallback(async () => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    const customerId = localStorage.getItem("rymos_customer_id");
    if (!customerId) {
      setError("No customer ID found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setCustomer(data);
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          shop_name: data.shop_name || "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.full_name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    setSaving(true);

    try {
      const supabase = getSupabase();
      const customerId = localStorage.getItem("rymos_customer_id");

      const { error: updateError } = await supabase
        .from("customers")
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          shop_name: formData.shop_name.trim() || null,
        })
        .eq("id", customerId);

      if (updateError) throw updateError;

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              full_name: formData.full_name.trim(),
              phone: formData.phone.trim(),
              email: formData.email.trim() || null,
              address: formData.address.trim() || null,
              shop_name: formData.shop_name.trim() || null,
            }
          : null
      );
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!customer && !isConfigured()) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">
          Supabase is not configured. Please check environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500">Manage your account information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Profile updated successfully!
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Your phone number"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Your full address"
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop Name
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleChange}
                  placeholder="Your shop/business name"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                  if (customer) {
                    setFormData({
                      full_name: customer.full_name || "",
                      phone: customer.phone || "",
                      email: customer.email || "",
                      address: customer.address || "",
                      shop_name: customer.shop_name || "",
                    });
                  }
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Full Name
                </p>
                <p className="font-medium text-gray-900">
                  {customer?.full_name || "Not set"}
                </p>
              </div>
            </div>

            <div className="border-t pt-5 flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Phone
                </p>
                <p className="font-medium text-gray-900">
                  {customer?.phone || "Not set"}
                </p>
              </div>
            </div>

            <div className="border-t pt-5 flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Email
                </p>
                <p className="font-medium text-gray-900">
                  {customer?.email || "Not set"}
                </p>
              </div>
            </div>

            <div className="border-t pt-5 flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Address
                </p>
                <p className="font-medium text-gray-900">
                  {customer?.address || "Not set"}
                </p>
              </div>
            </div>

            <div className="border-t pt-5 flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Shop Name
                </p>
                <p className="font-medium text-gray-900">
                  {customer?.shop_name || "Not set"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
