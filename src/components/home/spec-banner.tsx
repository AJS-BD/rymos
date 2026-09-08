import Link from "next/link";
import { Camera, Battery, Monitor, HardDrive } from "lucide-react";

export default function SpecBanner() {
  return (
    <section className="py-12 sm:py-16 bg-[var(--color-dark-banner)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Built for everything</h2>
            <p className="mt-2 text-gray-400 text-sm sm:text-base">Power that keeps up with your day.</p>

            <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-white/10 rounded-lg">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 mb-2 text-white" />
                <div className="text-xs sm:text-sm text-gray-400">Camera</div>
                <div className="font-bold text-sm sm:text-base">200MP Pro-grade</div>
              </div>
              <div className="p-3 sm:p-4 bg-white/10 rounded-lg">
                <Battery className="h-5 w-5 sm:h-6 sm:w-6 mb-2 text-white" />
                <div className="text-xs sm:text-sm text-gray-400">Battery</div>
                <div className="font-bold text-sm sm:text-base">5000mAh All-day</div>
              </div>
              <div className="p-3 sm:p-4 bg-white/10 rounded-lg">
                <Monitor className="h-5 w-5 sm:h-6 sm:w-6 mb-2 text-white" />
                <div className="text-xs sm:text-sm text-gray-400">Display</div>
                <div className="font-bold text-sm sm:text-base">120Hz Dynamic AMOLED</div>
              </div>
              <div className="p-3 sm:p-4 bg-white/10 rounded-lg">
                <HardDrive className="h-5 w-5 sm:h-6 sm:w-6 mb-2 text-white" />
                <div className="text-xs sm:text-sm text-gray-400">Storage</div>
                <div className="font-bold text-sm sm:text-base">256GB</div>
              </div>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center justify-center mt-6 sm:mt-8 px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-[var(--color-primary)] rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base min-h-[44px]"
            >
              Explore Now
            </Link>
          </div>

          {/* Image */}
          <div className="relative order-first lg:order-last">
            <div className="relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden">
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
