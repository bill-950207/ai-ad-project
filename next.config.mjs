/** @type {import('next').NextConfig} */
const nextConfig = {
  // FFmpeg 관련 패키지를 서버 외부 패키지로 설정 (webpack 번들링 제외)
  serverExternalPackages: [
    '@ffmpeg-installer/ffmpeg',
    '@ffmpeg-installer/darwin-arm64',
    '@ffmpeg-installer/darwin-x64',
    '@ffmpeg-installer/linux-x64',
    '@ffmpeg-installer/win32-x64',
    'fluent-ffmpeg',
  ],
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
