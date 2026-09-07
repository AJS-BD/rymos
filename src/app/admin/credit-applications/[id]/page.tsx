"use client";

import { useState, useEffect, use } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Video,
  Briefcase,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
  documents: Record<string, string>;
  video_statement_url: string;
  guarantor_info: Record<string, string>;
  review_notes: string | null;
  decision: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  customers: {
    full_name: string;
    phone: string;
    address: string;
    email?: string;
  };
}

export default function ReviewApplication({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [application, setApplication] = useState<CreditApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "documents" | "guarantor">("info");
  const [reviewNotes, setReviewNotes] = useState("");
  const [decision, setDecision] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    if (!isConfigured()) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("credit_applications")
        .select("*, customers(full_name, phone, address, email)")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      setApplication(data);
      setReviewNotes(data.review_notes || "");
    } catch (err: any) {
      setError(err.message || "Failed to load application.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!application) return;
    setSaving(true);
    setError("");

    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      // Update application
      const { error: appError } = await supabase
        .from("credit_plans")
        .insert({
          application_id: application.id,
          customer_id: application.customer_id,
          total_amount: application.requested_amount,
          down_payment: application.proposed_down_payment,
          balance: application.requested_amount - application.proposed_down_payment,
          installment_count: application.proposed_installments,
          installment_amount:
            (application.requested_amount - application.proposed_down_payment) /
            application.proposed_installments,
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + application.proposed_installments * 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          status: "active",
        });

      if (appError) throw appError;

      // Update application status
      const { error: updateError } = await supabase
        .from("credit_applications")
        .update({
          status: "approved",
          decision: "approved",
          review_notes: reviewNotes,
          reviewed_at: now,
          updated_at: now,
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      setApplication((prev) =>
        prev
          ? {
              ...prev,
              status: "approved",
              decision: "approved",
              review_notes: reviewNotes,
              reviewed_at: now,
              updated_at: now,
            }
          : null
      );
      setShowApproveForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to approve application.");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("credit_applications")
        .update({
          status: "rejected",
          decision: "rejected",
          rejection_reason: rejectionReason,
          review_notes: reviewNotes,
          reviewed_at: now,
          updated_at: now,
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      setApplication((prev) =>
        prev
          ? {
              ...prev,
              status: "rejected",
              decision: "rejected",
              rejection_reason: rejectionReason,
              review_notes: reviewNotes,
              reviewed_at: now,
              updated_at: now,
            }
          : null
      );
      setShowRejectForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to reject application.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkUnderReview = async () => {
    if (!application) return;
    setSaving(true);

    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("credit_applications")
        .update({ status: "under_review", updated_at: now })
        .eq("id", application.id);

      if (error) throw error;

      setApplication((prev) => (prev ? { ...prev, status: "under_review", updated_at: now } : null));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!application) return;
    setSaving(true);

    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("credit_applications")
        .update({ review_notes: reviewNotes, updated_at: now })
        .eq("id", application.id);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Application not found.</p>
        <Link href="/admin/credit-applications" className="text-black font-medium hover:underline mt-2 inline-block">
          ← Back to applications
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/admin/credit-applications"
            className="mt-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Application</h1>
            <p className="text-gray-500">ID: {application.id.slice(0, 8)}...</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
            application.status
          )}`}
        >
          {application.status.replace("_", " ")}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      {(application.status === "pending" || application.status === "under_review") && (
        <div className="flex items-center gap-3 bg-white rounded-lg border p-4">
          {application.status === "pending" && (
            <button
              onClick={handleMarkUnderReview}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Mark Under Review
            </button>
          )}
          {!showApproveForm && !showRejectForm && (
            <>
              <button
                onClick={() => setShowApproveForm(true)}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}
        </div>
      )}

      {/* Approve Form */}
      {showApproveForm && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-green-900">Approve Application</h3>
          <p className="text-sm text-green-700">
            This will create an active credit plan with {application.proposed_installments} monthly installments of{" "}
            {formatBDT(
              (application.requested_amount - application.proposed_down_payment) /
                application.proposed_installments
            )}
            .
          </p>
          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">Review Notes</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirm Approval
            </button>
            <button
              onClick={() => setShowApproveForm(false)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reject Form */}
      {showRejectForm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-red-900">Reject Application</h3>
          <div>
            <label className="block text-sm font-medium text-red-900 mb-1">Rejection Reason *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows={2}
              placeholder="Why is this application being rejected?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-red-900 mb-1">Review Notes</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows={2}
              placeholder="Optional internal notes..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={saving}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Confirm Rejection
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Decision Display */}
      {application.decision && (
        <div
          className={`rounded-xl p-5 ${
            application.decision === "approved"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <h3 className="font-semibold mb-1">
            Decision: {application.decision.charAt(0).toUpperCase() + application.decision.slice(1)}
          </h3>
          {application.rejection_reason && (
            <p className="text-sm text-red-700 mt-1">Reason: {application.rejection_reason}</p>
          )}
          {application.review_notes && (
            <p className="text-sm text-gray-600 mt-2">Notes: {application.review_notes}</p>
          )}
          {application.reviewed_at && (
            <p className="text-xs text-gray-500 mt-2">
              Reviewed: {new Date(application.reviewed_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["info", "documents", "guarantor"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Full Name</p>
                <p className="font-medium">{application.customers?.full_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{application.customers?.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                <span>{application.customers?.address}</span>
              </div>
            </div>
          </div>

          {/* Credit Request */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Credit Request
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Requested Amount</span>
                <span className="font-semibold">{formatBDT(application.requested_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Down Payment</span>
                <span className="font-medium">{formatBDT(application.proposed_down_payment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Installments</span>
                <span className="font-medium">{application.proposed_installments} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Payment</span>
                <span className="font-medium text-blue-600">
                  {formatBDT(
                    (application.requested_amount - application.proposed_down_payment) /
                      application.proposed_installments
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Applied</span>
                <span>{new Date(application.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Uploaded Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {application.documents?.nid && (
              <div className="bg-white rounded-xl border p-4">
                <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  NID Copy
                </p>
                <a
                  href={application.documents.nid}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                >
                  View Document →
                </a>
              </div>
            )}
            {application.documents?.job_id && (
              <div className="bg-white rounded-xl border p-4">
                <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Job ID
                </p>
                <a
                  href={application.documents.job_id}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                >
                  View Document →
                </a>
              </div>
            )}
            {application.documents?.bank_statement && (
              <div className="bg-white rounded-xl border p-4">
                <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Bank Statement
                </p>
                <a
                  href={application.documents.bank_statement}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                >
                  View Document →
                </a>
              </div>
            )}
            {application.documents?.guarantor_nid && (
              <div className="bg-white rounded-xl border p-4">
                <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Guarantor NID
                </p>
                <a
                  href={application.documents.guarantor_nid}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                >
                  View Document →
                </a>
              </div>
            )}
            {application.video_statement_url && (
              <div className="bg-white rounded-xl border p-4 md:col-span-2">
                <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video Statement
                </p>
                <video
                  src={application.video_statement_url}
                  controls
                  className="w-full max-w-md rounded-lg"
                  preload="metadata"
                />
              </div>
            )}
            {!application.documents?.nid &&
              !application.documents?.job_id &&
              !application.documents?.bank_statement &&
              !application.documents?.guarantor_nid &&
              !application.video_statement_url && (
                <div className="bg-gray-50 rounded-xl border p-6 text-center col-span-2">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No documents uploaded</p>
                </div>
              )}
          </div>
        </div>
      )}

      {activeTab === "guarantor" && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" />
            Guarantor Information
          </h3>
          {application.guarantor_info?.name ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{application.guarantor_info.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{application.guarantor_info.phone || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Relation</p>
                <p className="font-medium">{application.guarantor_info.relation || "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No guarantor information provided.</p>
          )}
        </div>
      )}
    </div>
  );
}
