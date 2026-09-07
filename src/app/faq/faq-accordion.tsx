"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Question {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  questions: Question[];
}

export default function FaqAccordion({ questions }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {questions.map((item, index) => (
        <div
          key={index}
          className="border border-[var(--color-border)] rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggle(index)}
            className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-[var(--color-bg-alt)] transition-colors"
            aria-expanded={openIndex === index}
          >
            <span className="font-medium text-[var(--color-text)] pr-4">
              {item.q}
            </span>
            <ChevronDown
              className={`h-5 w-5 text-[var(--color-text-muted)] flex-shrink-0 transition-transform duration-200 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              openIndex === index ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="px-5 pb-4 text-[var(--color-text-muted)] text-sm leading-relaxed">
              {item.a}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
