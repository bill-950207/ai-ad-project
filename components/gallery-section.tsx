/**
 * 갤러리 섹션 컴포넌트
 *
 * 랜딩 페이지의 갤러리 섹션을 담당합니다.
 * - AI 생성 광고 콘텐츠 갤러리 표시
 * - 비디오 카드 그리드 레이아웃
 * - 호버 시 비디오 미리보기 지원
 */

"use client";

import { VideoCard } from "@/components/ui/video-card";
import { mockVideos } from "@/lib/mock-data";
import { useLanguage } from "@/contexts/language-context";

// ============================================================
// 컴포넌트
// ============================================================

export function GallerySection() {
  const { t } = useLanguage();

  return (
    <section id="gallery" className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        {/* 섹션 헤더 */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t.landing.galleryTitle}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t.landing.gallerySubtitle}
          </p>
        </div>

        {/* 비디오 그리드 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
          {mockVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </section>
  );
}
