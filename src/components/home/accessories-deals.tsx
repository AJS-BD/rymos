import Link from "next/link";
import { Headphones, Clock } from "lucide-react";

export default function AccessoriesDeals() {
  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Accessories Collection */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl min-h-[200px] sm:min-h-[250px]">
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"
              alt="Accessories"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
            <div className="relative z-10 p-5 sm:p-8 h-full flex flex-col justify-center">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Accessories Collection
              </h3>
              <p className="mt-1 sm:mt-2 text-gray-300 text-xs sm:text-sm">
                Complete Your Setup
              </p>
              <Link
                href="/products?category=accessories"
                className="inline-flex items-center justify-center mt-4 sm:mt-6 px-4 sm:px-6 py-2.5 bg-white text-black rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors w-full sm:w-fit min-h-[44px]"
              >
                Shop Collection
              </Link>
            </div>
          </div>

          {/* RYMOS Deals */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl min-h-[200px] sm:min-h-[250px]">
            <img
              src="https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&q=80"
              alt="Phone deals"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/70 to-red-700/30" />
            <div className="relative z-10 p-5 sm:p-8 h-full flex flex-col justify-center">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                RYMOS Deals
              </h3>
              <p className="mt-1 sm:mt-2 text-red-300 font-bold text-sm sm:text-lg">
                Up to 30% OFF selected products
              </p>

              {/* Countdown Timer */}
              <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                {[
                  { value: "02", label: "Days" },
                  { value: "14", label: "Hours" },
                  { value: "56", label: "Mins" },
                  { value: "28", label: "Secs" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="w-11 h-11 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center"
                  >
                    <span className="text-sm sm:text-lg font-bold text-white">
                      {item.value}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-300">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/products?deals=true"
                className="inline-flex items-center justify-center mt-4 sm:mt-6 px-4 sm:px-6 py-2.5 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors w-full sm:w-fit gap-2 min-h-[44px]"
              >
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                Shop Deals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
