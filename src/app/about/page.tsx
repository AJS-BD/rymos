import { Metadata } from "next";
import Link from "next/link";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { Target, Users, Award, Heart, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — RYmos",
  description:
    "Learn about RYmos — our story, mission, and the team behind Bangladesh's trusted destination for smartphones and premium accessories.",
  openGraph: {
    title: "About Us — RYmos",
    description:
      "Learn about RYmos — our story, mission, and the team behind Bangladesh's trusted destination for smartphones and premium accessories.",
    type: "website",
  },
};

const team = [
  {
    name: "Rafiqul Islam",
    role: "Founder & CEO",
    bio: "Visionary entrepreneur with 15+ years in consumer electronics retail across Bangladesh.",
  },
  {
    name: "Yasmin Akter",
    role: "Head of Operations",
    bio: "Ensures seamless logistics, inventory management, and customer fulfillment.",
  },
  {
    name: "Tanvir Hossain",
    role: "Head of Technology",
    bio: "Leads platform development and digital innovation for the RYmos shopping experience.",
  },
  {
    name: "Nusrat Jahan",
    role: "Customer Success Lead",
    bio: "Dedicated to making every customer interaction exceptional and memorable.",
  },
];

const milestones = [
  { year: "2019", event: "RYmos founded as a small electronics shop in Dhaka" },
  { year: "2020", event: "Launched e-commerce platform serving all of Bangladesh" },
  { year: "2021", event: "Introduced buy-on-credit program for customers" },
  { year: "2022", event: "Expanded to 10,000+ happy customers nationwide" },
  { year: "2023", event: "Launched premium accessories and exclusive deals" },
  { year: "2024", event: "Serving 50,000+ customers with same-day delivery" },
];

export default function AboutPage() {
  const supabase = getSupabase();
  const configured = isConfigured();

  return (
    <main className="flex-1 pt-16 sm:pt-20">
        {/* Hero Section */}
        <section className="bg-[var(--color-dark-banner)] text-white py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              About RYmos
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Technology, Made Yours. We&apos;re on a mission to make premium
              smartphones and accessories accessible to everyone in Bangladesh.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-[var(--color-text)] mb-6">
                  Our Story
                </h2>
                <p className="text-[var(--color-text-muted)] mb-4 leading-relaxed">
                  RYmos started in 2019 as a small electronics shop in Dhaka with
                  a simple belief: everyone deserves access to the latest
                  technology, regardless of their budget or location.
                </p>
                <p className="text-[var(--color-text-muted)] mb-4 leading-relaxed">
                  What began as a single storefront has grown into
                  Bangladesh&apos;s trusted online destination for smartphones,
                  accessories, and consumer electronics. We&apos;ve served over
                  50,000 customers across all 64 districts, and we&apos;re just
                  getting started.
                </p>
                <p className="text-[var(--color-text-muted)] leading-relaxed">
                  Our name — RYmos — represents our founders&apos; vision: making
                  technology personal, accessible, and empowering for every
                  Bangladeshi.
                </p>
              </div>
              <div className="bg-[var(--color-bg-alt)] rounded-2xl p-8 sm:p-12">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-3xl font-bold text-[var(--color-primary)]">50K+</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Happy Customers</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[var(--color-primary)]">64</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Districts Served</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[var(--color-primary)]">5+</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Years of Trust</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[var(--color-primary)]">100%</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Genuine Products</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className="py-16 sm:py-20 bg-[var(--color-bg-alt)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[var(--color-text)] mb-4">
                Our Mission & Values
              </h2>
              <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto">
                Everything we do is guided by our commitment to our customers and
                community.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[var(--color-text)] mb-2">Accessibility</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Making premium technology available to everyone through flexible
                  payment options including COD and credit.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[var(--color-text)] mb-2">Authenticity</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  100% genuine products with manufacturer warranty. No
                  counterfeits, no compromises.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[var(--color-text)] mb-2">Community</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Building lasting relationships with our customers through trust,
                  transparency, and exceptional service.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-[var(--color-text)] mb-2">Service</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Dedicated customer support via WhatsApp, phone, and in-person at
                  our Dhaka location.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-[var(--color-text)] text-center mb-12">
              Our Journey
            </h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{milestone.year}</span>
                  </div>
                  <div className="flex-1 bg-[var(--color-bg-alt)] rounded-lg p-4">
                    <p className="text-[var(--color-text)]">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 sm:py-20 bg-[var(--color-bg-alt)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[var(--color-text)] mb-4">
                Meet Our Team
              </h2>
              <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto">
                The passionate people behind RYmos who work every day to bring you
                the best technology experience.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-20 h-20 bg-[var(--color-dark-banner)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[var(--color-text)]">{member.name}</h3>
                  <p className="text-sm text-[var(--color-primary)] font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[var(--color-dark-banner)] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Shop?</h2>
            <p className="text-gray-300 mb-8">
              Explore our collection of the latest smartphones and premium
              accessories.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-[var(--color-dark-banner)] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
  );
}
