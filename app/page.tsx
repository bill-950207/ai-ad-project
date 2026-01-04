import { HeroSection } from "@/components/hero-section";
import { GallerySection } from "@/components/gallery-section";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <GallerySection />
    </main>
  );
}
