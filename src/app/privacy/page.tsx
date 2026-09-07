import { Metadata } from "next";
import { getSupabase, isConfigured } from "@/lib/supabase";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Shield, Eye, Lock, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — RYmos",
  description:
    "Learn how RYmos collects, uses, and protects your personal information. Your privacy is important to us.",
  openGraph: {
    title: "Privacy Policy — RYmos",
    description:
      "Learn how RYmos collects, uses, and protects your personal information.",
    type: "website",
  },
};

const sections = [
  {
    icon: Eye,
    title: "Information We Collect",
    content: [
      "Personal information: name, email address, phone number, delivery address",
      "Account information: password (encrypted), profile photo, preferences",
      "Order information: products purchased, order history, payment method",
      "Device and browser information: IP address, browser type, operating system",
      "Usage data: pages visited, products viewed, search queries",
      "Location data: city and district for delivery purposes",
    ],
  },
  {
    icon: UserCheck,
    title: "How We Use Your Information",
    content: [
      "Process and fulfill your orders",
      "Communicate order status and delivery updates",
      "Provide customer support and respond to inquiries",
      "Improve our website, products, and services",
      "Send promotional offers and newsletters (with your consent)",
      "Prevent fraud and maintain platform security",
      "Comply with legal obligations",
    ],
  },
  {
    icon: Lock,
    title: "Information Sharing",
    content: [
      "We do NOT sell your personal information to third parties",
      "We share information with delivery partners to fulfill orders",
      "We may share with payment processors to complete transactions",
      "We may disclose information if required by law or to protect our rights",
      "We may share anonymized, aggregated data for analytics purposes",
    ],
  },
  {
    icon: Shield,
    title: "Data Security",
    content: [
      "We use SSL encryption for all data transmission",
      "Passwords are hashed using industry-standard algorithms",
      "We regularly update our security measures and conduct audits",
      "Access to personal data is limited to authorized personnel",
      "We retain data only as long as necessary for business purposes",
    ],
  },
];

const additionalSections = [
  {
    title: "Cookies & Tracking",
    content:
      "We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can control cookie settings through your browser. Disabling cookies may affect some website features.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, correct, or delete your personal information. You can also opt out of marketing communications at any time. To exercise these rights, contact us at support@rymos.com. We will respond to your request within 30 days.",
  },
  {
    title: "Children's Privacy",
    content:
      "Our website is not intended for children under 13. We do not knowingly collect information from children. If we become aware of such collection, we will delete the information promptly.",
  },
  {
    title: "Third-Party Links",
    content:
      "Our website may contain links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to read their privacy policies before providing any personal information.",
  },
  {
    title: "Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically. Continued use of our website after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact Us",
    content:
      "If you have questions about this Privacy Policy or our data practices, please contact us at: support@rymos.com or through our Contact page.",
  },
];

export default function PrivacyPage() {
  const supabase = getSupabase();
  const configured = isConfigured();

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[var(--color-dark-banner)] text-white py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Your privacy matters to us. Learn how we collect, use, and protect
              your personal information.
            </p>
          </div>
        </section>

        {/* Main Sections with Icons */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className="bg-[var(--color-bg-alt)] rounded-xl p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                      <section.icon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                      {section.title}
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {section.content.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm text-[var(--color-text-muted)] flex items-start gap-2"
                      >
                        <span className="text-[var(--color-primary)] mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Sections */}
        <section className="py-16 bg-[var(--color-bg-alt)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              {additionalSections.map((section, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                    {section.title}
                  </h2>
                  <p className="text-[var(--color-text-muted)] leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
