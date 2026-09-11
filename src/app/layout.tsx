import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import LoadingScreen from "@/components/ui/loading-screen";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

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

import { headers } from "next/headers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LoadingScreen />
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            {!isAdmin && <Header />}
            {children}
            {!isAdmin && <Footer />}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
