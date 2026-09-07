"use client";

import { motion } from "framer-motion";
import { Truck, Shield, Award, Headphones } from "lucide-react";

const services = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Same-day delivery in Dhaka",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% secure transactions",
  },
  {
    icon: Award,
    title: "Quality Products",
    description: "100% authentic guaranteed",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description: "24/7 dedicated support",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function ServiceGuarantees() {
  return (
    <section className="py-12 bg-[var(--color-bg-alt)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center mb-3">
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-[var(--color-text)]">
                {service.title}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
