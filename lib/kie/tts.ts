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

/** 다국어 설명 인터페이스 */
export interface LocalizedDescription {
  en: string
  ko: string
  ja: string
  zh: string
}

/** 음성 정보 인터페이스 */
export interface VoiceInfo {
  id: string
  name: string
  description: string
  descriptions: LocalizedDescription  // 다국어 설명
  gender: 'male' | 'female' | 'unknown'
  style: string
  language: TTSLanguage
  previewUrl?: string
}

/**
 * 선택한 언어에 맞는 음성 설명 가져오기
 */
export function getVoiceDescription(voice: VoiceInfo, lang: string): string {
  const descriptions = voice.descriptions
  switch (lang) {
    case 'ko': return descriptions.ko
    case 'ja': return descriptions.ja
    case 'zh': return descriptions.zh
    default: return descriptions.en
  }
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
 * ElevenLabs Voice IDs (여성 10명 + 남성 10명)
 * NOTE: ElevenLabs는 모든 음성이 모든 언어를 지원합니다.
 */
export const VOICE_IDS = [
  // 여성 (10명)
  'BIvP0GN1cAtSRTxNHnWS',  // Ellen
  'aMSt68OGf4xUZAnLpTU8',  // Juniper
  'RILOU7YmBhvwJGDGjNmP',  // Jane
  'Z3R5wn05IrDiVCyEkUrK',  // Arabella
  'tnSpp4vdxKPjI9w0GnoV',  // Hope
  'B8gJV1IhpuegLxdpXFOE',  // Kuon
  'exsUS4vynmxd379XN4yO',  // Blondie
  'BpjGufoPiobT79j2vtj4',  // Priyanka
  '2zRM7PkgwBPiau2jvVXc',  // Monika Sogam
  '5l5f8iK3YPeGga21rQIX',  // Adeline
  // 남성 (10명)
  'EkK5I93UQWFDigLMpZcX',  // James
  'NNl6r8mD7vthiJatiJt1',  // Bradford
  'YOq2y2Up4RgXP2HyXjE5',  // Xavier
  'Bj9UqZbhQsanLzgalpEG',  // Austin
  'c6SfcYrb2t09NHXiT80T',  // Jarnathan
  '1SM7GgM6IMuvQlz2BwM3',  // Mark
  'scOwDtmlUjD3prqpp97I',  // Sam
  'NOpBlnGInO9m6vDvFkFC',  // Spuds Oxley
  'DGTOOUoGpoP6UZ9uSWfA',  // Célian
  'x70vRnQBMBu4FAYhjJbO',  // Nathan
] as const

/**
 * 전체 음성 목록 (여성 10명 + 남성 10명)
 * ElevenLabs 음성은 모든 언어를 지원하므로 언어 구분 없이 단일 목록으로 관리합니다.
 */
export const VOICES: VoiceInfo[] = [
  // ========== 여성 (10명) ==========
  {
    id: 'BIvP0GN1cAtSRTxNHnWS',
    name: 'Ellen',
    description: 'Serious, Direct and Confident / Conversational',
    descriptions: {
      en: 'Serious, Direct and Confident / Conversational',
      ko: '진지하고 직접적이며 자신감 있는 / 대화형',
      ja: '真剣で直接的、自信に満ちた / 会話型',
      zh: '严肃、直接且自信 / 对话式',
    },
    gender: 'female',
    style: 'conversational',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'aMSt68OGf4xUZAnLpTU8',
    name: 'Juniper',
    description: 'Grounded and Professional / Conversational',
    descriptions: {
      en: 'Grounded and Professional / Conversational',
      ko: '차분하고 전문적인 / 대화형',
      ja: '落ち着いてプロフェッショナル / 会話型',
      zh: '沉稳且专业 / 对话式',
    },
    gender: 'female',
    style: 'conversational',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'RILOU7YmBhvwJGDGjNmP',
    name: 'Jane',
    description: 'Professional Audiobook Reader / Narration',
    descriptions: {
      en: 'Professional Audiobook Reader / Narration',
      ko: '전문 오디오북 리더 / 나레이션',
      ja: 'プロのオーディオブックリーダー / ナレーション',
      zh: '专业有声书朗读者 / 旁白',
    },
    gender: 'female',
    style: 'narration',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'Z3R5wn05IrDiVCyEkUrK',
    name: 'Arabella',
    description: 'Mysterious and Emotive / Narration',
    descriptions: {
      en: 'Mysterious and Emotive / Narration',
      ko: '신비롭고 감성적인 / 나레이션',
      ja: '神秘的で感情豊か / ナレーション',
      zh: '神秘且富有情感 / 旁白',
    },
    gender: 'female',
    style: 'narration',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'tnSpp4vdxKPjI9w0GnoV',
    name: 'Hope',
    description: 'Upbeat and Clear / Social Media',
    descriptions: {
      en: 'Upbeat and Clear / Social Media',
      ko: '밝고 명확한 / 소셜 미디어',
      ja: '明るくクリア / ソーシャルメディア',
      zh: '活泼清晰 / 社交媒体',
    },
    gender: 'female',
    style: 'social-media',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'B8gJV1IhpuegLxdpXFOE',
    name: 'Kuon',
    description: 'Cheerful, Clear and Steady / Characters',
    descriptions: {
      en: 'Cheerful, Clear and Steady / Characters',
      ko: '쾌활하고 명확하며 안정적인 / 캐릭터',
      ja: '陽気で明瞭、安定感のある / キャラクター',
      zh: '开朗、清晰且稳定 / 角色',
    },
    gender: 'female',
    style: 'characters',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'exsUS4vynmxd379XN4yO',
    name: 'Blondie',
    description: 'Conversational / Conversational',
    descriptions: {
      en: 'Conversational / Conversational',
      ko: '대화체 / 대화형',
      ja: '会話的 / 会話型',
      zh: '对话式 / 对话式',
    },
    gender: 'female',
    style: 'conversational',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'BpjGufoPiobT79j2vtj4',
    name: 'Priyanka',
    description: 'Calm, Neutral and Relaxed / Narration',
    descriptions: {
      en: 'Calm, Neutral and Relaxed / Narration',
      ko: '차분하고 중립적이며 편안한 / 나레이션',
      ja: '穏やかでニュートラル、リラックス / ナレーション',
      zh: '平静、中性且放松 / 旁白',
    },
    gender: 'female',
    style: 'narration',
    language: 'auto' as TTSLanguage,
  },
  {
    id: '2zRM7PkgwBPiau2jvVXc',
    name: 'Monika Sogam',
    description: 'Deep and Natural / Social Media',
    descriptions: {
      en: 'Deep and Natural / Social Media',
      ko: '깊고 자연스러운 / 소셜 미디어',
      ja: '深みがあり自然 / ソーシャルメディア',
      zh: '深沉自然 / 社交媒体',
    },
    gender: 'female',
    style: 'social-media',
    language: 'auto' as TTSLanguage,
  },
  {
    id: '5l5f8iK3YPeGga21rQIX',
    name: 'Adeline',
    description: 'Feminine and Conversational / Narration',
    descriptions: {
      en: 'Feminine and Conversational / Narration',
      ko: '여성스럽고 대화체인 / 나레이션',
      ja: 'フェミニンで会話的 / ナレーション',
      zh: '女性化且对话式 / 旁白',
    },
    gender: 'female',
    style: 'narration',
    language: 'auto' as TTSLanguage,
  },
  // ========== 남성 (10명) ==========
  {
    id: 'EkK5I93UQWFDigLMpZcX',
    name: 'James',
    description: 'Husky, Engaging and Bold / Narration',
    descriptions: {
      en: 'Husky, Engaging and Bold / Narration',
      ko: '허스키하고 매력적이며 대담한 / 나레이션',
      ja: 'ハスキーで魅力的、大胆 / ナレーション',
      zh: '沙哑、吸引人且大胆 / 旁白',
    },
    gender: 'male',
    style: 'narration',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'NNl6r8mD7vthiJatiJt1',
    name: 'Bradford',
    description: 'Expressive and Articulate / Narration',
    descriptions: {
      en: 'Expressive and Articulate / Narration',
      ko: '표현력이 풍부하고 명료한 / 나레이션',
      ja: '表現力豊かで明瞭 / ナレーション',
      zh: '富有表现力且清晰 / 旁白',
    },
    gender: 'male',
    style: 'narration',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'YOq2y2Up4RgXP2HyXjE5',
    name: 'Xavier',
    description: 'Dominating, Metallic Announcer / Characters',
    descriptions: {
      en: 'Dominating, Metallic Announcer / Characters',
      ko: '압도적이고 금속성 아나운서 / 캐릭터',
      ja: '支配的でメタリックなアナウンサー / キャラクター',
      zh: '霸气、金属感播音员 / 角色',
    },
    gender: 'male',
    style: 'characters',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'Bj9UqZbhQsanLzgalpEG',
    name: 'Austin',
    description: 'Deep, Raspy and Authentic / Characters',
    descriptions: {
      en: 'Deep, Raspy and Authentic / Characters',
      ko: '깊고 거친 진정성 있는 / 캐릭터',
      ja: '深くハスキーで本物感のある / キャラクター',
      zh: '低沉、沙哑且真实 / 角色',
    },
    gender: 'male',
    style: 'characters',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'c6SfcYrb2t09NHXiT80T',
    name: 'Jarnathan',
    description: 'Confident and Versatile / Conversational',
    descriptions: {
      en: 'Confident and Versatile / Conversational',
      ko: '자신감 있고 다재다능한 / 대화형',
      ja: '自信に満ちて多才 / 会話型',
      zh: '自信且多才多艺 / 对话式',
    },
    gender: 'male',
    style: 'conversational',
    language: 'auto' as TTSLanguage,
  },
  {
    id: '1SM7GgM6IMuvQlz2BwM3',
    name: 'Mark',
    description: 'Casual, Relaxed and Light / Conversational',
    descriptions: {
      en: 'Casual, Relaxed and Light / Conversational',
      ko: '캐주얼하고 편안하며 가벼운 / 대화형',
      ja: 'カジュアルでリラックス、軽やか / 会話型',
      zh: '休闲、放松且轻松 / 对话式',
    },
    gender: 'male',
    style: 'conversational',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'scOwDtmlUjD3prqpp97I',
    name: 'Sam',
    description: 'Support Agent / Conversational',
    descriptions: {
      en: 'Support Agent / Conversational',
      ko: '고객 지원 상담원 / 대화형',
      ja: 'サポートエージェント / 会話型',
      zh: '客服代表 / 对话式',
    },
    gender: 'male',
    style: 'conversational',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'NOpBlnGInO9m6vDvFkFC',
    name: 'Spuds Oxley',
    description: 'Wise and Approachable / Conversational',
    descriptions: {
      en: 'Wise and Approachable / Conversational',
      ko: '현명하고 친근한 / 대화형',
      ja: '賢明で親しみやすい / 会話型',
      zh: '睿智且平易近人 / 对话式',
    },
    gender: 'male',
    style: 'conversational',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'DGTOOUoGpoP6UZ9uSWfA',
    name: 'Célian',
    description: 'Documentary Narrator / Narration',
    descriptions: {
      en: 'Documentary Narrator / Narration',
      ko: '다큐멘터리 나레이터 / 나레이션',
      ja: 'ドキュメンタリーナレーター / ナレーション',
      zh: '纪录片旁白 / 旁白',
    },
    gender: 'male',
    style: 'narration',
    language: 'auto' as TTSLanguage,
  },
  {
    id: 'x70vRnQBMBu4FAYhjJbO',
    name: 'Nathan',
    description: 'Virtual Radio Host / Narration',
    descriptions: {
      en: 'Virtual Radio Host / Narration',
      ko: '버추얼 라디오 호스트 / 나레이션',
      ja: 'バーチャルラジオホスト / ナレーション',
      zh: '虚拟电台主持人 / 旁白',
    },
    gender: 'male',
    style: 'narration',
    language: 'auto' as TTSLanguage,
  },
]

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
