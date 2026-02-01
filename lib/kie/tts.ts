/**
 * Kie.ai ElevenLabs Text-to-Dialogue V3 TTS 클라이언트
 *
 * ElevenLabs v3 모델을 Kie.ai를 통해 사용하는 TTS 서비스입니다.
 * - 다국어 지원 (70+ 언어)
 * - 안정성 조절 가능
 * - 비동기 작업 (Task 기반)
 */

import {
  KieApiResponse,
  KieTaskData,
  KieTaskInfo,
  getTaskInfo,
  waitForTask,
} from './client'

// ============================================================
// 설정
// ============================================================

const KIE_API_BASE = 'https://api.kie.ai/api/v1'
const KIE_API_KEY = process.env.KIE_KEY

/** ElevenLabs v3 모델 ID */
const ELEVENLABS_V3_MODEL = 'elevenlabs/text-to-dialogue-v3'

/**
 * API 키 검증
 */
function validateApiKey(): void {
  if (!KIE_API_KEY) {
    throw new Error(
      'Kie.ai API 키가 설정되지 않았습니다. 환경 변수 KIE_KEY를 확인해주세요.'
    )
  }
}

/**
 * API 요청 헤더
 */
const getHeaders = () => {
  validateApiKey()
  return {
    'Authorization': `Bearer ${KIE_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Kie.ai API 에러 상세 정보 파싱
 */
function parseKieError(status: number, responseText: string): string {
  try {
    const errorJson = JSON.parse(responseText)
    const errorMessage = errorJson.msg || errorJson.message || errorJson.error || responseText

    if (status === 403) {
      return `Kie.ai 인증 실패 (403 Forbidden): ${errorMessage}. ` +
        'KIE_KEY 환경 변수를 확인해주세요.'
    }

    return `Kie.ai TTS API 오류 (${status}): ${errorMessage}`
  } catch {
    if (status === 403) {
      return `Kie.ai 인증 실패 (403 Forbidden). KIE_KEY 환경 변수가 올바르게 설정되어 있는지 확인해주세요.`
    }
    return `Kie.ai TTS API 오류: ${status} - ${responseText}`
  }
}

// ============================================================
// 타입 정의
// ============================================================

/** 음성 언어 타입 */
export type TTSLanguage =
  | 'auto' | 'af' | 'ar' | 'hy' | 'as' | 'az' | 'be' | 'bn' | 'bs' | 'bg'
  | 'ca' | 'ceb' | 'ny' | 'hr' | 'cs' | 'da' | 'nl' | 'en' | 'et' | 'fil'
  | 'fi' | 'fr' | 'gl' | 'ka' | 'de' | 'el' | 'gu' | 'ha' | 'he' | 'hi'
  | 'hu' | 'is' | 'id' | 'ga' | 'it' | 'ja' | 'jv' | 'kn' | 'kk' | 'ky'
  | 'ko' | 'lv' | 'ln' | 'lt' | 'lb' | 'mk' | 'ms' | 'ml' | 'zh' | 'mr'
  | 'ne' | 'no' | 'ps' | 'fa' | 'pl' | 'pt' | 'pa' | 'ro' | 'ru' | 'sr'
  | 'sd' | 'sk' | 'sl' | 'so' | 'es' | 'sw' | 'sv' | 'ta' | 'te' | 'th'
  | 'tr' | 'uk' | 'ur' | 'vi' | 'cy'

/** 음성 정보 인터페이스 */
export interface VoiceInfo {
  id: string
  name: string
  description: string
  gender: 'male' | 'female' | 'unknown'
  style: string
  language: TTSLanguage
  previewUrl?: string
}

/** TTS 입력 타입 */
export interface KieTTSInput {
  text: string
  voice_id: string
  stability?: number           // 0-1, 기본값 0.5
  language_code?: TTSLanguage  // 기본값 'auto'
}

/** TTS 작업 출력 타입 */
export interface KieTTSOutput {
  taskId: string
}

/** TTS 결과 타입 */
export interface KieTTSResult {
  audioUrl: string
  contentType: string
}

// ============================================================
// 음성 목록 (나중에 테스트하면서 채워야 함)
// ============================================================

/**
 * 한국어 음성 목록
 * TODO: 실제 테스트 후 voice_id, 이름, 성별 등 업데이트 필요
 */
export const KOREAN_VOICES: VoiceInfo[] = [
  // 예시 - 실제 voice_id는 테스트 후 업데이트 필요
  {
    id: 'korean_female_1',
    name: '여성 1',
    description: '한국어 여성 음성',
    gender: 'female',
    style: 'neutral',
    language: 'ko',
  },
  {
    id: 'korean_male_1',
    name: '남성 1',
    description: '한국어 남성 음성',
    gender: 'male',
    style: 'neutral',
    language: 'ko',
  },
]

/**
 * 영어 음성 목록
 * TODO: 실제 테스트 후 voice_id, 이름, 성별 등 업데이트 필요
 */
export const ENGLISH_VOICES: VoiceInfo[] = [
  {
    id: 'english_female_1',
    name: 'Female 1',
    description: 'English female voice',
    gender: 'female',
    style: 'neutral',
    language: 'en',
  },
  {
    id: 'english_male_1',
    name: 'Male 1',
    description: 'English male voice',
    gender: 'male',
    style: 'neutral',
    language: 'en',
  },
]

/**
 * 일본어 음성 목록
 * TODO: 실제 테스트 후 voice_id, 이름, 성별 등 업데이트 필요
 */
export const JAPANESE_VOICES: VoiceInfo[] = [
  {
    id: 'japanese_female_1',
    name: '女性 1',
    description: '日本語女性音声',
    gender: 'female',
    style: 'neutral',
    language: 'ja',
  },
  {
    id: 'japanese_male_1',
    name: '男性 1',
    description: '日本語男性音声',
    gender: 'male',
    style: 'neutral',
    language: 'ja',
  },
]

/**
 * 중국어 음성 목록
 * TODO: 실제 테스트 후 voice_id, 이름, 성별 등 업데이트 필요
 */
export const CHINESE_VOICES: VoiceInfo[] = [
  {
    id: 'chinese_female_1',
    name: '女性 1',
    description: '中文女性语音',
    gender: 'female',
    style: 'neutral',
    language: 'zh',
  },
  {
    id: 'chinese_male_1',
    name: '男性 1',
    description: '中文男性语音',
    gender: 'male',
    style: 'neutral',
    language: 'zh',
  },
]

/** 언어별 음성 목록 */
export const VOICES_BY_LANGUAGE: Record<string, VoiceInfo[]> = {
  ko: KOREAN_VOICES,
  en: ENGLISH_VOICES,
  ja: JAPANESE_VOICES,
  zh: CHINESE_VOICES,
}

/** 언어 라벨 */
export const LANGUAGE_LABELS: Record<string, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
}

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 언어별 음성 목록 가져오기
 */
export function getVoicesByLanguage(language: string): VoiceInfo[] {
  return VOICES_BY_LANGUAGE[language] || KOREAN_VOICES
}

/**
 * 모든 언어의 음성 목록 가져오기
 */
export function getAllVoices(): { language: string; label: string; voices: VoiceInfo[] }[] {
  return Object.entries(VOICES_BY_LANGUAGE).map(([lang, voices]) => ({
    language: lang,
    label: LANGUAGE_LABELS[lang] || lang,
    voices,
  }))
}

/**
 * 음성 ID로 음성 정보 찾기
 */
export function findVoiceById(voiceId: string): VoiceInfo | null {
  const allVoices = [
    ...KOREAN_VOICES,
    ...ENGLISH_VOICES,
    ...JAPANESE_VOICES,
    ...CHINESE_VOICES,
  ]
  return allVoices.find((v) => v.id === voiceId) || null
}

/**
 * 텍스트에서 언어 자동 감지
 */
export function detectLanguage(text: string): TTSLanguage {
  if (!text || text.trim().length === 0) return 'ko'

  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF]/
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/
  const chineseRegex = /[\u4E00-\u9FFF]/

  if (koreanRegex.test(text)) return 'ko'
  if (japaneseRegex.test(text)) return 'ja'
  if (chineseRegex.test(text)) return 'zh'
  return 'en'
}

// ============================================================
// resultJson 파싱 (오디오 URL 추출)
// ============================================================

interface TTSResultJson {
  resultUrls?: string[]
  audio_url?: string
  url?: string
}

/**
 * resultJson 문자열을 파싱하여 오디오 URL 반환
 */
function parseResultJson(resultJson: string | null): string | null {
  if (!resultJson) return null
  try {
    const parsed: TTSResultJson = JSON.parse(resultJson)
    // 다양한 응답 형식 지원
    if (parsed.resultUrls && parsed.resultUrls.length > 0) {
      return parsed.resultUrls[0]
    }
    if (parsed.audio_url) {
      return parsed.audio_url
    }
    if (parsed.url) {
      return parsed.url
    }
    return null
  } catch {
    return null
  }
}

// ============================================================
// TTS API 함수
// ============================================================

/**
 * TTS 작업 생성
 *
 * @param input - TTS 입력 데이터
 * @param callbackUrl - 완료 시 호출할 콜백 URL (선택)
 * @returns Task ID
 */
export async function createTTSTask(
  input: KieTTSInput,
  callbackUrl?: string
): Promise<KieTTSOutput> {
  const body: Record<string, unknown> = {
    model: ELEVENLABS_V3_MODEL,
    input: {
      text: input.text,
      voice_id: input.voice_id,
      stability: input.stability ?? 0.5,
      language_code: input.language_code || 'auto',
    },
  }

  if (callbackUrl) {
    body.callBackUrl = callbackUrl
  }

  console.log(`[TTS] createTTSTask: voice_id=${input.voice_id}, text="${input.text.substring(0, 30)}..."`)

  const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(parseKieError(response.status, errorText))
  }

  const result: KieApiResponse<KieTaskData> = await response.json()

  if (result.code !== 200) {
    throw new Error(`Kie.ai TTS API 오류: ${result.msg}`)
  }

  console.log(`[TTS] Task 생성 성공: taskId=${result.data.taskId}`)

  return {
    taskId: result.data.taskId,
  }
}

/**
 * TTS 작업 완료까지 대기 후 오디오 URL 반환
 *
 * @param taskId - 대기할 Task ID
 * @param options - 폴링 옵션
 * @returns 오디오 URL
 */
export async function waitForTTSResult(
  taskId: string,
  options: {
    maxAttempts?: number
    intervalMs?: number
  } = {}
): Promise<string> {
  const taskInfo = await waitForTask(taskId, {
    maxAttempts: options.maxAttempts || 60,  // 기본 60회 (5분)
    intervalMs: options.intervalMs || 2000,   // 기본 2초 (TTS는 빠름)
  })

  const audioUrl = parseResultJson(taskInfo.resultJson)
  if (!audioUrl) {
    throw new Error('TTS 결과 오디오 URL이 없습니다')
  }

  console.log(`[TTS] 완료: audioUrl=${audioUrl}`)

  return audioUrl
}

/**
 * 텍스트를 음성으로 변환 (원스텝)
 *
 * @param text - 변환할 텍스트
 * @param voiceId - 음성 ID
 * @param options - 추가 옵션
 * @returns 오디오 URL
 */
export async function textToSpeech(
  text: string,
  voiceId: string,
  options?: {
    stability?: number
    languageCode?: TTSLanguage
  }
): Promise<string> {
  const { taskId } = await createTTSTask({
    text,
    voice_id: voiceId,
    stability: options?.stability,
    language_code: options?.languageCode,
  })

  return await waitForTTSResult(taskId)
}

/**
 * 오디오 URL에서 버퍼 다운로드
 *
 * @param audioUrl - 오디오 URL
 * @returns 오디오 버퍼
 */
export async function downloadAudio(audioUrl: string): Promise<Buffer> {
  const response = await fetch(audioUrl)
  if (!response.ok) {
    throw new Error(`오디오 다운로드 실패: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ============================================================
// fal.ai 호환 인터페이스
// ============================================================

/** 큐 제출 응답 */
export interface TTSQueueSubmitResponse {
  request_id: string
}

/** 큐 상태 응답 */
export interface TTSQueueStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

/**
 * TTS 요청을 큐에 제출
 *
 * @param text - 변환할 텍스트
 * @param voiceId - 음성 ID
 * @param options - 추가 옵션
 * @returns 큐 제출 응답
 */
export async function submitTTSToQueue(
  text: string,
  voiceId: string,
  options?: {
    stability?: number
    languageCode?: TTSLanguage
  }
): Promise<TTSQueueSubmitResponse> {
  const { taskId } = await createTTSTask({
    text,
    voice_id: voiceId,
    stability: options?.stability,
    language_code: options?.languageCode,
  })

  return {
    request_id: taskId,
  }
}

/**
 * TTS 큐 상태 조회
 *
 * @param requestId - Task ID
 * @returns 큐 상태
 */
export async function getTTSQueueStatus(requestId: string): Promise<TTSQueueStatusResponse> {
  const taskInfo = await getTaskInfo(requestId)

  const statusMap: Record<string, TTSQueueStatusResponse['status']> = {
    'waiting': 'IN_QUEUE',
    'running': 'IN_PROGRESS',
    'processing': 'IN_PROGRESS',
    'success': 'COMPLETED',
    'fail': 'FAILED',
  }

  return {
    status: statusMap[taskInfo.state] || 'IN_QUEUE',
  }
}

/**
 * TTS 결과 조회
 *
 * @param requestId - Task ID
 * @returns TTS 결과
 */
export async function getTTSQueueResponse(requestId: string): Promise<KieTTSResult> {
  const taskInfo = await getTaskInfo(requestId)

  if (taskInfo.state === 'fail') {
    throw new Error(`TTS 생성 실패: ${taskInfo.failMsg || '알 수 없는 오류'}`)
  }

  const audioUrl = parseResultJson(taskInfo.resultJson)
  if (!audioUrl) {
    throw new Error('TTS 결과 오디오 URL이 없습니다')
  }

  return {
    audioUrl,
    contentType: 'audio/mpeg',
  }
}

// ============================================================
// 편의 함수
// ============================================================

/**
 * 스크립트 길이에 따른 예상 오디오 길이 계산
 * (대략적인 추정치 - 한국어 기준 분당 약 200-250자)
 *
 * @param text - 스크립트 텍스트
 * @returns 예상 오디오 길이 (초)
 */
export function estimateAudioDuration(text: string): number {
  const charCount = text.length
  // 한국어 기준 분당 약 220자
  const charsPerMinute = 220
  const durationSeconds = (charCount / charsPerMinute) * 60
  return Math.round(durationSeconds)
}

/**
 * 특정 길이에 맞는 스크립트 글자 수 추천
 *
 * @param durationSeconds - 목표 오디오 길이 (초)
 * @returns 추천 글자 수 범위
 */
export function getRecommendedCharCount(durationSeconds: number): {
  min: number
  max: number
  optimal: number
} {
  const minCharsPerSecond = 200 / 60  // ~3.3
  const maxCharsPerSecond = 250 / 60  // ~4.2
  const optimalCharsPerSecond = 220 / 60 // ~3.7

  return {
    min: Math.round(durationSeconds * minCharsPerSecond),
    max: Math.round(durationSeconds * maxCharsPerSecond),
    optimal: Math.round(durationSeconds * optimalCharsPerSecond),
  }
}
