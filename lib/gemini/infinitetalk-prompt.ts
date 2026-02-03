/**
 * InfiniteTalk 영상 생성용 프롬프트 생성 (Gemini LLM)
 *
 * 첫 프레임 이미지를 분석하여 상황에 맞는 모션 프롬프트 생성
 * - 제품 위치 및 그립 상태 파악
 * - 셀카/삼각대 모드 구분
 * - 손 자세 유지 지시
 */

import { GenerateContentConfig, ThinkingLevel } from '@google/genai'
import { getGenAI, MODEL_NAME, fetchImageAsBase64 } from './shared'

// ============================================================
// 타입 정의
// ============================================================

export interface InfiniteTalkPromptInput {
  /** 첫 프레임 이미지 URL */
  firstFrameImageUrl: string
  /** 카메라 구도 (selfie-high, ugc-selfie, tripod 등) */
  cameraComposition?: string
  /** 대본 스타일 (formal, casual, energetic) */
  scriptStyle?: string
  /** 비디오 타입 (UGC, podcast, expert) */
  videoType?: string
  /** 제품명 (선택) */
  productName?: string
  /** 장소 프롬프트 (선택) */
  locationPrompt?: string
}

export interface InfiniteTalkPromptResult {
  /** 생성된 모션 프롬프트 (영어) */
  motionPrompt: string
  /** 분석 결과 요약 (한국어) */
  analysisSummary: string
}

// ============================================================
// 프롬프트 생성
// ============================================================

const SYSTEM_PROMPT = `You are an expert at creating motion prompts for AI talking-head video generation (InfiniteTalk model).

Your task: Analyze the input image and generate a motion prompt that maintains physical consistency while allowing natural movement.

=== GESTURE RULES (CONTEXT-AWARE) ===

1. PRODUCT GRIP PRESERVATION (when holding product):
   - "maintain firm grip on product throughout, product stays in exact position, no release"
   - The hand holding product: minimal movement, no release gestures
   - Product must NOT float or change position

2. FREE HAND GESTURES (when one hand is free):
   - If holding product with ONE hand: the OTHER hand can gesture naturally
   - "free hand gestures naturally while speaking, occasional emphasis movements"
   - "relaxed hand movements, conversational gestures with free hand"

3. NO PRODUCT = NATURAL GESTURES:
   - If NOT holding any product: both hands can gesture freely
   - "natural conversational gestures, expressive hand movements while speaking"
   - "engaging hand gestures, emphasizing key points naturally"

4. SELFIE MODE ADJUSTMENTS:
   - If selfie angle: One hand conceptually holds camera (off-screen)
   - The other hand: can gesture naturally OR hold product
   - If selfie + holding product: "one hand off-screen, other hand maintains product grip"
   - If selfie + no product: "one hand off-screen, free hand gestures naturally while speaking"

5. EXPRESSION (NATURAL, NOT FORCED):
   - Use: "calm engaged expression", "natural speaking expression", "relaxed demeanor"
   - AVOID: "bright smile", "big smile", "enthusiastic grin"

6. PHYSICAL CONSISTENCY:
   - "no floating objects"
   - "maintain physical contact with all held items"
   - Product hand: consistent position / Free hand: natural movement allowed

=== OUTPUT FORMAT ===
{
  "motionPrompt": "English motion prompt for InfiniteTalk (50-80 words)",
  "analysisSummary": "Korean summary of image analysis (what was detected)"
}

=== MOTION PROMPT STRUCTURE ===
[Subject description] + [Camera/angle info] + [Expression] + [Product hand constraint if any] + [Free hand gestures] + [Speaking style] + [Location atmosphere if provided]
`

/**
 * InfiniteTalk용 모션 프롬프트 생성
 */
export async function generateInfiniteTalkPrompt(
  input: InfiniteTalkPromptInput
): Promise<InfiniteTalkPromptResult> {
  const {
    firstFrameImageUrl,
    cameraComposition,
    scriptStyle,
    videoType,
    productName,
    locationPrompt,
  } = input

  // 카메라 구도 설명
  const cameraDesc = cameraComposition
    ? `Camera composition: ${cameraComposition}`
    : 'Camera composition: natural framing'

  // 셀카 모드 여부
  const isSelfieMode = cameraComposition?.includes('selfie') || cameraComposition === 'ugc-closeup'

  // 대본 스타일 설명
  const styleDesc = {
    formal: 'professional, measured tone',
    casual: 'relaxed, friendly tone',
    energetic: 'enthusiastic but controlled tone',
  }[scriptStyle || 'casual'] || 'natural conversational tone'

  // 비디오 타입 설명
  const videoTypeDesc = {
    UGC: 'UGC influencer style, authentic vibe',
    podcast: 'conversational podcast style, thoughtful',
    expert: 'professional presenter style, authoritative',
  }[videoType || 'UGC'] || 'natural speaking style'

  const userPrompt = `Analyze this image and generate an InfiniteTalk motion prompt.

=== CONTEXT ===
${cameraDesc}
${isSelfieMode ? '⚠️ SELFIE MODE: One hand is conceptually holding the camera (not visible). The OTHER hand is FREE to gesture naturally.' : ''}
Speaking style: ${styleDesc}
Video type: ${videoTypeDesc}
${productName ? `Product being discussed: ${productName}` : 'No specific product mentioned'}
${locationPrompt ? `Location atmosphere: ${locationPrompt}` : ''}

=== ANALYSIS TASKS ===
1. Is the person holding something? What? Which hand?
2. Hand positions - which hands are visible? Which hand is FREE (not holding anything)?
3. Is this a selfie perspective or tripod/fixed camera?
4. What natural gestures can the FREE hand do while speaking?

=== GENERATE ===
Create a motion prompt that:
- Preserves product grip if holding something (that hand stays still)
- Allows NATURAL GESTURES for the FREE hand (conversational movements, emphasis gestures)
- If no product: both hands can gesture naturally while speaking
- Uses natural expression (NO forced smile)
- Balances physical consistency WITH natural human movement

Output JSON only.`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // 이미지 추가
  const imageData = await fetchImageAsBase64(firstFrameImageUrl)
  if (imageData) {
    parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
  }

  parts.push({ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` })

  try {
    const response = await getGenAI().models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts }],
      config,
    })

    const result = JSON.parse(response.text || '{}') as InfiniteTalkPromptResult

    // 결과 검증 및 보정
    let motionPrompt = result.motionPrompt || ''

    // 안전장치: 제품명이 있으면 그립 유지 문구 확인/추가
    if (productName && !motionPrompt.toLowerCase().includes('maintain') && !motionPrompt.toLowerCase().includes('grip')) {
      motionPrompt += '. Maintain firm grip on product, no release.'
    }

    // 안전장치: floating 방지 문구 추가
    if (!motionPrompt.toLowerCase().includes('float')) {
      motionPrompt += ' No floating objects.'
    }

    return {
      motionPrompt,
      analysisSummary: result.analysisSummary || '이미지 분석 완료',
    }
  } catch (error) {
    console.error('[InfiniteTalk Prompt] Generation failed:', error)

    // 폴백: 안전한 기본 프롬프트
    const fallbackPrompt = buildFallbackPrompt({
      isSelfieMode,
      hasProduct: !!productName,
      scriptStyle,
      videoType,
      locationPrompt,
    })

    return {
      motionPrompt: fallbackPrompt,
      analysisSummary: 'LLM 분석 실패, 기본 프롬프트 사용',
    }
  }
}

/**
 * 폴백 프롬프트 생성 (LLM 실패 시)
 */
function buildFallbackPrompt(params: {
  isSelfieMode: boolean
  hasProduct: boolean
  scriptStyle?: string
  videoType?: string
  locationPrompt?: string
}): string {
  const parts: string[] = []

  parts.push('A person speaking naturally to camera')

  // 셀카 모드
  if (params.isSelfieMode) {
    parts.push('POV selfie perspective, one hand holding camera off-screen')
  } else {
    parts.push('stable camera framing, eye contact with camera')
  }

  // 표정 (미소 없이)
  const expressionMap: Record<string, string> = {
    formal: 'calm professional expression, composed demeanor',
    casual: 'relaxed natural expression, friendly demeanor',
    energetic: 'engaged enthusiastic expression, animated but controlled',
  }
  parts.push(expressionMap[params.scriptStyle || 'casual'] || 'natural relaxed expression')

  // 제품 유무에 따른 제스처
  if (params.hasProduct) {
    if (params.isSelfieMode) {
      // 셀카 + 제품: 한 손 카메라, 한 손 제품
      parts.push('one hand off-screen holding camera, other hand maintains firm grip on product, product stays in position, no release')
    } else {
      // 일반 + 제품: 한 손 제품, 다른 손 자유 제스처
      parts.push('one hand maintains firm grip on product, product stays in position, free hand gestures naturally while speaking, conversational hand movements')
    }
  } else {
    if (params.isSelfieMode) {
      // 셀카 + 제품 없음: 한 손 카메라, 한 손 자유 제스처
      parts.push('one hand off-screen holding camera, free hand gestures naturally while speaking, expressive conversational movements')
    } else {
      // 일반 + 제품 없음: 양손 자유 제스처
      parts.push('natural conversational gestures with both hands, expressive hand movements while speaking, engaging body language')
    }
  }

  // 기본 동작
  parts.push('subtle head movements, natural lip-sync to speech, no floating objects')

  // 장소
  if (params.locationPrompt) {
    const shortLocation = params.locationPrompt.length > 40
      ? params.locationPrompt.substring(0, 40)
      : params.locationPrompt
    parts.push(`in ${shortLocation}`)
  }

  return parts.join('. ')
}
