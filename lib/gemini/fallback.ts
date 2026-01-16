/**
 * Gemini API Fallback 전략
 *
 * Gemini API 호출 실패 시 대체 전략을 제공합니다.
 * - 재시도 로직
 * - Fallback 프롬프트 사용
 * - 에러 로깅 및 모니터링
 */

import { FALLBACK_PROMPTS, PROMPTS } from '@/lib/prompts'

// ============================================================
// 타입 정의
// ============================================================

/** API 호출 결과 */
export interface GeminiCallResult<T> {
  success: boolean
  data?: T
  usedFallback: boolean
  error?: string
  retryCount?: number
}

/** Fallback 옵션 */
export interface FallbackOptions {
  maxRetries?: number
  retryDelayMs?: number
  enableFallback?: boolean
  logErrors?: boolean
}

const DEFAULT_OPTIONS: FallbackOptions = {
  maxRetries: 2,
  retryDelayMs: 1000,
  enableFallback: true,
  logErrors: true,
}

// ============================================================
// 재시도 유틸리티
// ============================================================

/** 지정된 시간만큼 대기 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 에러 로깅 */
function logError(context: string, error: unknown, retryCount: number): void {
  console.error(`[Gemini Fallback] ${context} 실패 (시도 ${retryCount}):`, error)

  // TODO: 프로덕션에서는 에러 모니터링 서비스로 전송
  // await sendToMonitoring({ context, error, retryCount })
}

// ============================================================
// 재시도 래퍼
// ============================================================

/**
 * Gemini API 호출을 재시도 로직과 함께 실행합니다.
 *
 * @param fn - 실행할 함수
 * @param context - 에러 로깅용 컨텍스트 이름
 * @param options - Fallback 옵션
 * @returns 실행 결과
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  options: FallbackOptions = {}
): Promise<GeminiCallResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 1; attempt <= (opts.maxRetries! + 1); attempt++) {
    try {
      const data = await fn()
      return {
        success: true,
        data,
        usedFallback: false,
        retryCount: attempt - 1,
      }
    } catch (error) {
      lastError = error

      if (opts.logErrors) {
        logError(context, error, attempt)
      }

      // 마지막 시도가 아니면 재시도
      if (attempt <= opts.maxRetries!) {
        await sleep(opts.retryDelayMs! * attempt) // 점진적 대기
      }
    }
  }

  return {
    success: false,
    usedFallback: false,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    retryCount: opts.maxRetries,
  }
}

/**
 * Gemini API 호출을 재시도 및 Fallback과 함께 실행합니다.
 *
 * @param fn - 실행할 함수
 * @param fallbackFn - Fallback 시 실행할 함수
 * @param context - 에러 로깅용 컨텍스트 이름
 * @param options - Fallback 옵션
 * @returns 실행 결과
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallbackFn: () => T,
  context: string,
  options: FallbackOptions = {}
): Promise<GeminiCallResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 먼저 재시도 로직 실행
  const result = await withRetry(fn, context, opts)

  if (result.success) {
    return result
  }

  // 재시도 실패 시 Fallback 사용
  if (opts.enableFallback) {
    try {
      const fallbackData = fallbackFn()
      console.warn(`[Gemini Fallback] ${context}: Fallback 사용`)

      return {
        success: true,
        data: fallbackData,
        usedFallback: true,
        error: result.error,
        retryCount: result.retryCount,
      }
    } catch (fallbackError) {
      console.error(`[Gemini Fallback] ${context}: Fallback도 실패`, fallbackError)
    }
  }

  return result
}

// ============================================================
// 특정 기능별 Fallback 함수
// ============================================================

/** 이미지 광고 프롬프트 Fallback */
export function getImageAdFallbackPrompt(adType: string): {
  optimizedPrompt: string
  koreanDescription: string
} {
  const fallback = FALLBACK_PROMPTS.imageAd[adType as keyof typeof FALLBACK_PROMPTS.imageAd]
    || FALLBACK_PROMPTS.imageAd.holding

  return {
    optimizedPrompt: fallback,
    koreanDescription: '기본 광고 이미지가 생성됩니다.',
  }
}

/** 첫 프레임 프롬프트 Fallback */
export function getFirstFrameFallbackPrompt(): {
  prompt: string
  locationDescription: string
} {
  return {
    prompt: FALLBACK_PROMPTS.firstFrame,
    locationDescription: '기본 실내 환경',
  }
}

/** 대본 생성 Fallback */
export function getScriptFallbackResult(productInfo: string, durationSeconds: number): {
  productSummary: string
  scripts: Array<{
    style: string
    styleName: string
    content: string
    estimatedDuration: number
  }>
} {
  const productName = productInfo.split('\n')[0]?.replace('제품명:', '').trim() || '제품'

  return {
    productSummary: `${productName}을(를) 소개합니다.`,
    scripts: [
      {
        style: 'formal',
        styleName: '공식적',
        content: `안녕하세요. 오늘은 ${productName}을 소개해 드리겠습니다. 이 제품은 뛰어난 품질과 효과를 자랑합니다. 지금 바로 경험해 보세요.`,
        estimatedDuration: Math.round(durationSeconds * 0.9),
      },
      {
        style: 'casual',
        styleName: '캐주얼',
        content: `여러분, ${productName} 써보셨나요? 저도 처음엔 반신반의했는데, 진짜 좋더라고요. 한번 써보시면 알아요!`,
        estimatedDuration: Math.round(durationSeconds * 0.9),
      },
      {
        style: 'energetic',
        styleName: '활기찬',
        content: `와! ${productName} 진짜 대박이에요! 이거 쓰고 나서 완전 달라졌어요! 여러분도 지금 바로 경험해 보세요!`,
        estimatedDuration: Math.round(durationSeconds * 0.9),
      },
    ],
  }
}

/** 배경 프롬프트 Fallback */
export function getBackgroundFallbackPrompt(): {
  optimizedPrompt: string
  koreanDescription: string
} {
  return {
    optimizedPrompt: FALLBACK_PROMPTS.background,
    koreanDescription: '기본 배경이 생성됩니다.',
  }
}

/** 참조 스타일 분석 Fallback */
export function getReferenceAnalysisFallback(): {
  analyzedOptions: Array<{
    key: string
    type: 'preset' | 'custom'
    value: string
    confidence: number
  }>
  overallStyle: string
  suggestedPrompt: string
} {
  return {
    analyzedOptions: [],
    overallStyle: '분석을 완료하지 못했습니다. 옵션을 직접 선택해주세요.',
    suggestedPrompt: '',
  }
}

// ============================================================
// 에러 타입 분류
// ============================================================

/** Gemini API 에러 타입 */
export type GeminiErrorType =
  | 'RATE_LIMIT'      // 요청 한도 초과
  | 'QUOTA_EXCEEDED'  // 할당량 초과
  | 'INVALID_API_KEY' // API 키 오류
  | 'MODEL_ERROR'     // 모델 오류
  | 'NETWORK_ERROR'   // 네트워크 오류
  | 'PARSE_ERROR'     // 응답 파싱 오류
  | 'UNKNOWN'         // 알 수 없는 오류

/** 에러 타입 분류 */
export function classifyError(error: unknown): GeminiErrorType {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  if (message.includes('rate limit') || message.includes('429')) {
    return 'RATE_LIMIT'
  }
  if (message.includes('quota') || message.includes('exceeded')) {
    return 'QUOTA_EXCEEDED'
  }
  if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
    return 'INVALID_API_KEY'
  }
  if (message.includes('model') || message.includes('500')) {
    return 'MODEL_ERROR'
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return 'NETWORK_ERROR'
  }
  if (message.includes('json') || message.includes('parse')) {
    return 'PARSE_ERROR'
  }

  return 'UNKNOWN'
}

/** 에러 타입별 재시도 가능 여부 */
export function isRetryableError(errorType: GeminiErrorType): boolean {
  switch (errorType) {
    case 'RATE_LIMIT':
    case 'MODEL_ERROR':
    case 'NETWORK_ERROR':
      return true
    case 'QUOTA_EXCEEDED':
    case 'INVALID_API_KEY':
    case 'PARSE_ERROR':
    case 'UNKNOWN':
      return false
  }
}
