import Link from "next/link";

export default function AccessoriesDeals() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Accessories Collection */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 min-h-[250px]">
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-[var(--color-text)]">
                Accessories Collection
              </h3>
              <p className="mt-2 text-[var(--color-text-muted)] text-sm">
                Complete Your Setup
              </p>
              <Link
                href="/products?category=accessories"
                className="inline-flex items-center justify-center mt-6 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Shop Collection
              </Link>
            </div>
            <div className="absolute bottom-0 right-0 text-8xl opacity-20">
              🎧
            </div>
          </div>

          {/* RYMOS Deals */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-red-100 p-8 min-h-[250px]">
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-[var(--color-text)]">
                RYMOS Deals
              </h3>
              <p className="mt-2 text-[var(--color-accent)] font-bold text-lg">
                Up to 30% OFF selected products
              </p>

              {/* Countdown Timer */}
              <div className="flex gap-2 mt-4">
                {[
                  { value: "02", label: "Days" },
                  { value: "14", label: "Hours" },
                  { value: "56", label: "Mins" },
                  { value: "28", label: "Secs" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="w-14 h-14 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm"
                  >
                    <span className="text-lg font-bold text-[var(--color-text)]">
                      {item.value}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/products?deals=true"
                className="inline-flex items-center justify-center mt-6 px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Shop Deals
              </Link>
            </div>
            <div className="absolute bottom-0 right-0 text-8xl opacity-20">
              📱
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
