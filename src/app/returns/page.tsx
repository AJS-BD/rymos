import { Metadata } from "next";
import { getSupabase, isConfigured } from "@/lib/supabase";
import {
  RotateCcw,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns & Refunds Policy — RYmos",
  description:
    "Learn about our hassle-free return and refund policy. 7-day returns for unused products, 14-day returns for defective items. Easy process, fast refunds.",
  openGraph: {
    title: "Returns & Refunds Policy — RYmos",
    description:
      "Hassle-free returns within 7 days for unused products, 14 days for defective items.",
    type: "website",
  },
};

const policyPoints = [
  {
    icon: CheckCircle,
    title: "7-Day Return Window",
    description:
      "Return any unused, unopened product in its original packaging within 7 days of delivery for a full refund.",
    color: "text-green-600",
  },
  {
    icon: AlertCircle,
    title: "14-Day Defective Returns",
    description:
      "If your product is defective or damaged, you have 14 days from delivery to request a return or exchange.",
    color: "text-yellow-600",
  },
  {
    icon: Clock,
    title: "Fast Refunds",
    description:
      "Refunds are processed within 3-5 business days after we receive and inspect the returned item.",
    color: "text-blue-600",
  },
  {
    icon: Truck,
    title: "Free Return Shipping",
    description:
      "For defective items, we cover return shipping costs. For change-of-mind returns, a small shipping fee may apply.",
    color: "text-purple-600",
  },
];

const returnSteps = [
  {
    step: "1",
    title: "Request a Return",
    description:
      "Go to 'My Orders' in your account, select the order, and click 'Request Return'. Or contact us via WhatsApp with your order number.",
  },
  {
    step: "2",
    title: "Get Approval",
    description:
      "Our team reviews your request within 24 hours and sends you a return authorization with shipping instructions.",
  },
  {
    step: "3",
    title: "Ship the Item",
    description:
      "Pack the product securely in its original packaging with all accessories, manuals, and freebies included.",
  },
  {
    step: "4",
    title: "Receive Refund",
    description:
      "Once we receive and inspect the item, your refund is processed within 3-5 business days to your original payment method.",
  },
];

const nonReturnable = [
  "Products opened or used (unless defective)",
  "Products without original packaging or accessories",
  "Products with physical damage caused by the customer",
  "SIM cards or memory cards that have been activated",
  "Software or digital products",
  "Gift cards or promotional vouchers",
  "Products marked as 'Non-Returnable' on the product page",
];

export default function ReturnsPage() {
  const supabase = getSupabase();
  const configured = isConfigured();

  return (
    <main className="flex-1 pt-16 sm:pt-20">
        {/* Hero */}
        <section className="bg-[var(--color-dark-banner)] text-white py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Returns & Refunds
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              We want you to be completely satisfied. If something isn&apos;t
              right, we make returns easy and hassle-free.
            </p>
          </div>
        </section>

        {/* Policy Highlights */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {policyPoints.map((point, index) => (
                <div
                  key={index}
                  className="bg-[var(--color-bg-alt)] rounded-xl p-6 text-center hover:shadow-md transition-shadow"
                >
                  <point.icon className={`h-10 w-10 mx-auto mb-3 ${point.color}`} />
                  <h3 className="font-semibold text-[var(--color-text)] mb-2">
                    {point.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Return */}
        <section className="py-16 bg-[var(--color-bg-alt)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-[var(--color-text)] text-center mb-10">
              How to Return
            </h2>
            <div className="space-y-6">
              {returnSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{step.step}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Refund Methods */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-[var(--color-primary)]" />
              Refund Methods
            </h2>
            <div className="bg-[var(--color-bg-alt)] rounded-xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-[var(--color-text)] mb-2">
                    For COD Orders
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Refunds are issued via bank transfer or mobile banking (bKash,
                    Nagad). You&apos;ll need to provide your account details when
                    requesting the return.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-[var(--color-text)] mb-2">
                    For Prepaid Orders
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Refunds go back to the original payment method — your
                    mobile banking account or card. Processing time is 3-5
                    business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Non-Returnable Items */}
        <section className="py-16 bg-[var(--color-bg-alt)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              Non-Returnable Items
            </h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <ul className="space-y-3">
                {nonReturnable.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-[var(--color-text-muted)]"
                  >
                    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Exchange Policy */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6 flex items-center gap-2">
              <RotateCcw className="h-6 w-6 text-[var(--color-primary)]" />
              Exchange Policy
            </h2>
            <div className="bg-[var(--color-bg-alt)] rounded-xl p-6">
              <p className="text-[var(--color-text-muted)] mb-4">
                Prefer an exchange instead of a refund? We&apos;ve got you
                covered:
              </p>
              <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Exchange for a different variant (color, storage) of the same
                  product
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  If the new item costs more, pay the difference
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  If the new item costs less, receive a refund for the difference
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  Exchanges are subject to product availability
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[var(--color-dark-banner)] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Need to Return Something?</h2>
            <p className="text-gray-300 mb-6">
              Our support team is ready to help you with your return or exchange.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-dark-banner)] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/customer/orders"
                className="inline-flex items-center justify-center gap-2 border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                View My Orders
              </Link>
            </div>
          </div>
        </section>
      </main>
  );
}
