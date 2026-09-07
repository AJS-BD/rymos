import { Metadata } from "next";
import { getSupabase, isConfigured } from "@/lib/supabase";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import FaqAccordion from "./faq-accordion";
import { HelpCircle, MessageCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions | RYmos",
  description:
    "Find answers to common questions about RYmos orders, delivery, returns, credit applications, and more. Can't find what you need? Contact us.",
  openGraph: {
    title: "FAQ — Frequently Asked Questions | RYmos",
    description:
      "Find answers to common questions about RYmos orders, delivery, returns, credit applications, and more.",
    type: "website",
  },
};

const faqCategories = [
  {
    id: "orders",
    title: "Orders & Payments",
    questions: [
      {
        q: "How do I place an order?",
        a: "Browse our products, add items to your cart, and proceed to checkout. You can pay via cash on delivery (COD), mobile banking, or apply for our buy-on-credit program.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept Cash on Delivery (COD), bKash, Nagad, Rocket, bank transfers, and credit card payments. We also offer a buy-on-credit program for eligible customers.",
      },
      {
        q: "Can I modify or cancel my order?",
        a: "You can modify or cancel your order within 1 hour of placing it by contacting our support team via WhatsApp or phone. After that, the order enters processing and cannot be changed.",
      },
      {
        q: "How do I track my order?",
        a: "Once your order is shipped, you'll receive a tracking link via SMS and email. You can also check your order status in the 'My Orders' section of your account dashboard.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery & Shipping",
    questions: [
      {
        q: "Do you deliver nationwide?",
        a: "Yes! We deliver to all 64 districts of Bangladesh. Delivery times vary by location: 1-2 days for Dhaka, 2-4 days for major cities, and 3-5 days for other areas.",
      },
      {
        q: "How much does delivery cost?",
        a: "Delivery is free for orders over ৳5,000 within Dhaka. For orders below ৳5,000 or outside Dhaka, a flat delivery fee of ৳100-৳200 applies depending on location.",
      },
      {
        q: "Do you offer same-day delivery?",
        a: "Yes, we offer same-day delivery for orders placed before 12 PM within Dhaka city. This service is subject to product availability and order volume.",
      },
      {
        q: "What if I'm not home during delivery?",
        a: "Our delivery partner will call you before arriving. If you're unavailable, they'll attempt redelivery the next business day. You can also arrange for someone else to receive the package on your behalf.",
      },
    ],
  },
  {
    id: "returns",
    title: "Returns & Refunds",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a 7-day return policy for unused, unopened products in original packaging. For defective items, you have 14 days from delivery to request a return or exchange.",
      },
      {
        q: "How do I initiate a return?",
        a: "Go to 'My Orders' in your account, select the order, and click 'Request Return'. Alternatively, contact our support team via WhatsApp with your order number and reason for return.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds are processed within 3-5 business days after we receive the returned item. For COD orders, refunds are issued via bank transfer or mobile banking. For prepaid orders, refunds go back to the original payment method.",
      },
      {
        q: "Can I exchange a product instead of returning it?",
        a: "Yes! You can request an exchange for a different variant (color, storage) of the same product. If the new item costs more, you'll pay the difference. If it costs less, you'll receive a refund for the difference.",
      },
    ],
  },
  {
    id: "credit",
    title: "Buy on Credit",
    questions: [
      {
        q: "How does the buy-on-credit program work?",
        a: "Our buy-on-credit program allows you to purchase products and pay in monthly installments. Apply through your account, get approved, and choose a payment plan that suits your budget.",
      },
      {
        q: "Who is eligible for credit?",
        a: "Any Bangladeshi citizen aged 21-55 with a valid NID, steady income, and a mobile banking account can apply. Approval is subject to credit assessment.",
      },
      {
        q: "What documents do I need?",
        a: "You'll need a clear photo of your NID (front and back), a recent passport-size photo, and proof of income (salary slip, business documents, or bank statement).",
      },
      {
        q: "What are the installment terms?",
        a: "We offer 3, 6, and 12-month installment plans. Interest rates vary based on the plan length and your credit profile. All terms are clearly displayed before you confirm your purchase.",
      },
    ],
  },
  {
    id: "products",
    title: "Products & Warranty",
    questions: [
      {
        q: "Are all products genuine?",
        a: "Absolutely. We source all products directly from authorized distributors and manufacturers. Every product comes with a valid manufacturer warranty and is 100% genuine.",
      },
      {
        q: "Do you offer warranty service?",
        a: "Yes, all products come with manufacturer warranty. For warranty claims, contact us and we'll guide you through the process. We also offer extended warranty options for select products.",
      },
      {
        q: "Can I reserve a product that's out of stock?",
        a: "Yes! You can join the waitlist for out-of-stock products. We'll notify you via email and SMS when the item is back in stock, giving you priority access before general availability.",
      },
      {
        q: "Do you price match?",
        a: "We strive to offer the best prices. If you find a lower price from an authorized retailer, contact us within 24 hours of purchase and we'll match the price or refund the difference.",
      },
    ],
  },
];

export default function FaqPage() {
  const supabase = getSupabase();
  const configured = isConfigured();

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[var(--color-dark-banner)] text-white py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Find quick answers to common questions about orders, delivery,
              returns, and our buy-on-credit program.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-10">
              {faqCategories.map((category) => (
                <div key={category.id} id={category.id}>
                  <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
                    <HelpCircle className="h-6 w-6 text-[var(--color-primary)]" />
                    {category.title}
                  </h2>
                  <FaqAccordion questions={category.questions} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="py-16 bg-[var(--color-bg-alt)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <MessageCircle className="h-12 w-12 text-[var(--color-primary)] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-3">
              Still Have Questions?
            </h2>
            <p className="text-[var(--color-text-muted)] mb-6">
              Can&apos;t find the answer you&apos;re looking for? Our friendly
              support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Contact Us
              </Link>
              <a
                href="https://wa.me/8801XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
