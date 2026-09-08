"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { ShoppingCart } from "lucide-react";

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const { addItem } = useCart();

  const featuredProducts = [
    { id: "1", name: "iPhone 15 Pro Max", price: 164999, brand: "Apple", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=85" },
    { id: "2", name: "Samsung Galaxy S24 Ultra", price: 129999, brand: "Samsung", img: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&q=85" },
    { id: "3", name: "OnePlus 12", price: 79999, brand: "OnePlus", img: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&q=85" },
    { id: "4", name: "Xiaomi 14 Ultra", price: 54999, brand: "Xiaomi", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=85" },
  ];

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      stock: 10,
      images: [product.img],
      category: "smartphones",
    });
  };

  return (
    <main className="flex-1">
      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative h-screen flex items-center justify-center bg-black overflow-hidden"
      >
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-8xl font-semibold tracking-tight text-white"
          >
            Technology,<br />Made Yours
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-6 sm:mt-8 text-xl sm:text-2xl md:text-3xl font-normal text-gray-400 max-w-2xl mx-auto"
          >
            Discover the latest smartphones and premium accessories.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-10 flex items-center justify-center gap-8"
          >
            <Link
              href="/products"
              className="text-blue-400 hover:text-blue-300 text-lg sm:text-xl font-normal transition-colors"
            >
              Shop Now →
            </Link>
            <Link
              href="/about"
              className="text-gray-400 hover:text-white text-lg sm:text-xl font-normal transition-colors"
            >
              Learn More
            </Link>
          </motion.div>
        </div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] sm:w-[600px] lg:w-[800px] h-[300px] sm:h-[400px] lg:h-[500px]"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=85)",
            backgroundSize: "contain",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
          }}
        />
      </motion.section>

      {/* Product Showcase */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 text-center mb-4">
            The latest.
          </h2>
          <p className="text-xl sm:text-2xl text-gray-500 text-center mb-16 sm:mb-24">
            Take a look at what&apos;s new.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group text-center"
              >
                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-6">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                  {product.name}
                </h3>
                <p className="text-base text-gray-500">
                  ৳{product.price.toLocaleString()}
                </p>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Product */}
      <section className="py-20 sm:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-sm font-medium text-blue-500 uppercase tracking-wider mb-3">
                Featured
              </p>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 mb-6">
                iPhone 16 Pro
              </h2>
              <p className="text-xl sm:text-2xl text-gray-500 mb-10 max-w-lg">
                The most powerful iPhone ever. A18 Pro chip. 48MP Fusion camera. Titanium design.
              </p>
              <div className="flex items-center gap-8">
                <Link
                  href="/products"
                  className="text-blue-500 hover:text-blue-600 text-lg font-normal"
                >
                  Learn more →
                </Link>
                <Link
                  href="/products"
                  className="text-blue-500 hover:text-blue-600 text-lg font-normal"
                >
                  Buy
                </Link>
              </div>
            </div>
            <div className="aspect-square bg-white rounded-3xl overflow-hidden shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=85"
                alt="iPhone 16 Pro"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Spec Highlights */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 text-center mb-16 sm:mb-24">
            Built for everything.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: "200MP Pro-grade Camera", img: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=85" },
              { title: "5000mAh All-day Battery", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=85" },
              { title: "120Hz Dynamic AMOLED", img: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=85" },
              { title: "256GB Storage", img: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=85" },
            ].map((spec, index) => (
              <motion.div
                key={spec.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative aspect-video bg-gray-50 rounded-2xl overflow-hidden group"
              >
                <img
                  src={spec.img}
                  alt={spec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-white text-lg font-medium drop-shadow-lg">{spec.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 text-center mb-16">
            What people are saying.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Rahim Ahmed", location: "Dhaka", content: "Amazing service! Got my iPhone 15 Pro Max delivered same day." },
              { name: "Fatima Rahman", location: "Chattogram", content: "Best phone shop in Bangladesh. Genuine products, fast delivery." },
              { name: "Karim Hossain", location: "Sylhet", content: "Great prices and the COD option is very convenient." },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm"
              >
                <p className="text-lg text-gray-900 leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-32 bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-6">
            Your Store.<br />In Your Pocket.
          </h2>
          <p className="text-xl sm:text-2xl text-gray-400 mb-10">
            Shop anywhere, anytime with the RYmos mobile app.
          </p>
          <div className="flex items-center justify-center gap-8">
            <a href="#" className="text-blue-400 hover:text-blue-300 text-lg font-normal">
              Download for iOS →
            </a>
            <a href="#" className="text-blue-400 hover:text-blue-300 text-lg font-normal">
              Download for Android →
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
