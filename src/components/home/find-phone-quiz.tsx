import Link from "next/link";

const steps = [
  { icon: "🎮", label: "Usage" },
  { icon: "📷", label: "Camera" },
  { icon: "🔋", label: "Battery" },
  { icon: "⚡", label: "Processor" },
  { icon: "💰", label: "Budget" },
];

export default function FindPhoneQuiz() {
  return (
    <section className="py-12 bg-[var(--color-bg-alt)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">
          Find Your Perfect Phone
        </h2>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Answer a few simple questions and we'll recommend the best phone for
          you.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-2xl">
                {step.icon}
              </div>
              {index < steps.length - 1 && (
                <span className="text-[var(--color-text-muted)] hidden sm:block">
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        <Link
          href="/quiz"
          className="inline-flex items-center justify-center mt-8 px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}
