"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { VideoItem } from "@/types";
import { Play } from "lucide-react";

interface VideoCardProps {
  video: VideoItem;
  className?: string;
}

export function VideoCard({ video, className }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked by browser
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className={cn(
        "group relative aspect-[9/16] overflow-hidden rounded-xl bg-card cursor-pointer transition-transform duration-300 hover:scale-[1.02]",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail */}
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          isHovered ? "opacity-0" : "opacity-100"
        )}
      />

      {/* Video */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        muted
        loop
        playsInline
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Play icon overlay (visible when not hovered) */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300",
          isHovered ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Play className="h-6 w-6 text-white fill-white" />
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Title */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-sm font-medium text-white line-clamp-2">
          {video.title}
        </h3>
      </div>
    </div>
  );
}
