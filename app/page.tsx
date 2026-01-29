import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <ShowcaseSection />
      <Footer />
    </main>
  );
}
