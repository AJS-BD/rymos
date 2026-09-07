"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Smartphone,
  Headphones,
  BatteryCharging,
  Shield,
  Watch,
  Battery,
} from "lucide-react";

const categories = [
  { name: "Smartphones", icon: Smartphone, slug: "smartphones" },
  { name: "Audio", icon: Headphones, slug: "audio" },
  { name: "Chargers", icon: BatteryCharging, slug: "chargers" },
  { name: "Cases & Protection", icon: Shield, slug: "cases" },
  { name: "Wearables", icon: Watch, slug: "wearables" },
  { name: "Power Banks", icon: Battery, slug: "power-banks" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function CategoryStrip() {
  return (
    <section className="py-8 border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-3 sm:grid-cols-6 gap-4"
        >
          {categories.map((category) => (
            <motion.div key={category.slug} variants={itemVariants}>
              <Link
                href={`/products?category=${category.slug}`}
                className="flex flex-col items-center p-4 rounded-lg hover:bg-[var(--color-bg-alt)] transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-alt)] group-hover:bg-[var(--color-primary)] flex items-center justify-center transition-colors">
                  <category.icon className="h-6 w-6 text-[var(--color-text)] group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-[var(--color-text)] text-center mt-2">
                  {category.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
