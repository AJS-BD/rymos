import { Metadata } from "next";
import { getSupabase, isConfigured } from "@/lib/supabase";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ContactForm from "./contact-form";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — RYmos",
  description:
    "Get in touch with RYmos. Visit our store in Dhaka, call us, email us, or send a message through our contact form. We're here to help.",
  openGraph: {
    title: "Contact Us — RYmos",
    description:
      "Get in touch with RYmos. Visit our store, call, email, or send a message. We're here to help.",
    type: "website",
  },
};

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Our Store",
    details: ["Level 4, Block D", "Bashundhara City Shopping Complex", "Dhaka 1229, Bangladesh"],
  },
  {
    icon: Phone,
    title: "Call Us",
    details: ["+880 1XXX-XXXXXX", "+880 1YYY-YYYYYY", "Sat–Thu: 10 AM – 9 PM"],
  },
  {
    icon: Mail,
    title: "Email Us",
    details: ["support@rymos.com", "sales@rymos.com", "We reply within 24 hours"],
  },
  {
    icon: Clock,
    title: "Business Hours",
    details: ["Saturday–Thursday: 10 AM – 9 PM", "Friday: 2 PM – 9 PM", "Open on most holidays"],
  },
];

const faqLinks = [
  { question: "How do I track my order?", href: "/faq#orders" },
  { question: "What is your return policy?", href: "/returns" },
  { question: "How does buy-on-credit work?", href: "/faq#credit" },
  { question: "Do you deliver nationwide?", href: "/faq#delivery" },
];

export default function ContactPage() {
  const supabase = getSupabase();
  const configured = isConfigured();

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[var(--color-dark-banner)] text-white py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Have a question, feedback, or need help? We&apos;d love to hear from
              you. Reach out through any of the channels below.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((item, index) => (
                <div
                  key={index}
                  className="bg-[var(--color-bg-alt)] rounded-xl p-6 text-center hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text)] mb-3">
                    {item.title}
                  </h3>
                  <div className="space-y-1">
                    {item.details.map((detail, i) => (
                      <p key={i} className="text-sm text-[var(--color-text-muted)]">
                        {detail}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form + Sidebar */}
        <section className="py-16 bg-[var(--color-bg-alt)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
                    Send Us a Message
                  </h2>
                  <p className="text-[var(--color-text-muted)] mb-6">
                    Fill out the form below and we&apos;ll get back to you within 24 hours.
                  </p>
                  <ContactForm />
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* WhatsApp CTA */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                    <h3 className="font-semibold text-[var(--color-text)]">
                      WhatsApp Support
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    Get instant help via WhatsApp. Our team is available during
                    business hours.
                  </p>
                  <a
                    href="https://wa.me/8801XXXXXXXXX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chat on WhatsApp
                  </a>
                </div>

                {/* Quick FAQ Links */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-[var(--color-text)] mb-4">
                    Common Questions
                  </h3>
                  <ul className="space-y-3">
                    {faqLinks.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                        >
                          → {link.question}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Placeholder */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6 text-center">
              Find Us
            </h2>
            <div className="bg-[var(--color-bg-alt)] rounded-xl h-64 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
                <p className="text-[var(--color-text-muted)]">
                  Bashundhara City Shopping Complex, Level 4, Block D
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Panthapath, Dhaka 1229
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
