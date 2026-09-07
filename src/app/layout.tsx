import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
