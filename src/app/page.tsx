import Header from "@/components/layout/header";
import HeroBanner from "@/components/home/hero-banner";
import CategoryStrip from "@/components/home/category-strip";
import FeaturedProducts from "@/components/home/featured-products";
import FindPhoneQuiz from "@/components/home/find-phone-quiz";
import SpecBanner from "@/components/home/spec-banner";
import BestSellers from "@/components/home/best-sellers";
import AccessoriesDeals from "@/components/home/accessories-deals";
import ServiceGuarantees from "@/components/home/service-guarantees";
import NewArrivals from "@/components/home/new-arrivals";
import Testimonials from "@/components/home/testimonials";
import AppDownload from "@/components/home/app-download";
import Newsletter from "@/components/home/newsletter";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <CategoryStrip />
        <FeaturedProducts />
        <FindPhoneQuiz />
        <SpecBanner />
        <BestSellers />
        <AccessoriesDeals />
        <ServiceGuarantees />
        <NewArrivals />
        <Testimonials />
        <AppDownload />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
