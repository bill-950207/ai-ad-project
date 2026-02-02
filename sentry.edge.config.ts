import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링 샘플링 비율
  tracesSampleRate: 0.1,

  // 개발 환경에서는 비활성화
  enabled: process.env.NODE_ENV === "production",

  // 디버그 모드
  debug: false,
});
