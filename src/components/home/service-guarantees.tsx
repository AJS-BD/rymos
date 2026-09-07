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

export default function ServiceGuarantees() {
  return (
    <section className="py-12 bg-[var(--color-bg-alt)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="flex flex-col items-center text-center p-6 bg-white rounded-lg"
            >
              <service.icon className="h-10 w-10 text-[var(--color-primary)] mb-3" />
              <h3 className="font-semibold text-[var(--color-text)]">
                {service.title}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
