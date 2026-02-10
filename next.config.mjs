import { withSentryConfig } from "@sentry/nextjs";

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
    // Vercel Image Optimization 비활성화 (사용량 한도 초과로 402 발생)
    unoptimized: true,
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry 옵션
  silent: true, // 빌드 시 로그 숨김
  org: undefined, // Sentry org (소스맵 업로드 시 필요)
  project: undefined, // Sentry project (소스맵 업로드 시 필요)

  // 소스맵 업로드 비활성화 (필요 시 활성화)
  sourcemaps: {
    disable: true,
  },

  // 빌드 시 Sentry 릴리즈 자동 생성 비활성화
  release: {
    create: false,
  },
});
