import type { Metadata } from "next";
import ContactContent from "./contact-content";

export const metadata: Metadata = {
  title: "Contact Us — RYmos",
  description:
    "Get in touch with RYmos. Visit our store in Dhaka, call us, email us, or send a message through our contact form. We're here to help.",
  openGraph: {
    title: "Contact Us — RYmos",
    description:
      "Get in touch with RYmos. Visit our store, call, email, or send us a message. We're here to help.",
    type: "website",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
