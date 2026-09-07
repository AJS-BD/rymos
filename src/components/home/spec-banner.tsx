import Link from "next/link";
import { Camera, Battery, Monitor, HardDrive } from "lucide-react";

export default function SpecBanner() {
  return (
    <section className="py-16 bg-[var(--color-dark-banner)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold">Built for everything</h2>
            <p className="mt-2 text-gray-400">Power that keeps up with your day.</p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/10 rounded-lg">
                <Camera className="h-6 w-6 mb-2 text-white" />
                <div className="text-sm text-gray-400">Camera</div>
                <div className="font-bold">500MP Pro-grade</div>
              </div>
              <div className="p-4 bg-white/10 rounded-lg">
                <Battery className="h-6 w-6 mb-2 text-white" />
                <div className="text-sm text-gray-400">Battery</div>
                <div className="font-bold">5000mAh All-day</div>
              </div>
              <div className="p-4 bg-white/10 rounded-lg">
                <Monitor className="h-6 w-6 mb-2 text-white" />
                <div className="text-sm text-gray-400">Display</div>
                <div className="font-bold">120Hz Dynamic AMOLED</div>
              </div>
              <div className="p-4 bg-white/10 rounded-lg">
                <HardDrive className="h-6 w-6 mb-2 text-white" />
                <div className="text-sm text-gray-400">Storage</div>
                <div className="font-bold">256GB</div>
              </div>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center justify-center mt-8 px-8 py-3 bg-white text-[var(--color-primary)] rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Explore Now
            </Link>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl flex items-center justify-center overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80"
                alt="Phone camera module"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
