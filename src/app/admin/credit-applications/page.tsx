"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, AlertCircle, Loader2, CreditCard } from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";
import Link from "next/link";

interface CreditApplication {
  id: string;
  customer_id: string;
  status: string;
  requested_amount: number;
  proposed_down_payment: number;
  proposed_installments: number;
  decision: string | null;
  rejection_reason: string | null;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  customers: {
    full_name: string;
    phone: string;
    address: string;
  };
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminCreditApplications() {
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [filteredApps, setFilteredApps] = useState<CreditApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    let filtered = applications;

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.customers?.full_name?.toLowerCase().includes(query) ||
          app.customers?.phone?.includes(query) ||
          app.id.slice(0, 8).toLowerCase().includes(query)
      );
    }

    setFilteredApps(filtered);
  }, [applications, statusFilter, searchQuery]);

  const fetchApplications = async () => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("credit_applications")
        .select("*, customers(full_name, phone, address)")
        .order("created_at", { ascending: false });

      setApplications(data || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("credit_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (!error) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "under_review":
        return "bg-blue-100 text-blue-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3.5 h-3.5" />;
      case "under_review":
        return <AlertCircle className="w-3.5 h-3.5" />;
      case "approved":
        return <CheckCircle className="w-3.5 h-3.5" />;
      case "rejected":
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      under_review: applications.filter((a) => a.status === "under_review").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };
  };

  const counts = getCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Credit Applications</h1>
        <p className="text-gray-500">{applications.length} applications total</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? "bg-black text-white"
                : "bg-white text-gray-700 border hover:bg-gray-50"
            }`}
          >
            {filter.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({counts[filter.value as keyof typeof counts]})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, or application ID..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
        />
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {applications.length === 0
                ? "No credit applications yet"
                : "No applications match your filters"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Down / Months</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{app.customers?.full_name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{app.customers?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatBDT(app.requested_amount)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-gray-600">
                      {formatBDT(app.proposed_down_payment)} / {app.proposed_installments}mo
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {getStatusIcon(app.status)}
                      {app.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/credit-applications/${app.id}`}
                        className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {app.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(app.id, "under_review")}
                            disabled={updating === app.id}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                            title="Mark as under review"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(app.status === "pending" || app.status === "under_review") && (
                        <>
                          <button
                            onClick={() => updateStatus(app.id, "approved")}
                            disabled={updating === app.id}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(app.id, "rejected")}
                            disabled={updating === app.id}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
