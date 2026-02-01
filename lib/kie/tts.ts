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
  voice: string                // voice ID (not voice_id)
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
// 음성 목록 (ElevenLabs v3 - 모든 언어 지원)
// ============================================================

/**
 * ElevenLabs Voice IDs
 * NOTE: ElevenLabs는 모든 음성이 모든 언어를 지원합니다.
 * TODO: 실제 테스트 후 name, gender 등 업데이트 필요
 */
export const VOICE_IDS = [
  'BIvP0GN1cAtSRTxNHnWS',
  'aMSt68OGf4xUZAnLpTU8',
  'RILOU7YmBhvwJGDGjNmP',
  'EkK5I93UQWFDigLMpZcX',
  'Z3R5wn05IrDiVCyEkUrK',
  'tnSpp4vdxKPjI9w0GnoV',
  'NNl6r8mD7vthiJatiJt1',
  'YOq2y2Up4RgXP2HyXjE5',
  'Bj9UqZbhQsanLzgalpEG',
  'c6SfcYrb2t09NHXiT80T',
  'B8gJV1IhpuegLxdpXFOE',
  'exsUS4vynmxd379XN4yO',
  'BpjGufoPiobT79j2vtj4',
  '2zRM7PkgwBPiau2jvVXc',
  '1SM7GgM6IMuvQlz2BwM3',
  'ouL9IsyrSnUkCmfnD02u',
  '5l5f8iK3YPeGga21rQIX',
  'scOwDtmlUjD3prqpp97I',
  'NOpBlnGInO9m6vDvFkFC',
  'BZgkqPqms7Kj9ulSkVzn',
  'wo6udizrrtpIxWGp2qJk',
  'yjJ45q8TVCrtMhEKurxY',
  'gU0LNdkMOQCOrPrwtbee',
  'DGzg6RaUqxGRTHSBjfgF',
  'DGTOOUoGpoP6UZ9uSWfA',
  'x70vRnQBMBu4FAYhjJbO',
  'Sm1seazb4gs7RSlUVw7c',
  'P1bg08DkjqiVEzOn76yG',
  'qDuRKMlYmrm8trt5QyBn',
  'kUUTqKQ05NMGulF08DDf',
  'qXpMhyvQqiRxWQs4qSSB',
  'TX3LPaxmHKxFdv7VOQHJ',
  'iP95p4xoKVk53GoZ742B',
  'SOYHLrjzK2X1ezoPC6cr',
  'N2lVS1w4EtoT3dr4eOWO',
  'FGY2WhTYpPnrIDTdsKH5',
  'XB0fDUnXU5powFXDhCwa',
  'cgSgspJ2msm6clMCkdW9',
  'MnUw1cSnpiLoLhpd3Hqp',
  'kPzsL2i3teMYv0FxEYQ6',
  'UgBBYS2sOqTuMpoF3BR0',
  'IjnA9kwZJHJ20Fp7Vmy6',
  'KoQQbl9zjAdLgKZjm8Ol',
  'hpp4J3VqNfWAUOO0d1Us',
  'pNInz6obpgDQGcFmaJgB',
  'nPczCjzI2devNBz1zQrb',
  'L0Dsvb3SLTyegXwtm47J',
  'uYXf8XasLslADfZ2MB4u',
  'gs0tAILXbY5DNrJrsM6F',
  'DTKMou8ccj1ZaWGBiotd',
  'vBKc2FfBKJfcZNyEt1n6',
  'TmNe0cCqkZBMwPWOd3RD',
  'DYkrAHD8iwork3YSUBbs',
  '56AoDkrOh6qfVPDXZ7Pt',
  'eR40ATw9ArzDf9h3v7t7',
  'g6xIsTj2HwM6VR4iXFCw',
  'lcMyyd2HUfFzxdCaC4Ta',
  '6aDn1KB0hjpdcocrUkmq',
  'Sq93GQT4X1lKDXsQcixO',
  'vfaqCOvlrKi4Zp7C2IAm',
  'piI8Kku0DcvcL6TTSeQt',
  'KTPVrSVAEUSJRClDzBw7',
  'flHkNRp1BlvT73UL6gyz',
  '9yzdeviXkFddZ4Oz8Mok',
  'pPdl9cQBQq4p6mRkZy2Z',
  '0SpgpJ4D3MpHCiWdyTg3',
  'UFO0Yv86wqRxAt1DmXUu',
  'oR4uRy4fHDUGGISL0Rev',
  'zYcjlYFOd3taleS0gkk3',
  'nzeAacJi50IvxcyDnMXa',
  'ruirxsoakN0GWmGNIo04',
  '1KFdM0QCwQn4rmn5nn9C',
  'TC0Zp7WVFzhA8zpTlRqV',
  'ljo9gAlSqKOvF6D8sOsX',
  'PPzYpIqttlTYA83688JI',
  'ZF6FPAbjXT4488VcRRnw',
  '8JVbfL6oEdmuxKn5DK2C',
  'iCrDUkL56s3C8sCRl7wb',
  '1hlpeD1ydbI2ow0Tt3EW',
  'wJqPPQ618aTW29mptyoc',
  'EiNlNiXeDU1pqqOPrYMO',
  'FUfBrNit0NNZAwb58KWH',
  '4YYIPFl9wE5c4L2eu2Gb',
  'OYWwCdDHouzDwiZJWOOu',
  '6F5Zhi321D3Oq7v1oNT4',
  'qNkzaJoHLLdpvgh5tISm',
  'YXpFCvM1S3JbWEJhoskW',
  '9PVP7ENhDskL0KYHAKtD',
  'LG95yZDEHg6fCZdQjLqj',
  'CeNX9CMwmxDxUF5Q2Inm',
  'st7NwhTPEzqo2riw7qWC',
  'aD6riP1btT197c6dACmy',
  'FF7KdobWPaiR0vkcALHF',
  'mtrellq69YZsNwzUSyXh',
  'dHd5gvgSOzSfduK4CvEg',
  'cTNP6ZM2mLTKj2BFhxEh',
  'eVItLK1UvXctxuaRV2Oq',
  'U1Vk2oyatMdYs096Ety7',
  'esy0r39YPLQjOczyOib8',
  'bwCXcoVxWNYMlC6Esa8u',
  'D2jw4N9m4xePLTQ3IHjU',
  'Tsns2HvNFKfGiNjllgqo',
  'Atp5cNFg1Wj5gyKD7HWV',
  '1cxc5c3E9K6F1wlqOJGV',
  '1U02n4nD6AdIZ9CjF053',
  'HgyIHe81F3nXywNwkraY',
  'AeRdCCKzvd23BpJoofzx',
  'LruHrtVF6PSyGItzMNHS',
  'Qggl4b0xRMiqOwhPtVWT',
  'zA6D7RyKdc2EClouEMkP',
  '1wGbFxmAM3Fgw63G1zZJ',
  'hqfrgApggtO1785R4Fsn',
  'sH0WdfE5fsKuM2otdQZr',
  'MJ0RnG71ty4LH3dvNfSd',
] as const

/**
 * 전체 음성 목록
 * ElevenLabs 음성은 모든 언어를 지원하므로 언어 구분 없이 단일 목록으로 관리합니다.
 * TODO: 실제 테스트 후 name, gender, style 등 업데이트 필요
 */
export const VOICES: VoiceInfo[] = VOICE_IDS.map((id, index) => ({
  id,
  name: `Voice ${index + 1}`,
  description: 'ElevenLabs multilingual voice',
  gender: 'unknown' as const,
  style: 'neutral',
  language: 'auto' as TTSLanguage,
}))

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
 * NOTE: ElevenLabs 음성은 모든 언어를 지원하므로 언어와 무관하게 전체 목록 반환
 */
export function getVoicesByLanguage(_language: string): VoiceInfo[] {
  // ElevenLabs 음성은 모든 언어를 지원하므로 전체 목록 반환
  return VOICES
}

/**
 * 모든 음성 목록 가져오기
 * NOTE: ElevenLabs 음성은 언어별 구분 없이 단일 목록으로 반환
 */
export function getAllVoices(): { language: string; label: string; voices: VoiceInfo[] }[] {
  // 단일 "전체" 그룹으로 반환 (언어별 구분 없음)
  return [{
    language: 'all',
    label: 'All Voices',
    voices: VOICES,
  }]
}

/**
 * 음성 ID로 음성 정보 찾기
 */
export function findVoiceById(voiceId: string): VoiceInfo | null {
  return VOICES.find((v) => v.id === voiceId) || null
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
  // 'auto'는 지원되지 않으므로 실제 언어 코드 사용 (기본값: 'en')
  const languageCode = input.language_code && input.language_code !== 'auto'
    ? input.language_code
    : 'en'

  const body: Record<string, unknown> = {
    model: ELEVENLABS_V3_MODEL,
    input: {
      stability: input.stability ?? 0.5,
      language_code: languageCode,
      dialogue: [
        {
          text: input.text,
          voice: input.voice,
        },
      ],
    },
  }

  if (callbackUrl) {
    body.callBackUrl = callbackUrl
  }

  console.log(`[TTS] createTTSTask: voice=${input.voice}, text="${input.text.substring(0, 30)}..."`)
  console.log(`[TTS] Request body:`, JSON.stringify(body, null, 2))

  const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  const responseText = await response.text()
  console.log(`[TTS] Response status: ${response.status}, body: ${responseText}`)

  if (!response.ok) {
    throw new Error(parseKieError(response.status, responseText))
  }

  const result: KieApiResponse<KieTaskData> = JSON.parse(responseText)

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
    voice: voiceId,
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
    voice: voiceId,
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
