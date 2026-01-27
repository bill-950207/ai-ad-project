/**
 * Rate Limiting 유틸리티
 *
 * API 남용 방지를 위한 간단한 in-memory rate limiter
 * 프로덕션에서는 Redis 기반 (@upstash/ratelimit) 사용 권장
 */

// Rate limit 설정 타입
interface RateLimitConfig {
  interval: number  // 시간 윈도우 (밀리초)
  maxRequests: number  // 최대 요청 수
}

// 요청 기록 타입
interface RequestRecord {
  count: number
  resetTime: number
}

// In-memory 저장소
const requestStore = new Map<string, RequestRecord>()

// 오래된 기록 정리 (메모리 누수 방지)
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []

  requestStore.forEach((record, key) => {
    if (record.resetTime < now) {
      keysToDelete.push(key)
    }
  })

  keysToDelete.forEach(key => requestStore.delete(key))
}, 60000) // 1분마다 정리

// Node.js 프로세스 종료 시 정리
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    clearInterval(cleanupInterval)
  })
}

/**
 * Rate limit 체크
 *
 * @param identifier - 사용자 식별자 (user_id, IP 등)
 * @param config - Rate limit 설정
 * @returns { success: boolean, remaining: number, reset: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const record = requestStore.get(identifier)

  // 기존 기록이 없거나 만료된 경우
  if (!record || record.resetTime < now) {
    requestStore.set(identifier, {
      count: 1,
      resetTime: now + config.interval,
    })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      reset: now + config.interval,
    }
  }

  // 요청 수 초과
  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      reset: record.resetTime,
    }
  }

  // 요청 허용
  record.count++
  return {
    success: true,
    remaining: config.maxRequests - record.count,
    reset: record.resetTime,
  }
}

/**
 * 미리 정의된 Rate Limit 설정
 */
export const RateLimits = {
  // API 일반: 분당 60회
  standard: {
    interval: 60 * 1000,
    maxRequests: 60,
  },

  // AI 생성 API: 분당 10회
  aiGeneration: {
    interval: 60 * 1000,
    maxRequests: 10,
  },

  // 크레딧 소모 작업: 시간당 50회
  creditConsuming: {
    interval: 60 * 60 * 1000,
    maxRequests: 50,
  },

  // 인증 시도: 15분당 5회
  auth: {
    interval: 15 * 60 * 1000,
    maxRequests: 5,
  },

  // 파일 업로드: 분당 20회
  upload: {
    interval: 60 * 1000,
    maxRequests: 20,
  },
} as const

/**
 * Rate limit 헤더 생성
 */
export function getRateLimitHeaders(result: {
  remaining: number
  reset: number
}): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

/**
 * Rate limit 초과 응답 생성
 */
export function rateLimitExceededResponse(reset: number) {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
      },
    }
  )
}

/**
 * Rate limit 미들웨어 헬퍼
 *
 * API 라우트에서 사용:
 * ```typescript
 * const rateLimitResult = await applyRateLimit(request, user.id, RateLimits.aiGeneration)
 * if (!rateLimitResult.success) {
 *   return rateLimitExceededResponse(rateLimitResult.reset)
 * }
 * ```
 */
export function applyRateLimit(
  identifier: string,
  config: RateLimitConfig
) {
  return checkRateLimit(identifier, config)
}
