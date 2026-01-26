/**
 * AI 아바타 프롬프트 생성 (GPT-Image용)
 */

import { GenerateContentConfig, MediaResolution, ThinkingLevel } from '@google/genai'
import { genAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
import type {
  AiAvatarPromptInput,
  AiAvatarPromptResult,
  CameraCompositionType,
  ModelPoseType,
  OutfitPresetType,
} from './types'
import { NO_OVERLAY_ELEMENTS } from '@/lib/prompts/common'
import { VIDEO_TYPE_SCRIPT_STYLES } from '@/lib/prompts/scripts'
import { VIDEO_TYPE_FIRST_FRAME_GUIDES } from '@/lib/prompts/first-frame'

// 카메라 구도별 설정
const cameraCompositionDescriptions: Record<CameraCompositionType, { description: string; aperture: string; lens: string }> = {
  'selfie-high': { description: 'high angle selfie perspective, camera looking down from above eye level', aperture: 'f/11', lens: '28mm' },
  'selfie-front': { description: 'eye-level frontal view, direct eye contact with camera', aperture: 'f/11', lens: '35mm' },
  'selfie-side': { description: 'three-quarter angle, showing facial contours, slight side view', aperture: 'f/11', lens: '35mm' },
  tripod: { description: 'stable tripod shot, medium distance, waist to head visible', aperture: 'f/16', lens: '50mm' },
  closeup: { description: 'close-up portrait, face and upper body prominent', aperture: 'f/11', lens: '50mm' },
  fullbody: { description: 'full body shot, entire person visible in frame', aperture: 'f/16', lens: '35mm' },
  'ugc-closeup': { description: 'UGC-style intimate medium close-up, chest-up framing, eyes looking DIRECTLY into camera lens', aperture: 'f/8', lens: '35mm' },
}

// 모델 포즈 설명
const modelPoseDescriptions: Record<ModelPoseType, string> = {
  'holding-product': 'Model holding product naturally at chest level',
  'showing-product': 'Model presenting product towards camera',
  'using-product': 'Model actively using the product',
  'talking-only': '⚠️ NO PRODUCT! Avatar only, natural conversational pose',
}

// 의상 프리셋 설명
const outfitPresetDescriptions: Record<OutfitPresetType, string> = {
  casual_everyday: '캐주얼 일상 의상 - 티셔츠와 청바지',
  formal_elegant: '포멀/우아한 의상 - 세련된 드레스나 정장',
  professional_business: '비즈니스 의상 - 전문적인 정장',
  sporty_athletic: '스포티 의상 - 운동복 스타일',
  cozy_comfortable: '편안한 의상 - 니트 스웨터',
  trendy_fashion: '트렌디 패션 의상 - 최신 유행',
  minimal_simple: '미니멀 심플 의상 - 깔끔한 단색',
}

/**
 * AI 아바타 프롬프트 생성
 * 제품 정보를 바탕으로 GPT-Image 1.5용 이미지 생성 프롬프트를 생성합니다.
 */
export async function generateAiAvatarPrompt(input: AiAvatarPromptInput): Promise<AiAvatarPromptResult> {
  const genderMap: Record<string, string> = { male: '남성', female: '여성', any: '성별 무관' }
  const ageMap: Record<string, string> = { young: '20-30대', middle: '30-40대', mature: '40-50대', any: '연령대 무관' }
  const styleMap: Record<string, string> = { natural: '자연스럽고 친근한', professional: '전문적이고 세련된', casual: '캐주얼하고 편안한', elegant: '우아하고 고급스러운', any: '스타일 무관' }
  const ethnicityMap: Record<string, string> = { korean: '한국인', asian: '아시아인', western: '서양인', any: '인종 무관' }

  // 비디오 타입별 스타일 가이드
  const videoType = input.videoType || 'UGC'
  const videoTypeGuide = VIDEO_TYPE_FIRST_FRAME_GUIDES[videoType]
  const videoTypeStyle = VIDEO_TYPE_SCRIPT_STYLES[videoType]

  // 장소: 사용자 지정 > 비디오 타입 기본값
  const locationSection = input.locationPrompt
    ? `사용자가 지정한 장소: ${input.locationPrompt}`
    : `장소: ${videoTypeGuide.environmentPrompt} (${videoTypeStyle.korean} 스타일)`

  const targetGenderText = genderMap[input.targetGender || 'any']
  const targetAgeText = ageMap[input.targetAge || 'any']
  const styleText = styleMap[input.style || 'any']
  const ethnicityText = ethnicityMap[input.ethnicity || 'any']

  const cameraConfig = input.cameraComposition
    ? cameraCompositionDescriptions[input.cameraComposition]
    : { description: 'natural framing', aperture: 'f/11', lens: '35mm' }

  const cameraSection = `카메라 구도: ${cameraConfig.description}\n카메라 스펙: Shot on Sony A7IV, ${cameraConfig.lens} ${cameraConfig.aperture}, deep depth of field`

  // 포즈: 사용자 지정 > 비디오 타입 기본값
  const poseSection = input.modelPose
    ? `모델 포즈: ${modelPoseDescriptions[input.modelPose]}`
    : `모델 포즈: ${videoTypeGuide.posePrompt}`

  let outfitSection = ''
  if (input.outfitCustom) {
    outfitSection = `의상 설정 (사용자 지정): ${input.outfitCustom}`
  } else if (input.outfitPreset) {
    outfitSection = `의상 설정: ${outfitPresetDescriptions[input.outfitPreset]}`
  }

  // 비디오 타입별 분위기
  const atmosphereSection = `분위기: ${videoTypeGuide.atmospherePrompt}`

  const prompt = `당신은 GPT-Image 1.5 이미지 생성을 위한 프롬프트 전문가입니다.
제품 설명 영상의 첫 프레임에 사용될 이미지를 생성하기 위한 프롬프트를 작성해주세요.

=== 영상 스타일: ${videoTypeStyle.korean} ===
${videoTypeStyle.description}
${atmosphereSection}

=== 제품 정보 ===
${input.productInfo}

${input.productImageUrl ? '제품 이미지가 Figure 1로 첨부되어 있습니다. "the product from Figure 1" 형식으로 참조하세요.' : '⚠️ 중요: 이 이미지에는 제품이 등장하지 않습니다. 아바타만 나오고, 손은 비어있는 자연스러운 포즈로 생성하세요.'}

=== 타겟 아바타 조건 ===
- 성별: ${targetGenderText}
- 연령대: ${targetAgeText}
- 스타일: ${styleText}
- 인종/민족: ${ethnicityText}

=== 장소/배경 ===
${locationSection}

${cameraSection}

${poseSection}

${outfitSection ? `=== 의상 설정 ===\n${outfitSection}` : ''}

=== 작성 지침 ===
1. 아바타: 인종, 성별, 나이대, 피부톤, 머리카락, 표정, 의상 상세 묘사
2. 배경: 선명한 배경 (블러 금지), 자연광 - "${videoTypeStyle.korean}" 스타일에 맞는 배경
3. 카메라: Shot on Sony A7IV, 35mm f/8, deep depth of field
4. 품질: ultra-realistic cinematic editorial photography, 8K quality
5. 중요: 이미지는 "${videoTypeStyle.korean}" 영상 스타일의 분위기를 반영해야 합니다

=== 중요: 오버레이 요소 금지 ===
${NO_OVERLAY_ELEMENTS}

다음 JSON 형식으로 응답하세요:
{
  "prompt": "영어로 작성된 GPT-Image 1.5 프롬프트 (50-100단어)",
  "avatarDescription": "생성될 아바타에 대한 한국어 설명",
  "locationDescription": "장소/배경에 대한 한국어 설명"
}`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (input.productImageUrl) {
    const imageData = await fetchImageAsBase64(input.productImageUrl)
    if (imageData) {
      parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
    }
  }

  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  const responseText = response.text || ''

  try {
    return JSON.parse(responseText) as AiAvatarPromptResult
  } catch {
    return {
      prompt: 'A person seated comfortably in a modern living room, naturally holding a product. Full body visible. Calm, confident expression. Soft natural daylight. Sharp in-focus background. Shot on Sony A7IV, 35mm f/8, deep depth of field. Ultra-realistic cinematic editorial photography, 8K quality.',
      avatarDescription: '자연스러운 느낌의 모델',
      locationDescription: '모던한 거실 배경',
    }
  }
}
