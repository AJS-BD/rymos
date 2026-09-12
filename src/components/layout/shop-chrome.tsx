"use client";

import { usePathname } from "next/navigation";
import Header from "./header";
import Footer from "./footer";
import LoadingScreen from "../ui/loading-screen";
import { ScrollToTop } from "../ui/scroll-to-top";

export default function ShopChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <LoadingScreen />
      <ScrollToTop />
      <Header />
      {children}
      <Footer />
    </>
  );
}
