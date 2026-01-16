/**
 * 통합 TTS 서비스
 *
 * ElevenLabs와 Minimax(WaveSpeed) TTS 서비스를 통합하여
 * 자동 Fallback과 에러 처리를 제공합니다.
 *
 * 사용 예시:
 * ```typescript
 * import { UnifiedTTSService } from '@/lib/tts/unified-service'
 *
 * const tts = new UnifiedTTSService()
 * const result = await tts.generateSpeech({
 *   text: '안녕하세요',
 *   voiceId: 'Korean_SweetGirl',
 *   language: 'ko',
 * })
 * ```
 */

import { textToSpeech as minimaxTTS } from '@/lib/wavespeed/client'
import { textToSpeech as elevenLabsTTS } from '@/lib/elevenlabs/client'

// ============================================================
// 타입 정의
// ============================================================

/** TTS 서비스 제공자 */
export type TTSProvider = 'minimax' | 'elevenlabs'

/** 음성 언어 */
export type TTSLanguage = 'ko' | 'en' | 'ja' | 'zh'

/** TTS 요청 입력 */
export interface TTSRequest {
  text: string
  voiceId: string
  language?: TTSLanguage
  preferredProvider?: TTSProvider
}

/** TTS 결과 */
export interface TTSResult {
  success: boolean
  audioBuffer?: Buffer
  audioUrl?: string
  contentType: string
  provider: TTSProvider
  usedFallback: boolean
  error?: string
}

/** 서비스 설정 */
export interface TTSServiceConfig {
  enableFallback: boolean
  maxRetries: number
  retryDelayMs: number
  defaultProvider: TTSProvider
}

// ============================================================
// 상수 및 설정
// ============================================================

/** 기본 설정 */
const DEFAULT_CONFIG: TTSServiceConfig = {
  enableFallback: true,
  maxRetries: 2,
  retryDelayMs: 1000,
  defaultProvider: 'minimax',
}

/** Minimax 음성 ID 패턴 */
const MINIMAX_VOICE_PATTERNS = [
  'Korean_',
  'English_',
  'Japanese_',
  'Chinese_',
]

/** 언어별 기본 Fallback 음성 */
const FALLBACK_VOICES: Record<TTSLanguage, {
  minimax: string
  elevenlabs: string
}> = {
  ko: {
    minimax: 'Korean_SweetGirl',
    elevenlabs: 'pNInz6obpgDQGcFmaJgB', // Rachel
  },
  en: {
    minimax: 'English_radiant_girl',
    elevenlabs: '21m00Tcm4TlvDq8ikWAM', // Rachel
  },
  ja: {
    minimax: 'Japanese_Whisper_Belle',
    elevenlabs: 'XB0fDUnXU5powFXDhCwa', // Charlotte
  },
  zh: {
    minimax: 'Chinese (Mandarin)_Sweet_Lady',
    elevenlabs: 'XB0fDUnXU5powFXDhCwa', // Charlotte
  },
}

// ============================================================
// 유틸리티 함수
// ============================================================

/** 음성 ID로 제공자 판단 */
function detectProvider(voiceId: string): TTSProvider {
  if (MINIMAX_VOICE_PATTERNS.some(pattern => voiceId.startsWith(pattern))) {
    return 'minimax'
  }
  return 'elevenlabs'
}

/** 언어 자동 감지 */
function detectLanguage(text: string): TTSLanguage {
  // 간단한 문자 범위 기반 감지
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF]/
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/
  const chineseRegex = /[\u4E00-\u9FFF]/

  if (koreanRegex.test(text)) return 'ko'
  if (japaneseRegex.test(text)) return 'ja'
  if (chineseRegex.test(text)) return 'zh'
  return 'en'
}

/** 대기 함수 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** URL에서 오디오 다운로드 */
async function downloadAudio(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`오디오 다운로드 실패: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ============================================================
// 통합 TTS 서비스 클래스
// ============================================================

export class UnifiedTTSService {
  private config: TTSServiceConfig

  constructor(config: Partial<TTSServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 음성 생성
   */
  async generateSpeech(request: TTSRequest): Promise<TTSResult> {
    const { text, voiceId, language, preferredProvider } = request

    // 제공자 및 언어 결정
    const provider = preferredProvider || detectProvider(voiceId)
    const detectedLanguage = language || detectLanguage(text)

    // 1차 시도
    const primaryResult = await this.tryProvider(provider, text, voiceId)

    if (primaryResult.success) {
      return primaryResult
    }

    // Fallback 비활성화면 실패 반환
    if (!this.config.enableFallback) {
      return primaryResult
    }

    // 2차 시도 (Fallback 제공자)
    console.warn(`[TTS] ${provider} 실패, Fallback 시도...`)
    const fallbackProvider: TTSProvider = provider === 'minimax' ? 'elevenlabs' : 'minimax'
    const fallbackVoiceId = FALLBACK_VOICES[detectedLanguage][fallbackProvider]

    const fallbackResult = await this.tryProvider(
      fallbackProvider,
      text,
      fallbackVoiceId
    )

    if (fallbackResult.success) {
      return {
        ...fallbackResult,
        usedFallback: true,
        error: primaryResult.error,
      }
    }

    // 모든 시도 실패
    return {
      success: false,
      contentType: 'audio/mpeg',
      provider,
      usedFallback: true,
      error: `모든 TTS 서비스 실패: Primary(${provider}): ${primaryResult.error}, Fallback(${fallbackProvider}): ${fallbackResult.error}`,
    }
  }

  /**
   * 특정 제공자로 음성 생성 시도
   */
  private async tryProvider(
    provider: TTSProvider,
    text: string,
    voiceId: string
  ): Promise<TTSResult> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (provider === 'minimax') {
          return await this.generateWithMinimax(text, voiceId)
        } else {
          return await this.generateWithElevenLabs(text, voiceId)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`[TTS] ${provider} 시도 ${attempt} 실패:`, errorMessage)

        if (attempt < this.config.maxRetries) {
          await sleep(this.config.retryDelayMs * attempt)
        } else {
          return {
            success: false,
            contentType: 'audio/mpeg',
            provider,
            usedFallback: false,
            error: errorMessage,
          }
        }
      }
    }

    // 모든 재시도 실패 (이 코드에 도달하지 않지만 타입 안전성을 위해)
    return {
      success: false,
      contentType: 'audio/mpeg',
      provider,
      usedFallback: false,
      error: 'Max retries exceeded',
    }
  }

  /**
   * Minimax TTS 생성
   */
  private async generateWithMinimax(text: string, voiceId: string): Promise<TTSResult> {
    const audioUrl = await minimaxTTS(text, voiceId)
    const audioBuffer = await downloadAudio(audioUrl)

    return {
      success: true,
      audioBuffer,
      audioUrl,
      contentType: 'audio/mpeg',
      provider: 'minimax',
      usedFallback: false,
    }
  }

  /**
   * ElevenLabs TTS 생성
   */
  private async generateWithElevenLabs(text: string, voiceId: string): Promise<TTSResult> {
    const result = await elevenLabsTTS({
      text,
      voice_id: voiceId,
      model_id: 'eleven_multilingual_v2',
    })

    return {
      success: true,
      audioBuffer: Buffer.from(result.audioBuffer),
      contentType: result.contentType,
      provider: 'elevenlabs',
      usedFallback: false,
    }
  }

  /**
   * 서비스 상태 확인
   */
  async healthCheck(): Promise<{
    minimax: boolean
    elevenlabs: boolean
  }> {
    const testText = 'Hello'
    const results = { minimax: false, elevenlabs: false }

    try {
      await minimaxTTS(testText, 'English_radiant_girl')
      results.minimax = true
    } catch {
      console.error('[TTS HealthCheck] Minimax 불가')
    }

    try {
      await elevenLabsTTS({
        text: testText,
        voice_id: '21m00Tcm4TlvDq8ikWAM',
        model_id: 'eleven_multilingual_v2',
      })
      results.elevenlabs = true
    } catch {
      console.error('[TTS HealthCheck] ElevenLabs 불가')
    }

    return results
  }
}

// ============================================================
// 편의 함수
// ============================================================

/** 싱글톤 인스턴스 */
let ttsServiceInstance: UnifiedTTSService | null = null

/** 기본 TTS 서비스 인스턴스 가져오기 */
export function getTTSService(config?: Partial<TTSServiceConfig>): UnifiedTTSService {
  if (!ttsServiceInstance || config) {
    ttsServiceInstance = new UnifiedTTSService(config)
  }
  return ttsServiceInstance
}

/** 간편 음성 생성 함수 */
export async function generateSpeech(request: TTSRequest): Promise<TTSResult> {
  const service = getTTSService()
  return service.generateSpeech(request)
}
