import { Metadata } from "next";
import { getSupabase, isConfigured } from "@/lib/supabase";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions — RYmos",
  description:
    "Read RYmos's Terms & Conditions governing the use of our website, purchase of products, and all related services.",
  openGraph: {
    title: "Terms & Conditions — RYmos",
    description:
      "Read RYmos's Terms & Conditions governing the use of our website, purchase of products, and all related services.",
    type: "website",
  },
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing and using the RYmos website (rymos.com), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website or services. These terms apply to all visitors, users, and customers of the platform.",
  },
  {
    title: "2. Account Registration",
    content:
      "To make purchases and access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration and keep your profile updated.",
  },
  {
    title: "3. Products & Pricing",
    content:
      "All products listed on RYmos are subject to availability. We make every effort to display accurate product descriptions, images, and prices. In the event of a pricing error, we reserve the right to cancel orders placed at the incorrect price and will notify you promptly. Prices are listed in Bangladeshi Taka (৳) and include all applicable taxes unless stated otherwise.",
  },
  {
    title: "4. Orders & Payment",
    content:
      "By placing an order, you are making an offer to purchase products. All orders are subject to acceptance and availability. We accept Cash on Delivery (COD), mobile banking (bKash, Nagad, Rocket), bank transfers, and credit/debit cards. We reserve the right to refuse or cancel any order for reasons including product availability, errors in pricing, or suspected fraudulent activity.",
  },
  {
    title: "5. Shipping & Delivery",
    content:
      "Delivery times are estimates and may vary based on location and circumstances. RYmos is not responsible for delays caused by courier partners, weather conditions, or other factors beyond our control. Risk of loss and title for products pass to you upon delivery.",
  },
  {
    title: "6. Returns & Refunds",
    content:
      "We offer a 7-day return policy for unused, unopened products in original packaging. Defective products may be returned within 14 days of delivery. Refunds are processed within 3-5 business days after we receive the returned item. For full details, please refer to our Returns Policy page.",
  },
  {
    title: "7. Buy on Credit",
    content:
      "Our buy-on-credit program is subject to approval based on credit assessment. By applying for credit, you authorize RYmos to verify your information and assess your creditworthiness. Late payments may incur additional charges and affect your eligibility for future credit. Full terms are provided during the application process.",
  },
  {
    title: "8. Intellectual Property",
    content:
      "All content on the RYmos website, including text, graphics, logos, images, and software, is the property of RYmos or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.",
  },
  {
    title: "9. User Conduct",
    content:
      "You agree not to use our website for any unlawful purpose, to make fraudulent orders, to attempt unauthorized access to our systems, or to interfere with the proper functioning of the website. Violation of these terms may result in account termination and legal action.",
  },
  {
    title: "10. Limitation of Liability",
    content:
      "RYmos shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products. Our total liability shall not exceed the amount paid for the specific product in question. We do not guarantee uninterrupted or error-free website operation.",
  },
  {
    title: "11. Privacy",
    content:
      "Your use of our website is also governed by our Privacy Policy. By using RYmos, you consent to the collection and use of your information as described in our Privacy Policy.",
  },
  {
    title: "12. Changes to Terms",
    content:
      "RYmos reserves the right to modify these Terms and Conditions at any time. Changes take effect immediately upon posting to the website. Your continued use of the website after changes are posted constitutes acceptance of the modified terms.",
  },
  {
    title: "13. Governing Law",
    content:
      "These Terms and Conditions are governed by the laws of Bangladesh. Any disputes arising from these terms or your use of RYmos shall be subject to the exclusive jurisdiction of the courts of Dhaka, Bangladesh.",
  },
  {
    title: "14. Contact Information",
    content:
      "For questions about these Terms and Conditions, please contact us at: support@rymos.com or visit our Contact page.",
  },
];

export default function TermsPage() {
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
              Terms & Conditions
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Last updated: September 2024. Please read these terms carefully
              before using our website and services.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[var(--color-bg-alt)] rounded-xl p-6 sm:p-10">
              <div className="space-y-8">
                {sections.map((section, index) => (
                  <div key={index}>
                    <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[var(--color-primary)] flex-shrink-0" />
                      {section.title}
                    </h2>
                    <p className="text-[var(--color-text-muted)] leading-relaxed pl-7">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
