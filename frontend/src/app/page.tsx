import { Navbar } from "@/components/Navbar";
import { TrustBanner } from "@/components/TrustBanner";
import { Hero } from "@/components/Hero";
import { FeaturesGrid } from "@/components/FeaturesGrid";
import { HowItWorks } from "@/components/HowItWorks";
import { AIFeatures } from "@/components/AIFeatures";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <TrustBanner />
      <main className="flex-grow flex flex-col gap-32 pb-32">
        <Hero />
        <FeaturesGrid />
        <HowItWorks />
        <AIFeatures />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
