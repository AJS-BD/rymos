"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 10,
  },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      mass: 0.8,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: {
      duration: 0.3,
      ease: "easeInOut" as const,
    },
  },
};

export default function PageTransitionWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
