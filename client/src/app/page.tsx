import { DriverCta } from "@/components/landing/driver-cta";
import { FaqSection } from "@/components/landing/faq-section";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { FinalCta } from "@/components/landing/final-cta";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LiveStats } from "@/components/landing/live-stats";
import { Testimonials } from "@/components/landing/testimonials";
import { VehicleTypes } from "@/components/landing/vehicle-types";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <LiveStats />
      <HowItWorks />
      <VehicleTypes />
      <FeaturesGrid />
      <DriverCta />
      <Testimonials />
      <FaqSection />
      <FinalCta />
    </main>
  );
}
