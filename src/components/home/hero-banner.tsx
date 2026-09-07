import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text)] leading-tight">
              Technology, Made Yours
            </h1>
            <p className="mt-6 text-lg text-[var(--color-text-muted)] max-w-lg">
              Discover the latest smartphones and premium accessories, chosen for
              you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/products?category=smartphones"
                className="inline-flex items-center justify-center px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Shop Smartphones
              </Link>
              <Link
                href="/products?category=accessories"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg font-medium hover:bg-[var(--color-primary)] hover:text-white transition-colors"
              >
                Explore Accessories
              </Link>
            </div>

            {/* Floating Specs */}
            <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
              <span className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-md border border-[var(--color-border)]">
                120Hz Display
              </span>
              <span className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-md border border-[var(--color-border)]">
                A17 Pro Chip
              </span>
              <span className="px-4 py-2 bg-white rounded-full text-sm font-medium shadow-md border border-[var(--color-border)]">
                48MP Camera
              </span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center overflow-hidden">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">📱⌚🎧</div>
                <p className="text-[var(--color-text-muted)] text-sm">
                  Hero Image Placeholder
                </p>
                <p className="text-[var(--color-text-muted)] text-xs mt-2">
                  iPhone 15 Pro • AirPods Pro • Apple Watch Ultra
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
