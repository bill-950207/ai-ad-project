/** @type {import('next').NextConfig} */
const nextConfig = {
  // 배럴 파일 임포트 최적화 (lucide-react 등)
  // 개별 아이콘만 번들에 포함되어 콜드 스타트 200-800ms 개선
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    // 이미지 캐싱 설정 (기본값: 60초, 여기서는 1시간으로 설정)
    minimumCacheTTL: 3600,
    // 디바이스 크기에 맞는 이미지 생성
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
