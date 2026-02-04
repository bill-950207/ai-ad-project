/**
 * 이미지 광고 프롬프트 생성 v2
 *
 * 개선사항:
 * - 시스템 프롬프트 간결화 (중복 제거, 핵심 유지)
 * - 후처리 최소화 (누락 시에만 추가)
 * - 출력 프롬프트 60-80 words 명확화
 *
 * 보존된 핵심 요소:
 * - Figure 참조 시스템
 * - 조명 효과 규칙 (장비 언급 금지)
 * - 모델 표정 가이드 (AI 스마일 방지)
 * - 제품 외관 보존
 * - 로고 분석 및 처리
 * - 오버레이 방지
 * - 체형 보존
 */

import { GenerateContentConfig, MediaResolution, ThinkingLevel } from '@google/genai'
import { getGenAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
import type { ImageAdType, ImageAdPromptInput, ImageAdPromptResult, AvatarCharacteristics } from './types'

// ============================================================
// 상수 정의
// ============================================================

/** 광고 유형별 상세 가이드라인 */
const AD_TYPE_DESCRIPTIONS: Record<ImageAdType, string> = {
  productOnly: `Product Only (NO MODEL):
- Hero shot: Product centered, dramatic lighting from 45° angle
- Composition: Rule of thirds or centered, clean negative space
- Background: Solid gradient, contextual surface (marble, wood, fabric)
- Focus: Full product sharpness, every detail crisp
- Lighting: Rim light for separation, soft fill to show texture
- Props: Minimal, complementary items only (leaves, droplets, fabric swatches)
- Camera: 50mm macro or 85mm, f/11-f/16 for full sharpness`,

  holding: `Holding Shot (MODEL + PRODUCT):
- Product position: Chest to face level, clearly visible to camera
- Hand grip: Natural hold, fingers NOT covering product label/key features
- Both in focus: Model face AND product sharp (f/11)
- Product angle: Show front/main side of product to camera
- Model engagement: Looking at camera OR looking at product with interest
- Avoid: Awkward grip, product too small in frame, hidden product features
- Camera: 85mm portrait lens, eye-level or slightly above`,

  using: `Using Shot (ACTIVE PRODUCT INTERACTION):
- Capture the ACTION moment of product use:
  • Cosmetics: Applying to lips/skin, mid-application motion
  • Skincare: Dispensing product, spreading on face/hands
  • Beverage: Drinking, pouring, holding near lips
  • Electronics: Actively operating, screen visible if relevant
- Show EFFECT: Product texture visible, application result
- Expression: Focused on action OR enjoying the experience
- Timing: Mid-action preferred (not before/after, but DURING)
- Camera: 50-85mm, capture both face and product interaction`,

  wearing: `Wearing Shot (FASHION/WEARABLE):
- Full visibility: Entire garment/accessory clearly shown
- Pose types:
  • Full body: Standing, walking, seated - show complete outfit
  • Detail: Close-up of accessory, texture, craftsmanship
- Movement: Can be static (editorial) or dynamic (walking, turning)
- Fit showcase: How product drapes, fits, moves with body
- Context: Clean seamless backdrop (no visible equipment) OR lifestyle setting
- For accessories: Ensure item is hero, not lost in outfit
- Camera: 35mm for full body, 85mm for detail shots`,

  lifestyle: `Lifestyle Shot (NATURAL SCENE):
- Setting: Real environment (home, cafe, outdoor, office)
- Product integration: Naturally placed, not forced or obvious
- Candid feel: Model appears caught in genuine moment
- Story element: Scene tells a story about product usage context
- Product visibility: Clear but not artificially highlighted
- Environment details: Lived-in, authentic props and setting
- Mood: Matches product's target lifestyle (cozy, active, professional)
- Camera: 35mm environmental, natural ambient lighting`,

  unboxing: `Unboxing Shot (PRODUCT REVEAL):
- Packaging visible: Box/container is part of the composition
- Reveal moment: Product emerging or just revealed from packaging
- Hands in frame: Natural unboxing gesture, anticipation
- Expression: Excitement, curiosity, pleasant surprise
- Composition: Both packaging and product visible
- Premium feel: Clean presentation, organized reveal
- Lighting: Even, shows both package design and product
- Camera: 50mm, slightly overhead angle`,

  seasonal: `Seasonal/Theme Shot (THEMED ATMOSPHERE):
- Theme elements: Season-appropriate props and colors
  • Spring: Flowers, pastels, fresh greenery
  • Summer: Bright light, outdoor, vibrant colors
  • Autumn: Warm tones, leaves, cozy textures
  • Winter: Cool tones, holiday elements, warm lighting
  • Holiday: Specific decorations (Christmas, Valentine's, etc.)
- Color palette: Cohesive with seasonal theme
- Product integration: Product fits naturally in themed scene
- Atmosphere: Strong mood that evokes the season/occasion
- Camera: Varies by scene, prioritize atmosphere`,
}

/** 조명 규칙 (포지티브 지시 중심 + Few-Shot 예시) */
const LIGHTING_RULES = `
LIGHTING (CRITICAL - describe EFFECT, not equipment):

GOOD examples:
✓ "soft warm light from upper left creating gentle shadows"
✓ "natural window light streaming from the right"
✓ "golden hour glow with rim lighting from behind"

BAD examples (NEVER use):
✗ "softbox on the left", "ring light illuminating"
✗ "studio lights around the model", "LED panel setup"
✗ "lighting rig", "reflector panel", "studio equipment"

Scene = FINAL PHOTOGRAPH, not behind-the-scenes.
`.trim()

/** 표정 가이드 (구체적 묘사 + Few-Shot 예시) */
const EXPRESSION_GUIDE = `
EXPRESSION (CRITICAL - NO forced smile):

GOOD examples (natural, neutral):
✓ "calm natural expression with relaxed eye contact"
✓ "soft confident gaze, neutral resting expression"
✓ "looking at product with genuine curiosity, candid moment"
✓ "relaxed approachable look"

BAD examples (NEVER use - forced/artificial):
✗ "big smile", "wide grin", "teeth showing", "beaming"
✗ "excited expression", "overly cheerful", "enthusiastic smile"
✗ "friendly smile", "warm smile" (too forced)

Use: "calm", "relaxed", "soft", "subtle", "candid", "natural", "neutral"
AVOID: smile, grin, cheerful (unless user specifically requests)
`.trim()

/** 제품 보존 규칙 */
const PRODUCT_PRESERVATION = `
PRODUCT APPEARANCE: Must be IDENTICAL to reference.
- Preserve exact COLOR (hue, saturation, tone)
- Preserve exact SHAPE and FORM
- Preserve exact TEXTURE (glossy, matte, transparent)
- DO NOT modify, stylize, or "improve"
`.trim()

/** 로고 처리 규칙 (Chain-of-Thought) */
const LOGO_RULES = `
PRODUCT SURFACE ANALYSIS (Step-by-step):
1. EXAMINE: Look closely at product image - are there ANY visible logos, text, labels, barcodes?
2. DECIDE: Set productHasLogo = true (has markings) or false (clean surface)
3. APPLY:
   - If true → "reproduce ONLY existing markings, DO NOT add new"
   - If false → "product surface is CLEAN - DO NOT ADD any logos, text, barcodes, QR codes"
`.trim()

/** 오버레이 방지 (통합) */
const NO_OVERLAYS = `
OUTPUT: Pure photograph ONLY.
NO logo banners, text overlays, barcodes, QR codes, price tags, frames, borders, watermarks, UI elements.
`.trim()

/** 의상 옵션 → 프롬프트 텍스트 매핑 */
const OUTFIT_DESCRIPTIONS: Record<string, string> = {
  keep_original: '', // 원본 의상 유지 시 프롬프트 추가 안함
  casual_everyday: 'wearing casual everyday outfit: comfortable t-shirt or blouse with jeans, relaxed and approachable style',
  formal_elegant: 'wearing formal elegant outfit: sophisticated dress or tailored suit, refined and polished appearance',
  professional_business: 'wearing professional business attire: crisp blazer with dress shirt, polished and authoritative look',
  sporty_athletic: 'wearing sporty athletic wear: comfortable activewear or athleisure, energetic and dynamic style',
  cozy_comfortable: 'wearing cozy comfortable clothing: soft knit sweater or cardigan, warm and inviting appearance',
  trendy_fashion: 'wearing trendy fashion-forward outfit: current season styles, stylish and on-trend look',
  minimal_simple: 'wearing minimal simple outfit: clean solid-colored clothing without busy patterns, understated elegance',
}

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * 제품 카테고리 감지
 */
function detectProductCategory(description?: string): string {
  if (!description) return 'product'

  const desc = description.toLowerCase()

  // 화장품/뷰티
  if (desc.includes('립') || desc.includes('tint') || desc.includes('lipstick')) return 'lip cosmetic'
  if (desc.includes('스킨') || desc.includes('skincare') || desc.includes('serum') || desc.includes('cream') || desc.includes('lotion')) return 'skincare product'
  if (desc.includes('화장품') || desc.includes('cosmetic') || desc.includes('makeup')) return 'cosmetic'

  // 패션
  if (desc.includes('신발') || desc.includes('shoes') || desc.includes('sneaker')) return 'footwear'
  if (desc.includes('옷') || desc.includes('의류') || desc.includes('clothing') || desc.includes('shirt') || desc.includes('dress')) return 'clothing'
  if (desc.includes('가방') || desc.includes('bag') || desc.includes('purse')) return 'bag'
  if (desc.includes('시계') || desc.includes('watch')) return 'watch'
  if (desc.includes('주얼리') || desc.includes('jewelry') || desc.includes('necklace') || desc.includes('ring')) return 'jewelry'

  // 식품
  if (desc.includes('음료') || desc.includes('drink') || desc.includes('beverage')) return 'beverage'
  if (desc.includes('음식') || desc.includes('food') || desc.includes('snack')) return 'food'

  // 전자기기
  if (desc.includes('폰') || desc.includes('phone') || desc.includes('전자')) return 'electronics'

  return 'product'
}

/**
 * 의상 옵션에서 프롬프트 텍스트 추출
 */
function getOutfitInstruction(selectedOptions?: Record<string, unknown>): string {
  if (!selectedOptions) return ''

  const outfitKey = selectedOptions.outfit as string | undefined
  if (!outfitKey || outfitKey === 'keep_original') return ''

  // 커스텀 의상인 경우
  if (outfitKey === '__custom__' && selectedOptions.outfitCustom) {
    return `wearing ${selectedOptions.outfitCustom as string}`
  }

  return OUTFIT_DESCRIPTIONS[outfitKey] || ''
}

/**
 * 체형 설명 포맷팅
 */
function formatBodyType(characteristics?: AvatarCharacteristics): string {
  if (!characteristics?.bodyType) return ''

  const isFemale = characteristics.gender === 'female'
  const isMale = characteristics.gender === 'male'

  // 키
  const heightDesc = characteristics.height === 'short' ? 'petite'
    : characteristics.height === 'tall' ? 'tall' : ''

  // 체형
  const bodyTypeMap: Record<string, { female: string; male: string; default: string }> = {
    slim: { female: 'slim feminine silhouette', male: 'lean masculine frame', default: 'slim build' },
    average: { female: 'balanced feminine proportions', male: 'balanced masculine build', default: 'average build' },
    athletic: { female: 'toned athletic feminine build', male: 'athletic masculine physique', default: 'athletic build' },
    curvy: { female: 'feminine silhouette with natural curves', male: 'solid masculine build', default: 'curved build' },
    plussize: { female: 'full-figured feminine form', male: 'full masculine frame', default: 'full-figured build' },
  }

  const bodyDesc = bodyTypeMap[characteristics.bodyType]
  const bodyPart = bodyDesc
    ? (isFemale ? bodyDesc.female : isMale ? bodyDesc.male : bodyDesc.default)
    : ''

  return [heightDesc, bodyPart].filter(Boolean).join(', ')
}

/**
 * Figure 참조 정보 생성
 */
interface FigureInfo {
  guide: string
  modelRef: string
  productRef: string
  modelFigureNum: number | null
  productFigureNum: number | null
  needsModel: boolean  // 모델이 필요한 광고인지 여부
}

function buildFigureInfo(input: ImageAdPromptInput, avatarGender: string, productCategory: string): FigureInfo {
  const hasAvatar = input.avatarImageUrls && input.avatarImageUrls.length > 0
  const hasAiAvatar = !!input.aiAvatarDescription  // AI 생성 아바타 여부
  const hasOutfit = !!input.outfitImageUrl
  const hasProduct = !!input.productImageUrl
  const hasStyle = !!input.referenceStyleImageUrl

  // 모델이 필요한 광고인지 확인
  // - productOnly: 모델 불필요
  // - seasonal + 아바타 없음: 모델 불필요 (제품만 나옴)
  // - 그 외: 모델 필요
  const isSeasonalWithoutAvatar = input.adType === 'seasonal' && !hasAvatar && !hasAiAvatar
  const needsModel = input.adType !== 'productOnly' && !isSeasonalWithoutAvatar

  let figNum = 1
  const descriptions: string[] = []
  const rules: string[] = []

  let modelFigureNum: number | null = null
  let productFigureNum: number | null = null
  let modelRef = ''
  let productRef = 'the product'

  if (hasAvatar) {
    // 실제 아바타 이미지 참조
    modelFigureNum = figNum
    descriptions.push(`- Figure ${figNum}: ${avatarGender} reference`)
    rules.push(`- Model = "the ${avatarGender} from Figure ${figNum}" (NO physical descriptions)`)
    modelRef = `the ${avatarGender} from Figure ${figNum}`
    figNum++
  } else if (hasAiAvatar) {
    // AI 생성 아바타 - Figure 참조 없이 텍스트 설명 사용
    modelRef = `a photorealistic ${input.aiAvatarDescription}`
    rules.push(`- Model = AI-generated (described in AI MODEL section)`)
  } else if (needsModel) {
    // 아바타 없지만 모델이 필요한 경우 (holding, using 등) - 기본값
    modelRef = 'the model'
  }
  // seasonal + 아바타 없음: modelRef는 빈 문자열 (제품만 나옴)

  if (hasOutfit) {
    descriptions.push(`- Figure ${figNum}: Outfit reference`)
    rules.push(`- Wear EXACT outfit from Figure ${figNum}`)
    figNum++
  }

  if (hasProduct) {
    productFigureNum = figNum
    descriptions.push(`- Figure ${figNum}: ${productCategory} reference`)
    rules.push(`- Product = "the ${productCategory} from Figure ${figNum}" (NO brand names)`)
    productRef = `the ${productCategory} from Figure ${figNum}`
    figNum++
  }

  if (hasStyle) {
    descriptions.push(`- Figure ${figNum}: Style reference (mood/lighting only)`)
    figNum++
  }

  const guide = descriptions.length > 0 || hasAiAvatar
    ? `=== ATTACHED IMAGES ===
${descriptions.length > 0 ? descriptions.join('\n') : '(No avatar reference - AI will generate model)'}

REFERENCE RULES:
${rules.join('\n')}`
    : ''

  return { guide, modelRef, productRef, modelFigureNum, productFigureNum, needsModel }
}

/**
 * 이미지 파트 빌드
 */
async function buildImageParts(input: ImageAdPromptInput): Promise<Array<{ inlineData: { mimeType: string; data: string } }>> {
  const parts: Array<{ inlineData: { mimeType: string; data: string } }> = []
  const urls: string[] = []

  // 순서: avatar → outfit → product → style
  if (input.avatarImageUrls?.length) urls.push(...input.avatarImageUrls)
  if (input.outfitImageUrl) urls.push(input.outfitImageUrl)
  if (input.productImageUrl) urls.push(input.productImageUrl)
  if (input.referenceStyleImageUrl) urls.push(input.referenceStyleImageUrl)

  for (const url of urls) {
    const imageData = await fetchImageAsBase64(url)
    if (imageData) {
      parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
    }
  }

  return parts
}

/**
 * 프롬프트 후처리 (누락 시에만 추가)
 */
function postProcessPrompt(prompt: string, hasLogo: boolean | undefined, adType: ImageAdType): string {
  const lowerPrompt = prompt.toLowerCase()
  const wordCount = prompt.split(/\s+/).length

  // 이미 충분히 길면 추가하지 않음 (Seedream 4.5 권장: 60-80 words)
  if (wordCount > 80) return prompt

  const additions: string[] = []

  // 로고 없는 제품인데 "clean" 또는 "no logo" 언급 없으면 추가
  if (hasLogo === false) {
    if (!lowerPrompt.includes('clean') && !lowerPrompt.includes('no logo') && !lowerPrompt.includes('no markings')) {
      additions.push('Product surface clean, no added markings.')
    }
  }

  // holding 타입인데 "identical" 또는 "same" 언급 없으면 추가
  if (adType === 'holding') {
    if (!lowerPrompt.includes('identical') && !lowerPrompt.includes('same surface') && !lowerPrompt.includes('exact')) {
      additions.push('Product identical to reference.')
    }
  }

  // "photograph" 또는 "no overlay" 언급 없으면 추가
  if (!lowerPrompt.includes('photograph') && !lowerPrompt.includes('no overlay') && !lowerPrompt.includes('pure photo')) {
    additions.push('Pure photograph.')
  }

  // "commercial" 또는 "brand campaign" 언급 없으면 추가
  if (!lowerPrompt.includes('commercial') && !lowerPrompt.includes('brand campaign') && !lowerPrompt.includes('advertisement')) {
    additions.push('Commercial photography quality.')
  }

  // 카메라 스펙 없으면 추가 (모든 타입 f/11 통일)
  if (!lowerPrompt.includes('shot on') && !lowerPrompt.includes('lens') && !lowerPrompt.includes('f/')) {
    if (adType === 'productOnly') {
      additions.push('Shot on 50mm macro lens at f/11.')
    } else if (adType === 'holding' || adType === 'using') {
      additions.push('Shot on 85mm lens at f/11.')
    } else {
      additions.push('Shot on 85mm lens at f/11.')
    }
  }

  // 품질 키워드 없으면 추가 (타입별 분기)
  if (!lowerPrompt.includes('photorealistic') && !lowerPrompt.includes('8k')) {
    if (adType === 'productOnly') {
      additions.push('Photorealistic product photography, every detail crisp.')
    } else if (!lowerPrompt.includes('skin texture')) {
      additions.push('Photorealistic, natural skin texture.')
    }
  }

  return additions.length > 0 ? `${prompt} ${additions.join(' ')}` : prompt
}

// ============================================================
// 메인 함수
// ============================================================

/**
 * 이미지 광고 프롬프트 생성 (v2)
 */
export async function generateImageAdPromptV2(input: ImageAdPromptInput): Promise<ImageAdPromptResult> {
  // 기본 정보 추출
  const productCategory = detectProductCategory(input.productDescription)
  const avatarGender = input.avatarCharacteristics?.gender === 'female' ? 'female model'
    : input.avatarCharacteristics?.gender === 'male' ? 'male model' : 'model'
  const bodyHint = formatBodyType(input.avatarCharacteristics)
  const figureInfo = buildFigureInfo(input, avatarGender, productCategory)

  // 체형 보존 지시 (모델이 필요한 광고이고 체형 정보가 있을 때만)
  const bodyInstruction = (figureInfo.needsModel && bodyHint)
    ? `\n=== BODY PRESERVATION ===
Body type: ${bodyHint}
- Preserve EXACT proportions from avatar reference
- DO NOT exaggerate or enhance body features
- Keep proportions IDENTICAL to reference`
    : ''

  // AI 아바타 지시 (모델이 필요한 광고이고 AI 생성 아바타일 때만)
  const aiAvatarInstruction = (figureInfo.needsModel && input.aiAvatarDescription)
    ? `\n=== AI MODEL ===
Generate photorealistic model: ${input.aiAvatarDescription}

CRITICAL OUTFIT RULE:
- The model MUST be wearing a COMPLETE outfit (both upper body AND lower body clothing)
- NEVER describe only upper body clothing (e.g., "jacket" alone) - ALWAYS include pants/skirt/bottom
- For WEARING ad type: The product is the main clothing item; describe COORDINATING pieces
- Format: "[upper body item] with [lower body item] and [footwear]"
- AVOID: Describing only one piece of clothing without full outfit`
    : ''

  // 의상 지시 (모델이 필요한 광고이고, 의상 이미지가 없고, 의상 옵션이 선택된 경우)
  // wearing 타입에서는 제품 자체가 착용 아이템이므로 outfit 옵션은 코디네이팅 의상을 의미
  const outfitText = getOutfitInstruction(input.selectedOptions)
  const outfitInstruction = (figureInfo.needsModel && !input.outfitImageUrl && outfitText)
    ? `\n=== OUTFIT ===
Model ${outfitText}.
- Apply this outfit style naturally
- Outfit should complement the product and scenario mood${input.adType === 'wearing' ? `
- IMPORTANT for WEARING ad: The outfit option above describes COORDINATING clothing (pants, shoes, accessories, etc.) to pair with the advertised product.
- The advertised product (from product reference image) must be the MAIN worn item and clearly visible as the hero piece.
- Example: If product is a jacket, the outfit option describes what pants/shoes to wear WITH the jacket.` : ''}`
    : ''

  // 모델 불포함 지시 (productOnly 또는 seasonal+아바타없음일 때)
  const noModelInstruction = !figureInfo.needsModel
    ? `\n=== CRITICAL: PRODUCT ONLY MODE ===
⚠️ This is a PRODUCT-ONLY advertisement. DO NOT include:
- Any human model, person, or human body parts
- Hands, fingers, arms, or any human limbs
- Human silhouettes or figures
- Any suggestion of human presence

The product must be the SOLE subject. Use props, backgrounds, and seasonal elements ONLY.
Violation of this rule will result in rejection.`
    : ''

  // seasonal + 아바타 없음일 때는 제품 전용 시즌 광고 설명 사용
  const adTypeDescription = (input.adType === 'seasonal' && !figureInfo.needsModel)
    ? `Seasonal/Theme PRODUCT-ONLY Shot (NO HUMAN MODEL):
- ⚠️ CRITICAL: This is a PRODUCT-ONLY seasonal advertisement. NO human models, NO hands, NO people.
- Theme elements: Season-appropriate props, decorations, and colors AROUND the product
  • Spring: Flowers, pastels, fresh greenery surrounding the product
  • Summer: Bright light, summer props, vibrant colors with product as center
  • Autumn: Warm tones, leaves, cozy textures framing the product
  • Winter: Cool tones, holiday decorations, warm lighting on product
  • Holiday: Festive decorations (Christmas ornaments, Valentine hearts, etc.) with product
- Product is the SOLE SUBJECT - no human presence whatsoever
- Color palette: Cohesive with seasonal theme
- Atmosphere: Strong seasonal mood created by props and lighting, NOT by people
- Camera: Product-focused, 50mm or macro lens for detail`
    : AD_TYPE_DESCRIPTIONS[input.adType]

  // 시스템 프롬프트 (핵심 보존, 중복 제거)
  const systemPrompt = `You are an expert advertising photographer. Generate a Seedream 4.5 optimized prompt for "${input.adType}" advertisement.

=== AD TYPE ===
${input.adType}: ${adTypeDescription}

${figureInfo.guide}

Product Category: ${productCategory}
Options: ${JSON.stringify(input.selectedOptions)}${input.additionalPrompt ? `
Additional: ${input.additionalPrompt}` : ''}${bodyInstruction}${aiAvatarInstruction}${outfitInstruction}${noModelInstruction}

=== CORE RULES (ALL REQUIRED) ===

${LIGHTING_RULES}
${figureInfo.needsModel ? `
${EXPRESSION_GUIDE}
` : ''}
${PRODUCT_PRESERVATION}

${LOGO_RULES}

${NO_OVERLAYS}

=== COMMERCIAL STYLE ===
- Professional lighting RESULT (not visible equipment)
- Magazine-worthy composition
- High-end brand advertisement quality
- Clean, polished final photograph look
- NEVER use "studio" word - use "plain solid color background" for clean backdrops

=== SEEDREAM 4.5 QUALITY REQUIREMENTS ===
${!figureInfo.needsModel ? `For PRODUCT ONLY shots:
- Camera: "shot on 50mm macro lens at f/11" or "shot on 85mm at f/16" for full sharpness
- Quality: "photorealistic, 8K RAW quality, product photography"
- Focus: "focus stacking, every detail crisp"` : `For MODEL shots:
- Camera: "shot on 85mm lens at f/11" (portrait) or "shot on 35mm at f/11" (environmental)
- Quality: "photorealistic, 8K RAW quality"
- Texture: "natural skin texture with visible pores, individual hair strands"`}

=== OUTPUT FORMAT ===
{
  "productHasLogo": true/false (based on product image analysis),
  "optimizedPrompt": "60-80 words. ${!figureInfo.needsModel
    ? `Structure: [${figureInfo.productRef}] [as hero subject] [on/against background surface or setting] [dramatic lighting from angle] [camera: f/11-f/16 for sharpness] [quality: product photography, every detail crisp]. NO model, NO hands unless specified.`
    : `Structure: [${figureInfo.modelRef}] ${outfitText ? '[outfit description] ' : ''}[pose/action] [with ${figureInfo.productRef}] [in CLEAN environment] [natural light from direction] [SPECIFIC expression] [camera specs] [quality]. NO studio equipment.`}",
  "koreanDescription": "한국어 요약 (15-20자)"
}

=== ANATOMICAL RULES (CRITICAL) ===
⚠️ Complex hand descriptions cause AI to generate extra limbs!
- NEVER describe more than 2 simultaneous hand actions
- BAD: "rests chin on one hand while holding product, tucking hair with the other" (3 actions = 3 hands)
- GOOD: "naturally holding the product with both hands" or "one hand holds product, relaxed pose"
- If model holds product, that is the ONLY hand action needed
- Keep pose simple: ONE clear body position, not multiple simultaneous gestures

=== SELF-VERIFICATION (before responding) ===
Check your optimizedPrompt:
✓ No lighting EQUIPMENT words (softbox, ring light, LED, reflector)?
✓ No "studio" word? (use "plain solid color background" or "clean white/gray background" instead)
✓ No forced smile words? ("smile", "grin", "cheerful" - use "calm", "relaxed", "neutral" instead)
✓ Has camera specs (lens, f/stop)?
✓ 60-80 words?
✓ Hand actions are SIMPLE? (max 1 action per hand, no complex multi-gesture poses)?
If any check fails, revise before responding.`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
  }

  // 이미지 + 텍스트 파트
  const imageParts = await buildImageParts(input)
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    ...imageParts,
    { text: systemPrompt },
  ]

  const response = await getGenAI().models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  try {
    const result = JSON.parse(response.text || '') as ImageAdPromptResult

    // 최소한의 후처리 (누락된 경우에만)
    result.optimizedPrompt = postProcessPrompt(result.optimizedPrompt, result.productHasLogo, input.adType)

    return result
  } catch {
    // 폴백
    return {
      optimizedPrompt: `Professional ${input.adType} advertisement, photorealistic, commercial photography, brand campaign quality, pure photograph without overlays.`,
      koreanDescription: '제품 광고 이미지',
    }
  }
}

// ============================================================
// 기존 함수와 호환을 위한 래퍼
// ============================================================

/**
 * 기존 generateImageAdPrompt와 동일한 인터페이스
 * 내부적으로 v2 사용
 */
export { generateImageAdPromptV2 as generateImageAdPrompt }
