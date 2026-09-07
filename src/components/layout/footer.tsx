import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-dark-banner)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <span className="text-2xl font-bold">RYmos</span>
            <p className="mt-2 text-sm text-gray-400">
              Technology, Made Yours. Discover the latest smartphones and
              premium accessories.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Customer Service
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/customer/orders"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Returns
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>WhatsApp: +880 1712-345678</li>
              <li>Email: support@rymos.com</li>
              <li>Dhaka, Bangladesh</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} RYmos. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
