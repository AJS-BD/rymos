"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  CreditCard,
  User,
  Phone,
  X,
} from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";

interface Installment {
  id: string;
  plan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  reference: string | null;
  status: string;
}

interface CreditPlan {
  id: string;
  application_id: string;
  customer_id: string;
  order_id: string | null;
  total_amount: number;
  down_payment: number;
  balance: number;
  installment_count: number;
  installment_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  customers: {
    full_name: string;
    phone: string;
  };
  installments: Installment[];
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank", label: "Bank Transfer" },
];

export default function AdminInstallments() {
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ installment: Installment; plan: CreditPlan } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    let filtered = plans;

    if (statusFilter !== "all") {
      filtered = filtered.filter((plan) => {
        if (statusFilter === "active") return plan.status === "active";
        if (statusFilter === "completed") return plan.status === "completed";
        if (statusFilter === "overdue") {
          return plan.installments.some((i) => i.status === "overdue");
        }
        if (statusFilter === "defaulted") return plan.status === "defaulted";
        return true;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (plan) =>
          plan.customers?.full_name?.toLowerCase().includes(query) ||
          plan.customers?.phone?.includes(query) ||
          plan.id.slice(0, 8).toLowerCase().includes(query)
      );
    }

    setFilteredPlans(filtered);
  }, [plans, statusFilter, searchQuery]);

  const fetchPlans = async () => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("credit_plans")
        .select("*, customers(full_name, phone), installments(*)")
        .order("created_at", { ascending: false });

      setPlans(data || []);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async () => {
    if (!paymentModal) return;
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      // Update installment
      const { error: instError } = await supabase
        .from("installments")
        .update({
          status: "paid",
          paid_date: now,
          paid_amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
          reference: paymentReference || null,
        })
        .eq("id", paymentModal.installment.id);

      if (instError) throw instError;

      // Update plan balance
      const newBalance = paymentModal.plan.balance - parseFloat(paymentAmount);
      const allPaid = paymentModal.plan.installments.every(
        (i) => i.status === "paid" || i.id === paymentModal.installment.id
      );

      const { error: planError } = await supabase
        .from("credit_plans")
        .update({
          balance: Math.max(0, newBalance),
          status: allPaid && newBalance <= 0 ? "completed" : paymentModal.plan.status,
        })
        .eq("id", paymentModal.plan.id);

      if (planError) throw planError;

      // Refresh data
      await fetchPlans();
      setPaymentModal(null);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentReference("");
    } catch (err: any) {
      setError(err.message || "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  const markOverdue = async (installmentId: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("installments")
        .update({ status: "overdue" })
        .eq("id", installmentId);

      if (!error) {
        await fetchPlans();
      }
    } catch (err) {
      console.error("Failed to mark overdue:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "paid":
        return "bg-green-100 text-green-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      case "waived":
        return "bg-gray-100 text-gray-700";
      case "active":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "defaulted":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getSummaryStats = () => {
    let totalOutstanding = 0;
    let totalCollected = 0;
    let overdueCount = 0;

    plans.forEach((plan) => {
      plan.installments.forEach((inst) => {
        if (inst.status === "paid") {
          totalCollected += inst.paid_amount || inst.amount;
        } else if (inst.status === "overdue") {
          totalOutstanding += inst.amount;
          overdueCount++;
        } else {
          totalOutstanding += inst.amount;
        }
      });
    });

    return { totalOutstanding, totalCollected, overdueCount, totalPlans: plans.length };
  };

  const stats = getSummaryStats();

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
        <h1 className="text-2xl font-bold text-gray-900">কিস্তি বাকি (Installments)</h1>
        <p className="text-gray-500">Manage customer installment payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Active Plans</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalPlans}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">{formatBDT(stats.totalCollected)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-orange-600">{formatBDT(stats.totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or phone..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "completed", "overdue", "defaulted"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter
                  ? "bg-black text-white"
                  : "bg-white text-gray-700 border hover:bg-gray-50"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {filteredPlans.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No credit plans found.</p>
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const paidCount = plan.installments.filter((i) => i.status === "paid").length;
            const progress = (paidCount / plan.installment_count) * 100;

            return (
              <div key={plan.id} className="bg-white rounded-xl border overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{plan.customers?.full_name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {plan.customers?.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatBDT(plan.balance)}</p>
                      <p className="text-xs text-gray-500">of {formatBDT(plan.total_amount)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>
                        {paidCount}/{plan.installment_count} paid
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(plan.status)}`}>
                      {plan.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatBDT(plan.installment_amount)}/month
                    </span>
                  </div>
                </div>

                {/* Expanded Installments */}
                {selectedPlan?.id === plan.id && (
                  <div className="border-t">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">#</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Amount</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Due Date</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Paid</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Method</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Status</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.installments.map((inst) => (
                          <tr key={inst.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-sm">{inst.installment_number}</td>
                            <td className="px-4 py-2.5 text-sm font-medium">{formatBDT(inst.amount)}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600">
                              {new Date(inst.due_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2.5 text-sm">
                              {inst.paid_date ? (
                                <span className="text-green-600">
                                  {formatBDT(inst.paid_amount || 0)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-sm text-gray-600 capitalize">
                              {inst.payment_method || "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(inst.status)}`}
                              >
                                {inst.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {inst.status === "pending" && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPaymentModal({ installment: inst, plan });
                                    }}
                                    className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Record Payment
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markOverdue(inst.id);
                                    }}
                                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  >
                                    Mark Overdue
                                  </button>
                                </div>
                              )}
                              {inst.status === "overdue" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPaymentModal({ installment: inst, plan });
                                  }}
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Record Payment
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
              <button
                onClick={() => setPaymentModal(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Installment #{paymentModal.installment.installment_number}
                </p>
                <p className="text-lg font-semibold">
                  {formatBDT(paymentModal.installment.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  Due: {new Date(paymentModal.installment.due_date).toLocaleDateString()}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount (BDT)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder={paymentModal.installment.amount.toString()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="e.g. bKash TrxID"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={recordPayment}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirm Payment
                </button>
                <button
                  onClick={() => setPaymentModal(null)}
                  className="px-4 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
