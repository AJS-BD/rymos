"use client";

import { useState } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isConfigured()) {
      setError("Contact form is not configured. Please reach us by phone or WhatsApp.");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();
      const { error: insertError } = await supabase.from("contact_messages").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
      });

      if (insertError) {
        // 42P01 = relation missing; PGRST205 = table hidden by RLS/schema cache
        // (what Supabase returns when the table doesn't exist yet for this role)
        setError(
          insertError.code === "42P01" ||
            insertError.code === "PGRST205" ||
            insertError.message.includes("does not exist") ||
            insertError.message.includes("schema cache")
            ? "We could not save your message right now. Please reach us by phone or WhatsApp instead."
            : "Something went wrong while sending. Please try again."
        );
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong while sending. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
          Message Sent!
        </h3>
        <p className="text-[var(--color-text-muted)]">
          Thank you for reaching out. We&apos;ll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-[var(--color-text)] mb-1"
          >
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--color-text)] mb-1"
          >
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-[var(--color-text)] mb-1"
        >
          Subject *
        </label>
        <select
          id="subject"
          name="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
        >
          <option value="">Select a subject</option>
          <option value="order">Order Inquiry</option>
          <option value="product">Product Question</option>
          <option value="credit">Credit Application</option>
          <option value="return">Return / Refund</option>
          <option value="feedback">Feedback</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-[var(--color-text)] mb-1"
        >
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell us how we can help..."
          className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          "Sending..."
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
