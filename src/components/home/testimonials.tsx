import StarRating from "@/components/shared/star-rating";

const testimonials = [
  {
    id: 1,
    name: "Rahim Ahmed",
    location: "Dhaka",
    rating: 5,
    content:
      "Amazing service! Got my iPhone 15 Pro Max delivered same day. The credit option made it so much easier to buy.",
    verified: true,
  },
  {
    id: 2,
    name: "Fatima Rahman",
    location: "Chattogram",
    rating: 5,
    content:
      "Best phone shop in Bangladesh. Genuine products, fast delivery, and excellent customer support.",
    verified: true,
  },
  {
    id: 3,
    name: "Karim Hossain",
    location: "Sylhet",
    rating: 4,
    content:
      "Great prices and the COD option is very convenient. Will definitely shop again!",
    verified: true,
  },
];

export default function Testimonials() {
  return (
    <section className="py-12 bg-[var(--color-bg-alt)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8 text-center">
          What Our Customers Say
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white p-6 rounded-lg shadow-sm"
            >
              <StarRating rating={testimonial.rating} />
              <p className="mt-4 text-[var(--color-text)] text-sm leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[var(--color-text)]">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {testimonial.location}
                  </p>
                </div>
                {testimonial.verified && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified Purchase
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
