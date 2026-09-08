"use client";

import { useState, useEffect } from "react";
import { CreditCard, Clock, CheckCircle, XCircle, AlertCircle, Calendar, DollarSign, Loader2 } from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";
interface Application {
  id: string;
  status: string;
  requested_amount: number;
  proposed_down_payment: number;
  proposed_installments: number;
  decision: string | null;
  rejection_reason: string | null;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface Installment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  paid_amount: number | null;
  payment_method: string | null;
  status: string;
}

interface CreditPlan {
  id: string;
  total_amount: number;
  down_payment: number;
  balance: number;
  installment_count: number;
  installment_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  installments: Installment[];
}

export default function CreditStatus() {
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [creditPlans, setCreditPlans] = useState<CreditPlan[]>([]);
  const [error, setError] = useState("");

  const searchApplications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setError("");
    setSearching(true);
    setSearched(false);

    if (!isConfigured()) {
      setError("Supabase is not configured.");
      setSearching(false);
      return;
    }

    try {
      const supabase = getSupabase();

      // Find customer by phone
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .single();

      if (!customer) {
        setError("No account found with this phone number.");
        setSearching(false);
        setSearched(true);
        return;
      }

      // Get applications
      const { data: apps } = await supabase
        .from("credit_applications")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      setApplications(apps || []);

      // Get credit plans with installments
      if (apps && apps.length > 0) {
        const approvedApps = apps.filter((a) => a.status === "approved" || a.decision === "approved");
        if (approvedApps.length > 0) {
          const appIds = approvedApps.map((a) => a.id);

          const { data: plans } = await supabase
            .from("credit_plans")
            .select("*, installments(*)")
            .in("application_id", appIds)
            .order("created_at", { ascending: false });

          setCreditPlans(plans || []);
        }
      }

      setSearched(true);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data.");
    } finally {
      setSearching(false);
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
      case "paid":
        return "bg-green-100 text-green-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "under_review":
        return <AlertCircle className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <main className="flex-1 pt-16 sm:pt-20">
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Credit Application Status</h1>
              <p className="text-gray-600 mt-1">Check your application status and installment schedule</p>
            </div>

        {/* Search */}
        <form onSubmit={searchApplications} className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Enter your phone number (01XXXXXXXXX)"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {searched && applications.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No credit applications found for this phone number.</p>
            <a
              href="/customer/credit-application"
              className="inline-block mt-4 text-black font-medium hover:underline"
            >
              Apply for credit →
            </a>
          </div>
        )}

        {/* Applications */}
        {applications.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-900">Your Applications</h2>
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {formatBDT(app.requested_amount)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      app.status
                    )}`}
                  >
                    {getStatusIcon(app.status)}
                    {app.status.replace("_", " ")}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Down Payment</p>
                    <p className="font-medium">{formatBDT(app.proposed_down_payment)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Installments</p>
                    <p className="font-medium">{app.proposed_installments} months</p>
                  </div>
                  {app.reviewed_at && (
                    <div>
                      <p className="text-gray-500">Reviewed</p>
                      <p className="font-medium">{new Date(app.reviewed_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                {app.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                      <span className="font-medium">Reason:</span> {app.rejection_reason}
                    </p>
                  </div>
                )}
                {app.review_notes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">{app.review_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Credit Plans & Installments */}
        {creditPlans.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Installment Schedule (কিস্তি)</h2>
            {creditPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-5 border-b bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Credit Plan</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(plan.status)}`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-medium">{formatBDT(plan.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Down Paid</p>
                      <p className="font-medium">{formatBDT(plan.down_payment)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Balance</p>
                      <p className="font-medium text-red-600">{formatBDT(plan.balance)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Per Installment</p>
                      <p className="font-medium">{formatBDT(plan.installment_amount)}</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">#</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Amount</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Due Date</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Paid</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.installments.map((inst) => (
                        <tr key={inst.id} className="border-t">
                          <td className="px-4 py-3 text-sm">{inst.installment_number}</td>
                          <td className="px-4 py-3 text-sm font-medium">{formatBDT(inst.amount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(inst.due_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {inst.paid_date ? (
                              <span className="text-green-600">
                                {formatBDT(inst.paid_amount || 0)}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {new Date(inst.paid_date).toLocaleDateString()}
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getStatusColor(inst.status)}`}
                            >
                              {inst.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      </main>
  );
}
