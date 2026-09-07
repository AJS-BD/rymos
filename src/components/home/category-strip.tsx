import Link from "next/link";

const categories = [
  { name: "Smartphones", icon: "📱", slug: "smartphones" },
  { name: "Audio", icon: "🎧", slug: "audio" },
  { name: "Chargers", icon: "🔌", slug: "chargers" },
  { name: "Cases & Protection", icon: "🛡️", slug: "cases" },
  { name: "Wearables", icon: "⌚", slug: "wearables" },
  { name: "Power Banks", icon: "🔋", slug: "power-banks" },
];

export default function CategoryStrip() {
  return (
    <section className="py-8 border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-[var(--color-bg-alt)] transition-colors group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {category.icon}
              </span>
              <span className="text-sm font-medium text-[var(--color-text)] text-center">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
