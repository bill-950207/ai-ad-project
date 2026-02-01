import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import { Footer } from "@/components/landing/footer";
import { prisma } from "@/lib/db";

// 쇼케이스 데이터 타입
export interface ShowcaseData {
  id: string;
  type: 'image' | 'video';
  thumbnail_url: string;
  media_url: string | null;
  title: string;
  description: string | null;
  ad_type: string | null;
  category: string | null;
  product_image_url: string | null;
  avatar_image_url: string | null;
}

// 서버에서 쇼케이스 데이터 로드 (1회 DB 호출로 통합)
async function getShowcases(): Promise<{
  rainShowcases: ShowcaseData[];
  galleryShowcases: ShowcaseData[];
}> {
  try {
    // 한 번의 쿼리로 충분한 데이터 가져오기
    const showcases = await prisma.ad_showcases.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
      take: 50, // Rain 12 + Gallery 20 + 여유분
      select: {
        id: true,
        type: true,
        thumbnail_url: true,
        media_url: true,
        title: true,
        description: true,
        ad_type: true,
        category: true,
        product_image_url: true,
        avatar_image_url: true,
      },
    });

    // 셔플
    const shuffled = showcases.sort(() => Math.random() - 0.5);

    // 이미지/영상 분리
    const images = shuffled.filter(s => s.type === 'image');
    const videos = shuffled.filter(s => s.type === 'video');

    // Rain용: 이미지 10개 + 영상 2개 = 12개 (4열 × 3개)
    // 영상은 썸네일로만 표시되므로 메모리 부담 없음
    const rainImages = images.slice(0, 10) as ShowcaseData[];
    const rainVideos = videos.slice(0, 2) as ShowcaseData[];
    const rainShowcases = [...rainImages, ...rainVideos].sort(() => Math.random() - 0.5);

    // Gallery용: 전체 데이터 사용 (Rain과 중복 허용)
    // 인터리브 배치 (영상 먼저, 많이 표시)
    const galleryShowcases: ShowcaseData[] = [];
    const maxLen = Math.max(images.length, videos.length);
    for (let i = 0; i < maxLen; i++) {
      if (videos[i]) galleryShowcases.push(videos[i] as ShowcaseData);
      if (images[i]) galleryShowcases.push(images[i] as ShowcaseData);
    }

    return { rainShowcases, galleryShowcases };
  } catch (error) {
    console.error('Failed to load showcases:', error);
    return { rainShowcases: [], galleryShowcases: [] };
  }
}

export default async function Home() {
  const { rainShowcases, galleryShowcases } = await getShowcases();

  return (
    <main className="min-h-screen">
      <HeroSection rainShowcases={rainShowcases} />
      <FeaturesSection />
      <WorkflowSection />
      <ShowcaseSection initialShowcases={galleryShowcases} />
      <Footer />
    </main>
  );
}
