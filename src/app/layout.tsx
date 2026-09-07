import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import LoadingScreen from "@/components/ui/loading-screen";
import PageTransition from "@/components/ui/page-transition";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RYmos — Technology, Made Yours",
  description:
    "Discover the latest smartphones and premium accessories. Shop Samsung, iPhone, AirPods, and more with COD, pickup, and credit options.",
  keywords: [
    "smartphones",
    "mobile phones",
    "accessories",
    "Samsung",
    "iPhone",
    "AirPods",
    "Bangladesh",
    "COD",
    "buy on credit",
  ],
  openGraph: {
    title: "RYmos — Technology, Made Yours",
    description:
      "Discover the latest smartphones and premium accessories, chosen for you.",
    type: "website",
    locale: "en_BD",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LoadingScreen />
        <CartProvider>
          {/* Persistent header — does NOT re-animate on route changes */}
          <Header />
          {/* Only the main content gets page transition animations */}
          <PageTransition>{children}</PageTransition>
          {/* Persistent footer — does NOT re-animate on route changes */}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
