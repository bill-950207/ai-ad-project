/**
 * ElevenLabs API 클라이언트
 *
 * 텍스트 음성 변환(TTS)을 위한 ElevenLabs API 클라이언트입니다.
 * - 사용 가능한 음성 목록 조회
 * - 텍스트를 음성으로 변환
 */

// ElevenLabs API 설정
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

// ============================================================
// 타입 정의
// ============================================================

/** 음성 모델 타입 */
export type ElevenLabsModelId =
  | 'eleven_multilingual_v2'      // 다국어 v2 (권장)
  | 'eleven_turbo_v2_5'           // 터보 v2.5 (빠른 응답)
  | 'eleven_multilingual_v1'      // 다국어 v1

/** 음성 설정 */
export interface VoiceSettings {
  stability: number              // 안정성 (0.0 ~ 1.0)
  similarity_boost: number       // 유사도 부스트 (0.0 ~ 1.0)
  style?: number                 // 스타일 (0.0 ~ 1.0, 선택사항)
  use_speaker_boost?: boolean    // 스피커 부스트 사용 여부
}

/** 음성 정보 */
export interface Voice {
  voice_id: string               // 음성 ID
  name: string                   // 음성 이름
  category?: string              // 카테고리 (premade, cloned, generated)
  description?: string           // 설명
  preview_url?: string           // 미리듣기 URL
  labels?: Record<string, string> // 레이블 (accent, gender, age 등)
  available_for_tiers?: string[] // 사용 가능 티어
}

/** 음성 목록 응답 */
export interface VoicesResponse {
  voices: Voice[]
}

/** TTS 입력 */
export interface TTSInput {
  text: string                   // 변환할 텍스트
  voice_id: string               // 사용할 음성 ID
  model_id?: ElevenLabsModelId   // 모델 ID (기본: eleven_multilingual_v2)
  voice_settings?: VoiceSettings // 음성 설정 (선택사항)
  output_format?: string         // 출력 포맷 (기본: mp3_44100_128)
}

/** TTS 결과 */
export interface TTSResult {
  audioBuffer: ArrayBuffer       // 오디오 데이터
  contentType: string            // Content-Type (audio/mpeg 등)
}

// ============================================================
// 기본 음성 설정
// ============================================================

/** 기본 음성 설정 */
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
}

/** 음성 언어 타입 */
export type VoiceLanguage = 'ko' | 'en' | 'ja' | 'zh'

/** 언어별 레이블 */
export const LANGUAGE_LABELS: Record<VoiceLanguage, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
}

/** 한국어 추천 음성 목록 (미리 정의된 음성, ElevenLabs 제공 preview_url 포함) */
export const KOREAN_RECOMMENDED_VOICES = [
  {
    voice_id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    description: '젊은 여성, 자연스러운 톤',
    labels: { gender: 'female', age: 'young', language: 'ko' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/942356dc-f10d-4d89-bda5-4f8505ee038b.mp3',
  },
  {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: '전문적인 여성 목소리',
    labels: { gender: 'female', age: 'middle_aged', language: 'ko' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8571-904e0f0de673.mp3',
  },
  {
    voice_id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    description: '밝고 활기찬 여성',
    labels: { gender: 'female', age: 'young', language: 'ko' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/69c5373f-0dc2-4efd-9232-a0140182c0a9.mp3',
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    description: '부드럽고 따뜻한 여성',
    labels: { gender: 'female', age: 'young', language: 'ko' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04a8d578-323e-4e2b-b247-fb524c2b4c38.mp3',
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    description: '젊은 남성, 친근한 톤',
    labels: { gender: 'male', age: 'young', language: 'ko' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/32e46c56-71fc-4f66-85c7-3ed54a211dd5.mp3',
  },
  {
    voice_id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    description: '깊고 신뢰감 있는 남성',
    labels: { gender: 'male', age: 'middle_aged', language: 'ko' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/316050b7-c4e0-48de-acf9-a882bb7fc43b.mp3',
  },
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: '전문적인 남성 목소리',
    labels: { gender: 'male', age: 'middle_aged', language: 'ko' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/4e1b1f53-11e5-4b90-9d10-c57f8c728148.mp3',
  },
  {
    voice_id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'Sam',
    description: '젊고 에너지 넘치는 남성',
    labels: { gender: 'male', age: 'young', language: 'ko' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/yoZ06aMxZJJ28mfd3POQ/524df8e1-26fb-4bb1-9a83-ab3fba9ea87d.mp3',
  },
]

/** 영어 추천 음성 목록 */
export const ENGLISH_RECOMMENDED_VOICES = [
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    description: 'Soft and warm female voice',
    labels: { gender: 'female', age: 'young', language: 'en' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04a8d578-323e-4e2b-b247-fb524c2b4c38.mp3',
  },
  {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: 'Professional female voice',
    labels: { gender: 'female', age: 'middle_aged', language: 'en' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8571-904e0f0de673.mp3',
  },
  {
    voice_id: 'ThT5KcBeYPX3keUQqHPh',
    name: 'Dorothy',
    description: 'Pleasant British accent',
    labels: { gender: 'female', age: 'young', language: 'en' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ThT5KcBeYPX3keUQqHPh/981f0855-6598-48d2-9f8f-b6d92fbbe3fc.mp3',
  },
  {
    voice_id: 'jBpfuIE2acCO8z3wKNLl',
    name: 'Gigi',
    description: 'Bright and energetic female',
    labels: { gender: 'female', age: 'young', language: 'en' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/jBpfuIE2acCO8z3wKNLl/3a7e4339-78b6-45b1-8b4c-0aa3e29e4f4e.mp3',
  },
  {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    description: 'Deep and warm male voice',
    labels: { gender: 'male', age: 'young', language: 'en' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/c6431f82-0bf1-4a56-8488-77bb7fd23f45.mp3',
  },
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: 'Professional male voice',
    labels: { gender: 'male', age: 'middle_aged', language: 'en' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/4e1b1f53-11e5-4b90-9d10-c57f8c728148.mp3',
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    description: 'Friendly young male',
    labels: { gender: 'male', age: 'young', language: 'en' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/32e46c56-71fc-4f66-85c7-3ed54a211dd5.mp3',
  },
  {
    voice_id: 'GBv7mTt0atIp3Br8iCZE',
    name: 'Thomas',
    description: 'Calm and clear male',
    labels: { gender: 'male', age: 'middle_aged', language: 'en' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/GBv7mTt0atIp3Br8iCZE/17e8fb20-c79f-4116-a3cd-de57fb1dcfb2.mp3',
  },
]

/** 일본어 추천 음성 목록 */
export const JAPANESE_RECOMMENDED_VOICES = [
  {
    voice_id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    description: '若い女性、自然なトーン',
    labels: { gender: 'female', age: 'young', language: 'ja' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/942356dc-f10d-4d89-bda5-4f8505ee038b.mp3',
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    description: '柔らかく温かい女性',
    labels: { gender: 'female', age: 'young', language: 'ja' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04a8d578-323e-4e2b-b247-fb524c2b4c38.mp3',
  },
  {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: 'プロフェッショナルな女性',
    labels: { gender: 'female', age: 'middle_aged', language: 'ja' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8571-904e0f0de673.mp3',
  },
  {
    voice_id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    description: '明るく活発な女性',
    labels: { gender: 'female', age: 'young', language: 'ja' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/69c5373f-0dc2-4efd-9232-a0140182c0a9.mp3',
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    description: '若い男性、親しみやすいトーン',
    labels: { gender: 'male', age: 'young', language: 'ja' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/32e46c56-71fc-4f66-85c7-3ed54a211dd5.mp3',
  },
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: 'プロフェッショナルな男性',
    labels: { gender: 'male', age: 'middle_aged', language: 'ja' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/4e1b1f53-11e5-4b90-9d10-c57f8c728148.mp3',
  },
]

/** 중국어 추천 음성 목록 */
export const CHINESE_RECOMMENDED_VOICES = [
  {
    voice_id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    description: '年轻女性，自然语调',
    labels: { gender: 'female', age: 'young', language: 'zh' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/942356dc-f10d-4d89-bda5-4f8505ee038b.mp3',
  },
  {
    voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    description: '柔和温暖的女性',
    labels: { gender: 'female', age: 'young', language: 'zh' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04a8d578-323e-4e2b-b247-fb524c2b4c38.mp3',
  },
  {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: '专业女性声音',
    labels: { gender: 'female', age: 'middle_aged', language: 'zh' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8571-904e0f0de673.mp3',
  },
  {
    voice_id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    description: '明亮活泼的女性',
    labels: { gender: 'female', age: 'young', language: 'zh' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/69c5373f-0dc2-4efd-9232-a0140182c0a9.mp3',
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    description: '年轻男性，友好的语调',
    labels: { gender: 'male', age: 'young', language: 'zh' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/32e46c56-71fc-4f66-85c7-3ed54a211dd5.mp3',
  },
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: '专业男性声音',
    labels: { gender: 'male', age: 'middle_aged', language: 'zh' },
    preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/4e1b1f53-11e5-4b90-9d10-c57f8c728148.mp3',
  },
]

/** 언어별 음성 목록 */
export const VOICES_BY_LANGUAGE: Record<VoiceLanguage, typeof KOREAN_RECOMMENDED_VOICES> = {
  ko: KOREAN_RECOMMENDED_VOICES,
  en: ENGLISH_RECOMMENDED_VOICES,
  ja: JAPANESE_RECOMMENDED_VOICES,
  zh: CHINESE_RECOMMENDED_VOICES,
}

// ============================================================
// API 함수
// ============================================================

/**
 * 사용 가능한 모든 음성 목록을 조회합니다.
 *
 * @returns 음성 목록
 */
export async function getVoices(): Promise<Voice[]> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    method: 'GET',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API 오류: ${response.status} - ${errorText}`)
  }

  const data = (await response.json()) as VoicesResponse
  return data.voices
}

/**
 * 특정 카테고리의 음성만 필터링하여 조회합니다.
 *
 * @param category - 카테고리 ('premade', 'cloned', 'generated')
 * @returns 필터링된 음성 목록
 */
export async function getVoicesByCategory(category: string): Promise<Voice[]> {
  const voices = await getVoices()
  return voices.filter((voice) => voice.category === category)
}

/**
 * 한국어에 적합한 추천 음성 목록을 반환합니다.
 * API 호출 없이 미리 정의된 목록을 반환합니다.
 *
 * @returns 한국어 추천 음성 목록
 */
export function getKoreanRecommendedVoices(): Voice[] {
  return KOREAN_RECOMMENDED_VOICES.map((voice) => ({
    ...voice,
    category: 'premade',
  }))
}

/**
 * 특정 언어에 적합한 추천 음성 목록을 반환합니다.
 *
 * @param language - 언어 코드 (ko, en, ja, zh)
 * @returns 해당 언어의 추천 음성 목록
 */
export function getVoicesByLanguage(language: VoiceLanguage): Voice[] {
  const voices = VOICES_BY_LANGUAGE[language] || KOREAN_RECOMMENDED_VOICES
  return voices.map((voice) => ({
    ...voice,
    category: 'premade',
  }))
}

/**
 * 모든 언어의 음성 목록을 반환합니다.
 *
 * @returns 모든 언어의 음성 목록 (언어별로 그룹화)
 */
export function getAllVoices(): { language: VoiceLanguage; label: string; voices: Voice[] }[] {
  return (Object.keys(VOICES_BY_LANGUAGE) as VoiceLanguage[]).map((lang) => ({
    language: lang,
    label: LANGUAGE_LABELS[lang],
    voices: getVoicesByLanguage(lang),
  }))
}

/**
 * 텍스트에서 언어를 감지합니다.
 * 간단한 문자 범위 기반 감지 (서버/클라이언트 공용)
 *
 * @param text - 감지할 텍스트
 * @returns 감지된 언어 코드
 */
export function detectLanguage(text: string): VoiceLanguage {
  if (!text || text.trim().length === 0) return 'ko'

  // 문자 범위별 카운트
  let korean = 0
  let english = 0
  let japanese = 0
  let chinese = 0

  for (const char of text) {
    const code = char.charCodeAt(0)
    // 한글 (가-힣, ㄱ-ㅎ, ㅏ-ㅣ)
    if ((code >= 0xAC00 && code <= 0xD7AF) || (code >= 0x1100 && code <= 0x11FF) || (code >= 0x3130 && code <= 0x318F)) {
      korean++
    }
    // 영어 (A-Z, a-z)
    else if ((code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A)) {
      english++
    }
    // 히라가나 (ぁ-ゟ) & 카타카나 (゠-ヿ)
    else if ((code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF)) {
      japanese++
    }
    // 한자 (CJK Unified Ideographs) - 일본어/중국어 공용
    else if (code >= 0x4E00 && code <= 0x9FFF) {
      // 히라가나/카타카나가 있으면 일본어로, 아니면 중국어로
      chinese++
    }
  }

  // 히라가나/카타카나가 있으면 한자도 일본어로 간주
  if (japanese > 0) {
    japanese += chinese
    chinese = 0
  }

  // 가장 많은 언어 선택
  const max = Math.max(korean, english, japanese, chinese)
  if (max === 0) return 'ko' // 기본값

  if (korean === max) return 'ko'
  if (english === max) return 'en'
  if (japanese === max) return 'ja'
  if (chinese === max) return 'zh'

  return 'ko'
}

/**
 * 텍스트를 음성으로 변환합니다.
 *
 * @param input - TTS 입력 데이터
 * @returns 오디오 데이터와 Content-Type
 */
export async function textToSpeech(input: TTSInput): Promise<TTSResult> {
  const {
    text,
    voice_id,
    model_id = 'eleven_multilingual_v2',
    voice_settings = DEFAULT_VOICE_SETTINGS,
    output_format = 'mp3_44100_128',
  } = input

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voice_id}?output_format=${output_format}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs TTS 오류: ${response.status} - ${errorText}`)
  }

  const audioBuffer = await response.arrayBuffer()
  const contentType = response.headers.get('Content-Type') || 'audio/mpeg'

  return {
    audioBuffer,
    contentType,
  }
}

/**
 * 텍스트를 음성으로 변환하고 Base64로 반환합니다.
 * 클라이언트에서 직접 재생하거나 저장할 때 유용합니다.
 *
 * @param input - TTS 입력 데이터
 * @returns Base64 인코딩된 오디오 데이터
 */
export async function textToSpeechBase64(input: TTSInput): Promise<{
  audioBase64: string
  contentType: string
}> {
  const result = await textToSpeech(input)

  // ArrayBuffer를 Base64로 변환
  const bytes = new Uint8Array(result.audioBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const audioBase64 = btoa(binary)

  return {
    audioBase64,
    contentType: result.contentType,
  }
}

/**
 * 스크립트 길이에 따른 예상 오디오 길이를 계산합니다.
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
 * 특정 길이에 맞는 스크립트 글자 수를 추천합니다.
 *
 * @param durationSeconds - 목표 오디오 길이 (초)
 * @returns 추천 글자 수 범위
 */
export function getRecommendedCharCount(durationSeconds: number): {
  min: number
  max: number
  optimal: number
} {
  // 한국어 기준 분당 약 200-250자
  const minCharsPerSecond = 200 / 60  // ~3.3
  const maxCharsPerSecond = 250 / 60  // ~4.2
  const optimalCharsPerSecond = 220 / 60 // ~3.7

  return {
    min: Math.round(durationSeconds * minCharsPerSecond),
    max: Math.round(durationSeconds * maxCharsPerSecond),
    optimal: Math.round(durationSeconds * optimalCharsPerSecond),
  }
}
