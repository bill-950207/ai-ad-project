/**
 * 영상 프롬프트 생성 Gemini API 함수
 * - 영상 광고 프롬프트 생성
 * - UGC 프롬프트 생성
 * - 제품 대본 생성
 * - 첫 프레임 프롬프트 생성
 */

import { GenerateContentConfig, MediaResolution, ThinkingLevel } from '@google/genai'
import { genAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
import type {
  VideoPromptInput,
  VideoPromptResult,
  VideoAdPromptInput,
  VideoAdPromptResult,
  UGCPromptInput,
  UGCPromptResult,
  ProductScriptInput,
  ProductScriptResult,
  FirstFramePromptInput,
  FirstFramePromptResult,
  CameraCompositionType,
  ModelPoseType,
  OutfitPresetType,
  VideoType,
} from './types'
import { VIDEO_TYPE_SCRIPT_STYLES } from '@/lib/prompts/scripts'
import {
  NO_OVERLAY_ELEMENTS,
  HAND_DESCRIPTION_GUIDE,
  PRODUCT_GRIP_GUIDE,
  HAND_PRODUCT_CONTACT_GUIDE,
  LIGHTING_CONSISTENCY_GUIDE,
  GAZE_EXPRESSION_MATRIX,
  HAND_PRODUCT_EXAMPLES,
} from '@/lib/prompts/common'
import { VIDEO_TYPE_FIRST_FRAME_GUIDES } from '@/lib/prompts/first-frame'

// ============================================================
// Few-Shot 예시 및 검증 규칙
// ============================================================

/** 영상 프롬프트 표정/분위기 예시 (Few-Shot) */
const VIDEO_EXPRESSION_EXAMPLES = `
EXPRESSION/MOOD EXAMPLES:

GOOD (natural, subtle):
✓ "gentle smile with relaxed eye contact"
✓ "soft confident gaze, natural expression"
✓ "looking at product with genuine curiosity"
✓ "candid moment, caught mid-thought"

BAD (exaggerated, artificial):
✗ "big smile", "wide grin", "teeth showing"
✗ "excited expression", "enthusiastic pose"
✗ "overly cheerful", "dramatic reaction"
`.trim()

/** 영상 조명 예시 (Few-Shot) */
const VIDEO_LIGHTING_EXAMPLES = `
LIGHTING EXAMPLES:

GOOD (describe effect, not equipment):
✓ "soft natural daylight from left window"
✓ "warm golden hour glow creating gentle shadows"
✓ "diffused ambient light, even illumination"

BAD (equipment visible):
✗ "ring light illuminating face"
✗ "softbox setup", "LED panel"
✗ "studio lighting rig"
`.trim()

/** Self-Verification 체크리스트 */
const VIDEO_SELF_VERIFICATION = `
=== SELF-VERIFICATION (before responding) ===
Check your prompts:
✓ No product names or brand names?
✓ No "big smile", "wide grin", "teeth showing"?
✓ No lighting EQUIPMENT words (softbox, ring light, LED)?
✓ Has camera specs (lens, f/stop)?
✓ Word count appropriate (50-80 for image, max 800 for video)?
✓ HAND CHECK (if product present):
  - Finger count specified? (five fingers per hand)
  - Grip type described? (wrapped, pinch, palm, etc.)
  - Contact points mentioned? (thumb position, fingertips, palm)
  - Lighting consistent between avatar and product?
If any check fails, revise before responding.
`.trim()

/**
 * 범용 텍스트 생성 함수
 */
export async function generateText(prompt: string): Promise<string> {
  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })
  return response.text || ''
}

/**
 * 영상 광고용 프롬프트를 생성합니다.
 */
export async function generateVideoPrompt(input: VideoPromptInput): Promise<VideoPromptResult> {
  const durationDesc =
    input.duration === 5 ? '짧고 임팩트 있는 5초'
      : input.duration === 10 ? '적당한 길이의 10초'
        : '충분한 스토리를 담은 15초'

  const prompt = `당신은 영상 광고 프롬프트 전문가입니다. AI 영상 생성 모델(Wan 2.6)에 입력할 프롬프트를 만들어주세요.

제품 정보:
${input.productSummary}

영상 길이: ${durationDesc}
광고 스타일: ${input.style || '전문적이고 매력적인'}
${input.additionalInstructions ? `추가 요청: ${input.additionalInstructions}` : ''}

중요 지침:
1. 프롬프트는 영어로 작성하세요.
2. 첫 프레임은 제품/모델 이미지이므로, 그 이미지에서 시작하는 자연스러운 움직임을 묘사하세요.
3. ${input.duration}초 동안의 부드러운 모션을 설명하세요.
4. 텍스트, 글자, 로고는 포함하지 마세요.
5. 카메라 움직임, 조명 변화, 제품/모델의 동작을 구체적으로 묘사하세요.
6. 최대 800자 이내로 작성하세요.

${VIDEO_EXPRESSION_EXAMPLES}

${VIDEO_LIGHTING_EXAMPLES}

${VIDEO_SELF_VERIFICATION}`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  try {
    return JSON.parse(response.text || '') as VideoPromptResult
  } catch {
    return {
      prompt: `Professional product advertisement video. The product slowly rotates with soft studio lighting. Smooth camera movement reveals product details. High-quality commercial style. ${input.duration} seconds duration.`,
      negativePrompt: 'text, letters, words, watermark, logo, blurry, low quality, distorted',
    }
  }
}

/**
 * 영상 광고용 통합 프롬프트를 생성합니다.
 */
export async function generateVideoAdPrompts(input: VideoAdPromptInput): Promise<VideoAdPromptResult> {
  const durationDesc =
    input.duration === 5 ? 'short and impactful 5 seconds'
      : input.duration === 10 ? 'moderate length 10 seconds'
        : 'full story 15 seconds'

  const productInfoSection = input.productUrl
    ? `Product Info URL: ${input.productUrl}\nPlease retrieve and analyze the product information directly from the URL above.\n\nAdditional Product Info:\n${input.productInfo || 'None'}`
    : `Product Info:\n${input.productInfo || 'No information provided'}`

  let videoImageIndex = 1
  const videoProductImageIndex = input.productImageUrl ? videoImageIndex++ : null
  const videoAvatarImageIndex = input.avatarImageUrl ? videoImageIndex++ : null

  const imageReferenceSection = (input.productImageUrl || input.avatarImageUrl)
    ? `\n=== ATTACHED IMAGES GUIDE ===\n${videoProductImageIndex ? `[IMAGE${videoProductImageIndex}] = PRODUCT IMAGE\n- Reference as "the product in IMAGE${videoProductImageIndex}" in your prompt.` : ''}\n${videoAvatarImageIndex ? `[IMAGE${videoAvatarImageIndex}] = MODEL (AVATAR) IMAGE\n- Reference as "the model in IMAGE${videoAvatarImageIndex}" in your prompt.` : ''}`
    : ''

  const prompt = `You are a video advertisement expert. Analyze the product information and generate prompts for AI models.

${productInfoSection}
${imageReferenceSection}

Video Duration: ${durationDesc}
Ad Style: ${input.style || 'professional and attractive'}
${input.additionalInstructions ? `Additional Instructions: ${input.additionalInstructions}` : ''}

Generate TWO prompts:
1. **First Scene Image Prompt (firstScenePrompt)**: Seedream 4.5 optimized prompt (English, 50-80 words)
2. **Video Generation Prompt (videoPrompt)**: Wan 2.6 prompt (English, max 800 characters)

=== CRITICAL RULES ===
- NEVER include product names, brand names, or model names in the prompts.
- Product names often contain words that could be misinterpreted (e.g., "Mushroom" in a shoe name would cause AI to draw actual mushrooms).
- Instead of product names, use generic terms like "the product", "the item", or refer to the product image as "the product in IMAGE1".
- Focus on visual characteristics, actions, and composition rather than product identifiers.

${VIDEO_EXPRESSION_EXAMPLES}

${VIDEO_LIGHTING_EXAMPLES}

${VIDEO_SELF_VERIFICATION}`

  const tools = input.productUrl ? [{ urlContext: {} }, { googleSearch: {} }] : undefined

  const config: GenerateContentConfig = {
    tools,
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
  if (input.avatarImageUrl) {
    const imageData = await fetchImageAsBase64(input.avatarImageUrl)
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
    return JSON.parse(responseText) as VideoAdPromptResult
  } catch {
    return {
      productSummary: 'Product information has been analyzed.',
      firstScenePrompt: 'Hyper-realistic ad visual of a person confidently holding the product. Premium advertising aesthetic, optimized for social media.',
      videoPrompt: `Dynamic product advertisement video. ${input.duration} seconds duration.`,
      negativePrompt: 'text, letters, watermark, logo, blurry, low quality',
    }
  }
}

/**
 * UGC 영상용 프롬프트를 생성합니다.
 */
export async function generateUGCPrompts(input: UGCPromptInput): Promise<UGCPromptResult> {
  const durationDesc = input.duration === 5 ? 'short 5 seconds' : input.duration === 8 ? 'medium 8 seconds' : 'longer 12 seconds'
  const moodDesc = { friendly: 'relaxed, natural, casual', professional: 'confident, knowledgeable', energetic: 'excited, enthusiastic' }[input.mood || 'friendly']

  const productSection = input.productUrl
    ? `Product URL: ${input.productUrl}\n${input.productInfo || ''}`
    : `Product Info:\n${input.productInfo || 'No product information provided'}`

  const scriptSection = input.script ? `User Script: "${input.script}"` : 'No script provided - please generate a natural UGC-style script.'

  const prompt = `You are a UGC video expert. Create prompts for an authentic video.

${productSection}
${scriptSection}

Video Duration: ${durationDesc}
Mood/Tone: ${moodDesc}
${input.additionalInstructions ? `Additional: ${input.additionalInstructions}` : ''}

${VIDEO_EXPRESSION_EXAMPLES}

${VIDEO_LIGHTING_EXAMPLES}

Generate: productSummary (Korean), firstScenePrompt (English, gpt-image-1.5), videoPrompt (English, Seedance), suggestedScript (Korean, if no user script)

${VIDEO_SELF_VERIFICATION}`

  const tools = input.productUrl ? [{ urlContext: {} }, { googleSearch: {} }] : undefined

  const config: GenerateContentConfig = {
    tools,
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (input.avatarImageUrl) {
    const imageData = await fetchImageAsBase64(input.avatarImageUrl)
    if (imageData) {
      parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
    }
  }
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

  try {
    const result = JSON.parse(response.text || '') as UGCPromptResult
    if (input.script) result.suggestedScript = undefined
    return result
  } catch {
    return {
      productSummary: input.productInfo ? '제품 정보가 분석되었습니다.' : '일반 UGC 영상',
      firstScenePrompt: 'A person seated comfortably looking at camera with confident expression. Soft natural daylight. Sharp background. Ultra-realistic editorial photography.',
      videoPrompt: `A person speaks naturally to camera with subtle movements. ${input.duration} seconds of natural conversation.`,
      suggestedScript: input.script ? undefined : '안녕하세요! 오늘 정말 좋은 거 발견해서 공유하려고요.',
    }
  }
}

/**
 * 제품 설명 대본을 3가지 스타일로 생성합니다.
 */
export async function generateProductScripts(input: ProductScriptInput): Promise<ProductScriptResult> {
  const language = input.language || 'ko'

  const languageConfig: Record<string, { charsPerSecond: number; name: string; styleName: { formal: string; casual: string; energetic: string } }> = {
    ko: { charsPerSecond: 5.0, name: '한국어', styleName: { formal: '전문적', casual: '친근한', energetic: '활기찬' } },
    en: { charsPerSecond: 15.0, name: 'English', styleName: { formal: 'Professional', casual: 'Casual', energetic: 'Energetic' } },
    ja: { charsPerSecond: 5.0, name: '日本語', styleName: { formal: 'プロフェッショナル', casual: 'カジュアル', energetic: 'エネルギッシュ' } },
    zh: { charsPerSecond: 5.0, name: '中文', styleName: { formal: '专业', casual: '亲切', energetic: '活力' } },
  }

  const config_lang = languageConfig[language] || languageConfig.ko
  const targetChars = Math.round(input.durationSeconds * config_lang.charsPerSecond)

  const productSection = input.productUrl
    ? `Product URL: ${input.productUrl}\n${input.productInfo}`
    : `Product info:\n${input.productInfo}`

  // 비디오 타입별 스타일 가이드
  const videoType = input.videoType || 'UGC'
  const videoTypeStyle = VIDEO_TYPE_SCRIPT_STYLES[videoType]
  const videoTypeContext = videoTypeStyle
    ? `\n=== VIDEO STYLE: ${videoTypeStyle.korean} ===
Description: ${videoTypeStyle.description}

Script Guidelines:
${videoTypeStyle.scriptGuidelines.map(g => `- ${g}`).join('\n')}

Example Openings (for reference):
${videoTypeStyle.openingExamples.map(e => `- "${e}"`).join('\n')}

IMPORTANT: All 3 scripts should follow the "${videoTypeStyle.korean}" video style guidelines above.
`
    : ''

  // 의상 추천 섹션 (요청된 경우에만)
  const outfitRecommendationSection = input.requestOutfitRecommendation
    ? `
=== OUTFIT RECOMMENDATION (REQUIRED) ===
Based on the product and video style, recommend an appropriate outfit for the model.
${input.avatarDescription ? `Model info: ${input.avatarDescription}` : ''}
Consider:
- Product category and target audience
- Video style (${videoTypeStyle?.korean || 'UGC'})
- Overall brand image and mood

The outfit should complement the product without overshadowing it.
`
    : ''

  // 출력 형식 (의상 추천 포함 여부에 따라)
  const outfitOutputSection = input.requestOutfitRecommendation
    ? `,
  "recommendedOutfit": {
    "description": "English outfit description (e.g., 'casual white cotton t-shirt with light blue jeans')",
    "koreanDescription": "한국어 의상 설명",
    "reason": "의상 선택 이유 (한국어)"
  }`
    : ''

  const prompt = `You are an expert advertising copywriter. Write 3 style scripts for the product in ${config_lang.name}. Target: ~${targetChars} characters each.

${productSection}
${videoTypeContext}
${outfitRecommendationSection}

=== SCRIPT REQUIREMENTS ===
Styles to generate:
1. formal (professional/trustworthy tone)
2. casual (friendly/conversational tone)
3. energetic (enthusiastic/exciting tone)

Each script should:
- Maintain the overall video style (${videoTypeStyle?.korean || 'UGC'}) while varying in tone
- Be approximately ${targetChars} characters (${Math.round(targetChars / config_lang.charsPerSecond)}초 분량)
- Be written entirely in ${config_lang.name}
- Start with an engaging hook
- Include key product benefits
- End with a call-to-action

=== OUTPUT FORMAT (JSON) ===
{
  "productSummary": "제품의 핵심 특징 요약 (1-2문장)",
  "scripts": [
    {
      "style": "formal",
      "styleName": "${config_lang.styleName.formal}",
      "content": "스크립트 전체 내용 (${config_lang.name}으로 작성)",
      "estimatedDuration": ${input.durationSeconds}
    },
    {
      "style": "casual",
      "styleName": "${config_lang.styleName.casual}",
      "content": "스크립트 전체 내용",
      "estimatedDuration": ${input.durationSeconds}
    },
    {
      "style": "energetic",
      "styleName": "${config_lang.styleName.energetic}",
      "content": "스크립트 전체 내용",
      "estimatedDuration": ${input.durationSeconds}
    }
  ]${outfitOutputSection}
}

=== SELF-VERIFICATION ===
Before responding, check:
✓ All 3 scripts are written in ${config_lang.name}?
✓ Each script has different tone (formal/casual/energetic)?
✓ Each script is approximately ${targetChars} characters?${input.requestOutfitRecommendation ? '\n✓ Outfit recommendation included with English description, Korean description, and reason?' : ''}
✓ JSON format is valid and complete?`

  const tools = input.productUrl ? [{ urlContext: {} }, { googleSearch: {} }] : undefined

  const genConfig: GenerateContentConfig = {
    tools,
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
  }

  console.log('[generateProductScripts] 프롬프트 길이:', prompt.length)
  console.log('[generateProductScripts] 비디오 타입:', videoType, '언어:', language)

  let response
  try {
    response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: genConfig,
    })
    console.log('[generateProductScripts] Gemini 응답 성공, 응답 길이:', response.text?.length || 0)
  } catch (apiError) {
    console.error('[generateProductScripts] Gemini API 호출 실패:', apiError)
    throw apiError
  }

  try {
    const result = JSON.parse(response.text || '') as ProductScriptResult
    console.log('[generateProductScripts] JSON 파싱 성공, 스크립트 수:', result.scripts?.length || 0)
    return result
  } catch (parseError) {
    console.error('[generateProductScripts] JSON 파싱 실패:', parseError)
    console.error('[generateProductScripts] Gemini 응답 텍스트:', response.text?.substring(0, 500))
    const result: ProductScriptResult = {
      productSummary: '제품 정보가 분석되었습니다.',
      scripts: [
        { style: 'formal', styleName: config_lang.styleName.formal, content: '안녕하세요. 오늘 소개해드릴 제품입니다.', estimatedDuration: input.durationSeconds },
        { style: 'casual', styleName: config_lang.styleName.casual, content: '안녕하세요! 정말 좋은 제품 소개해드릴게요.', estimatedDuration: input.durationSeconds },
        { style: 'energetic', styleName: config_lang.styleName.energetic, content: '여러분! 이거 진짜 대박이에요!', estimatedDuration: input.durationSeconds },
      ],
    }
    if (input.requestOutfitRecommendation) {
      result.recommendedOutfit = {
        description: 'casual white cotton t-shirt with light blue jeans',
        koreanDescription: '캐주얼한 흰색 티셔츠와 라이트 블루 청바지',
        reason: '자연스럽고 깔끔한 캐주얼 스타일입니다.',
      }
    }
    return result
  }
}

// 카메라 구도 설명 (영상 스타일별로 최적화된 프롬프트)
const cameraCompositionDescriptions: Record<CameraCompositionType, string> = {
  // 공통
  closeup: 'close-up portrait framing, face and upper chest, intimate conversational distance',
  // UGC용 (셀카 스타일) - 자연스럽고 친근한 느낌
  'selfie-high': 'high angle selfie perspective, camera looking down from above, flattering casual angle',
  'selfie-front': 'eye-level frontal selfie view, direct eye contact, natural smartphone distance',
  'selfie-side': 'three-quarter selfie angle, showing facial contours, casual authentic vibe',
  'ugc-closeup': 'UGC influencer style medium close-up, chest-up framing, casual and approachable feel',
  'ugc-selfie': 'POV selfie shot, subject looking at camera, NO phone visible, natural relaxed pose, anatomically correct hands',
  // Podcast용 (웹캠/데스크 스타일) - 대화형, 편안한 전문성
  webcam: 'webcam-style frontal view, desktop setup distance, conversational podcast framing',
  'medium-shot': 'medium shot showing upper body from waist up, balanced composition, professional yet casual',
  'three-quarter': 'three-quarter angle view, slight turn adding depth and visual interest, engaging perspective',
  // Expert용 (전문가 스타일) - 권위있고 신뢰감
  tripod: 'stable tripod-mounted frontal shot, professional broadcast quality, authoritative framing',
  fullbody: 'full body shot showing entire person, suitable for demonstrations and presentations',
  presenter: 'professional presenter framing, confident stance, TED-talk style composition, authority position',
}

// 모델 포즈 설명 (영상 스타일별로 최적화 + 손 묘사 강화)
const modelPoseDescriptions: Record<ModelPoseType, string> = {
  // 공통
  'talking-only': '⚠️ NO PRODUCT IN IMAGE! Model only, natural conversational pose with EMPTY HANDS relaxed at sides or gesturing naturally, all five fingers visible and anatomically correct, no objects held',
  'showing-product': 'Model presenting product towards camera - ONE hand wrapped around product with thumb on front and four fingers behind, product angled 15° toward camera, other hand may support from below with open palm',
  // UGC용 - 자연스럽고 진정성 있는 포즈 (손 묘사 강화)
  'holding-product': 'Model holding product naturally at chest level - relaxed grip with all five fingers gently curved around product, thumb visible on front surface, fingertips making natural contact, casual authentic vibe',
  'using-product': 'Model actively demonstrating product use - fingers interacting naturally with product (pressing, applying, opening), anatomically correct hand positioning, genuine engagement shown through hand movement',
  unboxing: 'Model opening/unboxing product - both hands visible with fingers working on packaging, one hand stabilizing box while other hand lifts/pulls, excited discovery expression, all ten fingers clearly rendered',
  reaction: 'Model showing genuine reaction to product - product held loosely in one hand at mid-chest, other hand may touch face or gesture, expressive authentic enthusiasm, relaxed finger positioning',
  // Podcast용 - 대화형 프레젠터 스타일 (손 묘사 강화)
  'desk-presenter': 'Model seated at desk - product placed on desk surface within reach, one hand resting near product with fingers relaxed, other hand may gesture while speaking, casual professional demeanor',
  'casual-chat': 'Model in relaxed conversational pose - if holding product, loose one-hand grip at table level, fingers naturally wrapped, other hand gesturing openly, friendly approachable vibe',
  // Expert용 - 권위있는 전문가 스타일 (손 묘사 강화)
  demonstrating: 'Model professionally demonstrating product - secure two-hand hold with fingers positioned to NOT obscure product features, thumbs on top, palms supporting from sides/below, educational pointing gestures',
  presenting: 'Model in confident presenter stance - product held at optimal viewing angle with deliberate grip, four fingers wrapped behind and thumb in front, arm slightly extended toward camera, authoritative yet approachable',
  explaining: 'Model in thoughtful explanation pose - product cradled in open palm or held loosely, occasional hand gestures toward product features, engaged knowledgeable expression, trustworthy demeanor',
}

// 의상 프리셋 설명
const outfitPresetDescriptions: Record<OutfitPresetType, string> = {
  casual_everyday: 'casual t-shirt with jeans',
  formal_elegant: 'elegant dress or formal wear',
  professional_business: 'professional business attire',
  sporty_athletic: 'athletic wear',
  cozy_comfortable: 'cozy sweater or cardigan',
  trendy_fashion: 'trendy fashion style',
  minimal_simple: 'minimal solid color outfit',
}

/**
 * 첫 프레임 이미지 생성용 프롬프트를 생성합니다.
 */
export async function generateFirstFramePrompt(input: FirstFramePromptInput): Promise<FirstFramePromptResult> {
  // 비디오 타입별 스타일 가이드
  const videoType = input.videoType || 'UGC'
  const videoTypeGuide = VIDEO_TYPE_FIRST_FRAME_GUIDES[videoType]

  // 장소: 사용자 지정 > 비디오 타입 기본값
  const locationSection = input.locationPrompt
    ? `Location: ${input.locationPrompt}`
    : `Location: ${videoTypeGuide.environmentPrompt}`

  const cameraSection = input.cameraComposition
    ? `Camera: ${cameraCompositionDescriptions[input.cameraComposition]}`
    : ''

  // 포즈: 사용자 지정 > 비디오 타입 기본값
  const poseSection = input.modelPose
    ? `Pose: ${modelPoseDescriptions[input.modelPose]}`
    : `Pose: ${videoTypeGuide.posePrompt}`

  // UGC 셀카 + 제품 포즈 조합 시 특별 지시
  const isUgcSelfie = input.cameraComposition === 'ugc-selfie'
  const isProductPose = input.modelPose === 'holding-product' || input.modelPose === 'showing-product'
  const ugcSelfieProductInstruction = isUgcSelfie && isProductPose
    ? `\nCRITICAL UGC SELFIE RULE (POV SHOT):
- POV selfie: camera IS the smartphone (no phone device visible in image)
- Natural relaxed pose presenting product at chest level
- anatomically correct hands`
    : ''

  let outfitSection = ''
  if (input.outfitCustom) {
    outfitSection = `Outfit: ${input.outfitCustom}`
  } else if (input.outfitPreset) {
    outfitSection = `Outfit: ${outfitPresetDescriptions[input.outfitPreset]}`
  }

  // 표정 섹션 (프리셋에서 전달된 프롬프트 사용)
  const expressionSection = input.expressionPrompt
    ? `Expression: ${input.expressionPrompt}`
    : ''

  // 조명 섹션 (프리셋에서 전달된 프롬프트 사용)
  const lightingSection = input.lightingPrompt
    ? `Lighting: ${input.lightingPrompt}`
    : ''

  // 비디오 타입별 분위기 가이드
  const atmosphereSection = `Atmosphere: ${videoTypeGuide.atmospherePrompt}`

  // 비디오 타입별 표정 가이드 (새로 추가)
  const expressionGuideSection = videoTypeGuide.expressionGuide
    ? `Expression Guide (${videoType}): ${videoTypeGuide.expressionGuide}`
    : ''

  // 비디오 타입별 카메라 느낌 힌트 (새로 추가)
  const cameraHintSection = videoTypeGuide.cameraMovementHint
    ? `Camera Feel: ${videoTypeGuide.cameraMovementHint}`
    : ''

  // 비디오 타입별 손+제품 가이드 (새로 추가)
  const videoTypeHandGuide = input.productImageUrl && videoTypeGuide.handProductGuide
    ? `Hand+Product Style (${videoType}): ${videoTypeGuide.handProductGuide}`
    : ''

  // 성별별 체형 설명 매핑 (영어 - 이미지 생성 모델 최적화)
  const femaleBodyTypeMap: Record<string, string> = {
    slim: 'slim slender feminine silhouette with delicate proportions',
    average: 'balanced feminine proportions with natural curves',
    athletic: 'toned athletic feminine build with defined musculature',
    curvy: 'feminine silhouette with natural soft curves',
    plussize: 'full-figured feminine form with generous proportions',
  }
  const maleBodyTypeMap: Record<string, string> = {
    slim: 'lean masculine frame with slender proportions',
    average: 'balanced masculine build with standard proportions',
    athletic: 'toned athletic masculine physique with defined muscles',
    curvy: 'solid masculine build with broader frame',
    plussize: 'full masculine frame with generous build',
  }
  const defaultBodyTypeMap: Record<string, string> = {
    slim: 'slim slender build with delicate frame',
    average: 'balanced proportions with natural build',
    athletic: 'toned athletic build with defined physique',
    curvy: 'naturally curved silhouette with soft proportions',
    plussize: 'full-figured build with generous proportions',
  }

  // 성별에 따른 체형 설명 반환
  const getBodyTypeDescription = (bodyType: string, gender?: string): string => {
    if (gender === 'female') {
      return femaleBodyTypeMap[bodyType] || bodyType
    } else if (gender === 'male') {
      return maleBodyTypeMap[bodyType] || bodyType
    }
    return defaultBodyTypeMap[bodyType] || bodyType
  }

  // 체형 정보 (일관성 유지용) - 성별에 맞는 체형 설명 사용
  const bodyTypeDescription = input.bodyType
    ? getBodyTypeDescription(input.bodyType, input.avatarGender)
    : ''
  const bodyTypeSection = bodyTypeDescription
    ? `Body type to maintain: ${bodyTypeDescription}`
    : ''

  // 아바타 섹션 - 외모 묘사 없이 Figure 1만 참조
  const avatarSection = `Avatar: Use the model from Figure 1.
${bodyTypeSection}
CRITICAL: Do NOT describe the avatar's appearance (no hair, face, skin descriptions). Just refer to "the model from Figure 1".`

  // 제품이 있을 때만 손+제품 가이드 포함
  const handProductGuideSection = input.productImageUrl
    ? `
=== NATURAL HAND + PRODUCT GUIDE (CRITICAL FOR REALISM) ===
${HAND_DESCRIPTION_GUIDE}

${PRODUCT_GRIP_GUIDE}

${HAND_PRODUCT_CONTACT_GUIDE}

${LIGHTING_CONSISTENCY_GUIDE}

${GAZE_EXPRESSION_MATRIX}

${HAND_PRODUCT_EXAMPLES}
`
    : ''

  const prompt = `Generate Seedream 4.5 first frame image prompt.

VIDEO STYLE: ${VIDEO_TYPE_SCRIPT_STYLES[videoType]?.korean || 'UGC 스타일'}
${atmosphereSection}
${expressionGuideSection}
${cameraHintSection}
${videoTypeHandGuide}

${avatarSection}
Product context (for understanding only - DO NOT include product name/brand in prompt): ${input.productInfo}
${locationSection}
${cameraSection}
${poseSection}${ugcSelfieProductInstruction}
${outfitSection}
${expressionSection}
${lightingSection}

${NO_OVERLAY_ELEMENTS}
${handProductGuideSection}
CRITICAL RULES:
1. For AVATAR: ONLY use "the model from Figure 1". Do NOT describe facial features, hair, skin tone, or ethnicity.
2. For PRODUCT: ONLY use "the product from Figure 2" or "the product". NEVER include product name or brand name.
3. The image should reflect the "${VIDEO_TYPE_SCRIPT_STYLES[videoType]?.korean || 'UGC'}" video style atmosphere.
${bodyTypeDescription ? `4. Maintain ${bodyTypeDescription} body type consistently.` : ''}
${input.productImageUrl
    ? `5. HAND REALISM: Describe hand grip with specific finger positions, contact points, and consistent lighting between avatar and product.
Create photorealistic prompt using "the model from Figure 1" for avatar, "the product from Figure 2" for product.`
    : 'Create photorealistic prompt using "the model from Figure 1" for avatar. ⚠️ NO PRODUCT should appear - avatar only with empty hands.'}

${VIDEO_EXPRESSION_EXAMPLES}

${VIDEO_LIGHTING_EXAMPLES}

Include: camera specs, lighting direction, quality tags, AND detailed hand grip description if product is present.
Output JSON: { "prompt": "English 50-80 words", "locationDescription": "Korean location description" }

${VIDEO_SELF_VERIFICATION}`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  const avatarData = await fetchImageAsBase64(input.avatarImageUrl)
  if (avatarData) {
    parts.push({ inlineData: { mimeType: avatarData.mimeType, data: avatarData.base64 } })
  }

  if (input.productImageUrl) {
    const productData = await fetchImageAsBase64(input.productImageUrl)
    if (productData) {
      parts.push({ inlineData: { mimeType: productData.mimeType, data: productData.base64 } })
    }
  }

  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  try {
    return JSON.parse(response.text || '') as FirstFramePromptResult
  } catch {
    return {
      prompt: 'Place the model from Figure 1 in a modern living room. Soft natural daylight. Shot on Sony A7IV, 35mm f/8. Hyperrealistic photograph, 8K quality.',
      locationDescription: '모던한 거실',
    }
  }
}
