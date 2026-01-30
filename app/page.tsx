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

    // Rain용: 이미지 8개 + 영상 4개
    const images = shuffled.filter(s => s.type === 'image');
    const videos = shuffled.filter(s => s.type === 'video');

    const rainShowcases = [
      ...images.slice(0, 8),
      ...videos.slice(0, 4),
    ].sort(() => Math.random() - 0.5) as ShowcaseData[];

    // Gallery용: Rain에 사용되지 않은 나머지
    const usedIds = new Set(rainShowcases.map(s => s.id));
    const remaining = shuffled.filter(s => !usedIds.has(s.id));
    const galleryShowcases = remaining.slice(0, 20) as ShowcaseData[];

    return { rainShowcases, galleryShowcases };
  } catch (error) {
    console.error('쇼케이스 로드 오류:', error);
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
