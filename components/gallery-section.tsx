"use client";

import { VideoCard } from "@/components/ui/video-card";
import { mockVideos } from "@/lib/mock-data";

export function GallerySection() {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Featured Creations
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Explore AI-generated ad content created by our community. Hover over
            any video to preview.
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
          {mockVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </section>
  );
}