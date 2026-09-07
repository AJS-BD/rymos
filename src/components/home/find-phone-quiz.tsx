"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Gamepad2, Camera, Battery, Cpu, Wallet } from "lucide-react";

const steps = [
  { icon: Gamepad2, label: "Usage" },
  { icon: Camera, label: "Camera" },
  { icon: Battery, label: "Battery" },
  { icon: Cpu, label: "Processor" },
  { icon: Wallet, label: "Budget" },
];

export default function FindPhoneQuiz() {
  return (
    <section className="py-8 sm:py-12 bg-[var(--color-bg-alt)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
            Find Your Perfect Phone
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[var(--color-text-muted)]">
            Answer a few simple questions and we'll recommend the best phone for you.
          </p>
        </motion.div>

        <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer"
              >
                <step.icon className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-primary)]" />
              </motion.div>
              {index < steps.length - 1 && (
                <span className="text-[var(--color-text-muted)] hidden sm:block">
                  →
                </span>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center mt-6 sm:mt-8 px-6 sm:px-8 py-2.5 sm:py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors gap-2 text-sm sm:text-base"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            Get Started
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
