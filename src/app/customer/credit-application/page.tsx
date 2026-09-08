"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CreditCard, User, Phone, MapPin, Briefcase, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { formatBDT } from "@/lib/utils";
interface FormState {
  // Personal Info
  fullName: string;
  phone: string;
  email: string;
  nid: string;
  dateOfBirth: string;
  // Address
  presentAddress: string;
  permanentAddress: string;
  // Employment
  occupation: string;
  employer: string;
  monthlyIncome: string;
  // Credit Request
  requestedAmount: string;
  proposedDownPayment: string;
  proposedInstallments: string;
  purpose: string;
  // Documents
  nidFile: File | null;
  jobIdFile: File | null;
  bankStatementFile: File | null;
  guarantorNidFile: File | null;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelation: string;
  videoStatement: File | null;
}

const initialFormState: FormState = {
  fullName: "",
  phone: "",
  email: "",
  nid: "",
  dateOfBirth: "",
  presentAddress: "",
  permanentAddress: "",
  occupation: "",
  employer: "",
  monthlyIncome: "",
  requestedAmount: "",
  proposedDownPayment: "",
  proposedInstallments: "",
  purpose: "",
  nidFile: null,
  jobIdFile: null,
  bankStatementFile: null,
  guarantorNidFile: null,
  guarantorName: "",
  guarantorPhone: "",
  guarantorRelation: "",
  videoStatement: null,
};

export default function CreditApplication() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const nidRef = useRef<HTMLInputElement>(null);
  const jobIdRef = useRef<HTMLInputElement>(null);
  const bankRef = useRef<HTMLInputElement>(null);
  const guarantorRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof FormState, value: string | File | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isConfigured()) {
      setError("Supabase is not configured. Please check environment variables.");
      return;
    }

    if (!form.fullName || !form.phone || !form.nid || !form.requestedAmount) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabase();

      // Upload documents
      const uploadFile = async (file: File, bucket: string, folder: string) => {
        const ext = file.name.split(".").pop();
        const path = `${folder}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        return urlData.publicUrl;
      };

      const documents: Record<string, string> = {};

      if (form.nidFile) {
        documents.nid = await uploadFile(form.nidFile, "credit-docs", "nid");
      }
      if (form.jobIdFile) {
        documents.job_id = await uploadFile(form.jobIdFile, "credit-docs", "job-id");
      }
      if (form.bankStatementFile) {
        documents.bank_statement = await uploadFile(form.bankStatementFile, "credit-docs", "bank");
      }
      if (form.guarantorNidFile) {
        documents.guarantor_nid = await uploadFile(form.guarantorNidFile, "credit-docs", "guarantor");
      }

      let videoStatementUrl = "";
      if (form.videoStatement) {
        videoStatementUrl = await uploadFile(form.videoStatement, "credit-docs", "video");
      }

      // Create or get customer
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", form.phone)
        .single();

      let customerId = existingCustomer?.id;

      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            username: form.fullName.toLowerCase().replace(/\s+/g, "-") + "-" + form.phone.slice(-6),
            full_name: form.fullName,
            phone: form.phone,
            address: form.permanentAddress || form.presentAddress,
            customer_type: "online",
            created_via: "online_signup",
          })
          .select("id")
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Create credit application
      const { error: appError } = await supabase.from("credit_applications").insert({
        customer_id: customerId,
        status: "pending",
        requested_amount: parseFloat(form.requestedAmount),
        proposed_down_payment: parseFloat(form.proposedDownPayment) || 0,
        proposed_installments: parseInt(form.proposedInstallments) || 0,
        documents,
        video_statement_url: videoStatementUrl,
        guarantor_info: {
          name: form.guarantorName,
          phone: form.guarantorPhone,
          relation: form.guarantorRelation,
        },
      });

      if (appError) throw appError;

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex-1 pt-16 sm:pt-20">
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your credit application has been received. We will review it and update the status within 24-48 hours.
              </p>
              <a
                href="/customer/credit-status"
                className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Check Application Status
              </a>
            </div>
          </div>
        </main>
    );
  }

  return (
    <main className="flex-1 pt-16 sm:pt-20">
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Credit Application</h1>
              <p className="text-gray-600 mt-1">Apply for installment-based purchase (কিস্তি)</p>
            </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NID Number *</label>
                <input
                  type="text"
                  value={form.nid}
                  onChange={(e) => updateField("nid", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="National ID number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Address
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Present Address</label>
                <textarea
                  value={form.presentAddress}
                  onChange={(e) => updateField("presentAddress", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  rows={2}
                  placeholder="Current address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                <textarea
                  value={form.permanentAddress}
                  onChange={(e) => updateField("permanentAddress", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  rows={2}
                  placeholder="Permanent address"
                />
              </div>
            </div>
          </section>

          {/* Employment */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Employment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                <input
                  type="text"
                  value={form.occupation}
                  onChange={(e) => updateField("occupation", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Your occupation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer / Business</label>
                <input
                  type="text"
                  value={form.employer}
                  onChange={(e) => updateField("employer", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Company or business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (BDT)</label>
                <input
                  type="number"
                  value={form.monthlyIncome}
                  onChange={(e) => updateField("monthlyIncome", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Monthly income"
                />
              </div>
            </div>
          </section>

          {/* Credit Request */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Credit Request
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Amount (BDT) *</label>
                <input
                  type="number"
                  value={form.requestedAmount}
                  onChange={(e) => updateField("requestedAmount", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Total amount needed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment (BDT)</label>
                <input
                  type="number"
                  value={form.proposedDownPayment}
                  onChange={(e) => updateField("proposedDownPayment", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Initial payment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Installments</label>
                <select
                  value={form.proposedInstallments}
                  onChange={(e) => updateField("proposedInstallments", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="">Select</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="9">9 months</option>
                  <option value="12">12 months</option>
                  <option value="18">18 months</option>
                  <option value="24">24 months</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <textarea
                  value={form.purpose}
                  onChange={(e) => updateField("purpose", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  rows={2}
                  placeholder="What do you plan to purchase?"
                />
              </div>
            </div>
            {form.requestedAmount && form.proposedDownPayment && form.proposedInstallments && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-600">
                  Monthly installment:{" "}
                  <span className="font-semibold text-gray-900">
                    {formatBDT(
                      (parseFloat(form.requestedAmount) - parseFloat(form.proposedDownPayment || "0")) /
                        parseInt(form.proposedInstallments || "1")
                    )}
                  </span>
                </p>
              </div>
            )}
          </section>

          {/* Document Uploads */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Uploads
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NID Copy *</label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => nidRef.current?.click()}
                >
                  <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {form.nidFile ? form.nidFile.name : "Click to upload NID"}
                  </p>
                </div>
                <input
                  ref={nidRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => updateField("nidFile", e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job ID / Office ID</label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => jobIdRef.current?.click()}
                >
                  <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {form.jobIdFile ? form.jobIdFile.name : "Click to upload Job ID"}
                  </p>
                </div>
                <input
                  ref={jobIdRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => updateField("jobIdFile", e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement (last 6 months)</label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => bankRef.current?.click()}
                >
                  <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {form.bankStatementFile ? form.bankStatementFile.name : "Click to upload bank statement"}
                  </p>
                </div>
                <input
                  ref={bankRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => updateField("bankStatementFile", e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor NID</label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => guarantorRef.current?.click()}
                >
                  <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {form.guarantorNidFile ? form.guarantorNidFile.name : "Click to upload guarantor NID"}
                  </p>
                </div>
                <input
                  ref={guarantorRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => updateField("guarantorNidFile", e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </section>

          {/* Guarantor Info */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Guarantor Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor Name</label>
                <input
                  type="text"
                  value={form.guarantorName}
                  onChange={(e) => updateField("guarantorName", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor Phone</label>
                <input
                  type="tel"
                  value={form.guarantorPhone}
                  onChange={(e) => updateField("guarantorPhone", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                <input
                  type="text"
                  value={form.guarantorRelation}
                  onChange={(e) => updateField("guarantorRelation", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="e.g. Father, Brother"
                />
              </div>
            </div>
          </section>

          {/* Video Statement */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Video Statement
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Record a short video stating your name, the product you want to purchase, and your commitment to pay installments on time.
            </p>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => videoRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {form.videoStatement ? form.videoStatement.name : "Click to upload video statement (MP4, max 50MB)"}
              </p>
            </div>
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => updateField("videoStatement", e.target.files?.[0] || null)}
            />
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </button>
        </form>
          </div>
        </div>
      </main>
  );
}
