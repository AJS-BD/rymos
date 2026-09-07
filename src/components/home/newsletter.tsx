export default function Newsletter() {
  return (
    <section className="py-8 sm:py-12 bg-[var(--color-bg-alt)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">
          Stay ahead of what's next.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[var(--color-text-muted)]">
          Subscribe to get the latest updates, offers and new arrivals.
        </p>

        <form className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-h-[48px]"
          />
          <button
            type="submit"
            className="px-5 sm:px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors min-h-[48px]"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
