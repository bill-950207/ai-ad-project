/**
 * AI 카테고리 옵션 추천
 */

import { GenerateContentConfig, MediaResolution, ThinkingLevel, Type } from '@google/genai'
import { genAI, MODEL_NAME, fetchImageAsBase64 } from './shared'
import type {
  ImageAdType,
  RecommendedOptionsInput,
  RecommendedOptionsResult,
  MultipleRecommendedOptionsResult,
  ReferenceStyleAnalysisInput,
  ReferenceStyleAnalysisResult,
  BackgroundPromptInput,
  BackgroundPromptResult,
} from './types'

// v2 프롬프트 생성 함수 (개선된 버전)
export { generateImageAdPromptV2 as generateImageAdPrompt } from './image-ad-prompt-v2'

// 광고 유형별 상세 설명 (시나리오 추천용)
const adTypeDescriptions: Record<ImageAdType, string> = {
  productOnly: `Product Only - NO model, product is the hero.
Best for: Luxury products, product detail showcase, e-commerce hero images.
Options focus: Dramatic lighting, clean backgrounds, product angles.`,

  holding: `Holding Shot - Model naturally holds the product.
Best for: Cosmetics, beverages, packaged goods, small electronics.
Options focus: Hand position, model-product relationship, both faces visible.`,

  using: `Using Shot - Model actively uses/applies the product.
Best for: Skincare (applying), makeup (using), beverages (drinking), devices (operating).
Options focus: Action moment, product effect visible, engagement expression.`,

  wearing: `Wearing Shot - Fashion/wearable product showcase.
Best for: Clothing, accessories, jewelry, watches, bags, shoes.
Options focus: Full body or detail, pose showing fit, garment visibility.`,

  lifestyle: `Lifestyle - Natural everyday scene with product.
Best for: Home products, lifestyle brands, aspirational marketing.
Options focus: Real environment, candid feel, product naturally integrated.`,

  unboxing: `Unboxing - Product reveal moment.
Best for: Premium products, gift items, subscription boxes.
Options focus: Packaging visible, reveal gesture, excitement expression.`,

  seasonal: `Seasonal/Theme - Holiday or seasonal atmosphere.
Best for: Limited editions, holiday campaigns, seasonal promotions.
Options focus: Theme-appropriate props, seasonal color palette, festive mood.`,
}

// ============================================================
// Few-Shot 예시 및 검증 규칙
// ============================================================

/** 시나리오 추천 규칙 (BAD 예시만 제공 - 창의성은 LLM에게 맡김) */
const SCENARIO_RECOMMENDATION_EXAMPLES = `
=== WHAT TO AVOID (BAD EXAMPLES) ===

These patterns are FORBIDDEN - do NOT produce anything similar:

❌ GENERIC TITLES:
- "프리미엄 시나리오", "기본 시나리오", "스탠다드" - No creative concept
- "시나리오 1", "시나리오 2", "시나리오 3" - Just numbers
- Any title using banned words from the list above

❌ LACK OF DIVERSITY:
- All 3 scenarios targeting the same age group
- All 3 scenarios with similar mood/tone
- All 3 scenarios in similar settings

❌ PRODUCT MISMATCH:
- Budget snack product with luxury positioning
- Youth product with mature audience targeting
- Premium product with budget-friendly casual style

❌ AI WRITING PATTERNS:
- "따뜻하고 부드럽고 자연스러운" - 3+ stacked adjectives
- "특별한 경험을 선사하는" - Empty marketing phrase
- Starting all backgrounds with "따뜻한" or "부드러운"
- Using same sentence structure for all customText
- Repetitive vocabulary across scenarios

❌ VAGUE DESCRIPTIONS:
- "아늑한 분위기" instead of specific setting details
- "은은한 조명" instead of technical lighting description
- "자연스러운 느낌" without concrete visual elements
`.trim()

/** 시나리오 다양성 검증 */
const SCENARIO_DIVERSITY_CHECK = `
=== DIVERSITY REQUIREMENTS ===

Each scenario MUST differ in at least 3 of these dimensions:
1. Target Age: (20대 vs 30대 vs 40대+)
2. Target Lifestyle: (직장인 vs 학생 vs 전업주부 vs 인플루언서)
3. Emotional Tone: (활기찬 vs 차분한 vs 단정한 vs 친근한)
4. Visual Mood: (밝고 화사 vs 따뜻하고 포근 vs 모던하고 깔끔)
5. Setting: (집 vs 사무실 vs 카페 vs 야외 vs 스튜디오)
6. Time: (아침 vs 낮 vs 저녁 vs 밤)
`.trim()

/** 시나리오 Self-Verification 체크리스트 */
const SCENARIO_SELF_VERIFICATION = `
=== SELF-VERIFICATION (before responding) ===
Check your scenarios:
✓ All 3 scenarios have UNIQUE creative titles (not "프리미엄", "기본", "스탠다드")?
✓ Each scenario targets a DIFFERENT audience segment?
✓ Price positioning matches product's actual tier?
✓ Options within each scenario are COHERENT (mood + lighting + background align)?
✓ Titles are 8-15 characters in output language?
✓ Descriptions explain the concept clearly (30-50 characters)?
✓ NO banned words used in any text (check BANNED lists above)?
✓ NO repetitive adjective patterns ("~하고 ~하고 ~한")?
✓ customText reads like a real photographer's notes, NOT like marketing copy?
✓ Each scenario uses DIFFERENT sentence structures and vocabulary?
If any check fails, revise before responding.
`.trim()

/**
 * 제품 정보와 광고 유형에 맞는 최적의 카테고리 옵션을 AI가 추천합니다.
 */
export async function generateRecommendedCategoryOptions(
  input: RecommendedOptionsInput
): Promise<RecommendedOptionsResult> {
  const language = input.language || 'ko'

  const outputLanguageInstructions: Record<string, string> = {
    ko: 'Write all text responses in Korean.',
    en: 'Write all text responses in English.',
    ja: 'Write all text responses in Japanese.',
  }

  const groupsDescription = input.categoryGroups.map(group => {
    const optionsText = group.options.map(opt => `    - ${opt.key}: ${opt.description}`).join('\n')
    return `[${group.key}]\n${optionsText}`
  }).join('\n\n')

  const prompt = `You are an expert advertising image producer.
Analyze the product and ad type to recommend optimal category options.

OUTPUT LANGUAGE: ${outputLanguageInstructions[language] || outputLanguageInstructions.ko}

=== PRODUCT ===
Name: ${input.productName || 'Not provided'}
Description: ${input.productDescription || 'Not provided'}
${input.productSellingPoints?.length ? `Selling Points: ${input.productSellingPoints.join(', ')}` : ''}

=== AD TYPE ===
${input.adType}: ${adTypeDescriptions[input.adType]}

=== AVAILABLE OPTIONS ===
${groupsDescription}

Recommend optimal settings for each category. Use '__custom__' with customText for specific requirements.

=== OUTPUT FORMAT (JSON) ===
{
  "recommendations": [
    { "key": "category_key", "value": "option_key", "reason": "Why this option" }
  ],
  "overallStrategy": "Overall strategy explanation",
  "suggestedPrompt": "Optional suggested prompt"
}

${SCENARIO_SELF_VERIFICATION}`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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

  console.log('[generateRecommendedCategoryOptions] 입력 프롬프트:', prompt)

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  try {
    const rawResult = JSON.parse(response.text || '') as {
      recommendations: Array<{ key: string; value: string; customText?: string; reason: string }>
      overallStrategy: string
      suggestedPrompt?: string
    }

    const recommendedOptions: Record<string, { value: string; customText?: string; reason: string }> = {}
    for (const rec of rawResult.recommendations) {
      recommendedOptions[rec.key] = { value: rec.value, customText: rec.customText, reason: rec.reason }
    }

    return {
      recommendedOptions,
      overallStrategy: rawResult.overallStrategy,
      suggestedPrompt: rawResult.suggestedPrompt,
    }
  } catch {
    const fallbackOptions: Record<string, { value: string; reason: string }> = {}
    for (const group of input.categoryGroups) {
      if (group.options.length > 0) {
        fallbackOptions[group.key] = { value: group.options[0].key, reason: '기본 설정입니다.' }
      }
    }
    return {
      recommendedOptions: fallbackOptions,
      overallStrategy: '제품에 맞는 기본 설정이 적용되었습니다.',
      suggestedPrompt: undefined,
    }
  }
}

/**
 * 3가지 다양한 시나리오 옵션을 추천합니다.
 */
export async function generateMultipleRecommendedOptions(
  input: RecommendedOptionsInput
): Promise<MultipleRecommendedOptionsResult> {
  const language = input.language || 'ko'

  const outputLanguageInstructions: Record<string, string> = {
    ko: 'Write all text responses (title, description, reason, overallStrategy, suggestedPrompt, customText) in Korean.',
    en: 'Write all text responses (title, description, reason, overallStrategy, suggestedPrompt, customText) in English.',
    ja: 'Write all text responses (title, description, reason, overallStrategy, suggestedPrompt, customText) in Japanese.',
  }

  // 옵션 그룹 목록 (모든 카테고리에 대해 customText 필수 출력)
  const categoryKeys = input.categoryGroups.map(group => group.key)

  // 카테고리별 역할 설명 (언어별)
  const categoryRoleDescriptions: Record<string, Record<string, string>> = {
    ko: {
      background: '제품 뒤의 배경 환경/표면 설명',
      lighting: '광원의 방향, 강도, 색온도, 그림자 효과',
      angle: '카메라/촬영 각도와 제품이 보이는 시점',
      style: '전체적인 비주얼 스타일과 미학적 방향',
      colorTone: '이미지의 전체 색감, 채도, 색온도 톤',
      composition: '프레임 내 제품 배치와 구도',
      mood: '이미지가 전달하는 감정과 분위기',
      outfit: '모델/아바타의 의상 스타일',
      pose: '모델/아바타의 자세와 동작',
      gaze: '모델/아바타의 시선 방향',
      expression: '모델/아바타의 표정',
      framing: '샷의 범위 (클로즈업, 상반신, 전신 등)',
      action: '모델이 제품으로 하는 동작/행위',
      setting: '촬영 장소/공간 환경',
      focus: '초점이 맞는 대상 (제품 vs 모델)',
      scene: '상황/씬 설정',
      location: '구체적인 장소',
      time: '시간대 (아침, 저녁, 골든아워 등)',
      productPlacement: '제품 배치 방식',
      season: '계절감',
      theme: '테마/이벤트',
      atmosphere: '전체적인 공기감/분위기',
    },
    en: {
      background: 'Background environment/surface behind the product',
      lighting: 'Light source direction, intensity, color temperature, shadow effects',
      angle: 'Camera angle and viewing perspective of the product',
      style: 'Overall visual style and aesthetic direction',
      colorTone: 'Overall color grading, saturation, color temperature',
      composition: 'Product placement and framing within the image',
      mood: 'Emotional atmosphere the image conveys',
      outfit: 'Model/avatar clothing style',
      pose: 'Model/avatar posture and movement',
      gaze: 'Model/avatar eye direction',
      expression: 'Model/avatar facial expression',
      framing: 'Shot range (close-up, upper body, full body, etc.)',
      action: 'Action/activity model performs with product',
      setting: 'Shooting location/space environment',
      focus: 'Focus subject (product vs model)',
      scene: 'Situation/scene setting',
      location: 'Specific location',
      time: 'Time of day (morning, evening, golden hour, etc.)',
      productPlacement: 'How product is placed/positioned',
      season: 'Seasonal feeling',
      theme: 'Theme/event',
      atmosphere: 'Overall ambiance/atmosphere',
    },
    ja: {
      background: '製品背後の背景環境/表面',
      lighting: '光源の方向、強度、色温度、影の効果',
      angle: 'カメラアングルと製品の見え方',
      style: '全体的なビジュアルスタイルと美学的方向性',
      colorTone: '画像全体の色調、彩度、色温度',
      composition: 'フレーム内の製品配置と構図',
      mood: '画像が伝える感情と雰囲気',
      outfit: 'モデル/アバターの服装スタイル',
      pose: 'モデル/アバターの姿勢と動き',
      gaze: 'モデル/アバターの視線方向',
      expression: 'モデル/アバターの表情',
      framing: 'ショットの範囲（クローズアップ、上半身、全身など）',
      action: 'モデルが製品で行う動作/行為',
      setting: '撮影場所/空間環境',
      focus: 'フォーカス対象（製品 vs モデル）',
      scene: '状況/シーン設定',
      location: '具体的な場所',
      time: '時間帯（朝、夕方、ゴールデンアワーなど）',
      productPlacement: '製品の配置方法',
      season: '季節感',
      theme: 'テーマ/イベント',
      atmosphere: '全体的な空気感/雰囲気',
    },
  }

  const roleDescs = categoryRoleDescriptions[language] || categoryRoleDescriptions.ko
  const groupsDescription = input.categoryGroups.map(group => {
    const roleDesc = roleDescs[group.key] || group.key
    return `- ${group.key}: ${roleDesc}`
  }).join('\n')

  // 아바타 정보 컨텍스트 생성
  const isAiGeneratedAvatar = input.avatarInfo?.type === 'ai-generated'
  const hasRealAvatar = input.avatarInfo?.type === 'avatar' || input.avatarInfo?.type === 'outfit'

  let avatarContext = ''
  if (hasRealAvatar && input.avatarInfo?.avatarStyle) {
    const style = input.avatarInfo.avatarStyle
    const styleParts: string[] = []
    if (style.vibe) styleParts.push(`vibe: ${style.vibe}`)
    if (style.bodyType) styleParts.push(`body type: ${style.bodyType}`)
    if (style.height) styleParts.push(`height: ${style.height}`)
    if (styleParts.length > 0) {
      avatarContext = `\n\n=== AVATAR STYLE INFO ===
The user has selected a real avatar with the following characteristics:
${styleParts.join(', ')}
Consider these avatar traits when recommending options (especially outfit, pose, expression) to create harmonious visuals.`
    }
  } else if (isAiGeneratedAvatar) {
    // 사용자 초기 AI 아바타 옵션 텍스트 생성
    let userPreferencesText = 'None specified - AI will decide all characteristics'
    if (input.avatarInfo?.aiOptions) {
      const opts = input.avatarInfo.aiOptions
      const prefs: string[] = []
      if (opts.targetGender && opts.targetGender !== 'any') prefs.push(`Gender: ${opts.targetGender}`)
      if (opts.targetAge && opts.targetAge !== 'any') prefs.push(`Age: ${opts.targetAge}`)
      if (opts.style && opts.style !== 'any') prefs.push(`Style: ${opts.style}`)
      if (opts.ethnicity && opts.ethnicity !== 'any') prefs.push(`Ethnicity: ${opts.ethnicity}`)
      if (opts.bodyType && opts.bodyType !== 'any') prefs.push(`Body Type: ${opts.bodyType}`)
      if (prefs.length > 0) userPreferencesText = prefs.join(', ')
    }

    avatarContext = `\n\n=== AI AVATAR RECOMMENDATION ===
The user will use an AI-generated avatar. For each scenario, recommend specific avatar characteristics.

USER'S INITIAL PREFERENCES:
${userPreferencesText}

For recommendedAvatarStyle, provide ALL these fields:

1. STRUCTURED FIELDS (REQUIRED - exact string values):
   - gender: "male" | "female" | "any" (if user specified not "any", KEEP their choice)
   - age: "young" (20-30s) | "middle" (30-40s) | "mature" (40-50s) | "any"
   - style: "natural" | "professional" | "casual" | "elegant" | "any"
   - ethnicity: "korean" | "asian" | "western" | "any"
   - bodyType: "slim" | "average" | "athletic" | "curvy" | "any"

2. avatarPrompt: A detailed English prompt (40-60 words) matching the structured fields above. Include:
   - Age range and ethnicity appropriate for the product's target market
   - Body type and height that fits the scenario mood
   - Facial features and expression matching the scenario vibe
   - Hair style appropriate for the concept
   - Create UNIQUE descriptions for each scenario - avoid repetitive patterns

3. avatarDescription: Brief description in output language (15-25 characters)

RULES:
- If user specified a value (NOT "any"), KEEP that exact value in structured fields
- If user selected "any", YOU decide the best value based on scenario and product
- Each scenario can have DIFFERENT avatar characteristics
- Structured fields MUST align with avatarPrompt description`
  }

  const prompt = `You are an expert advertising creative director. Create 3 DISTINCT advertising scenarios customized specifically for this product.

OUTPUT LANGUAGE: ${outputLanguageInstructions[language] || outputLanguageInstructions.ko}

=== STEP 1: DEEP PRODUCT ANALYSIS ===
Examine the product image and information carefully. Identify:

1. PRODUCT FUNDAMENTALS:
   - Category & sub-category (e.g., "anti-aging serum" not just "skincare")
   - Price tier indication: (budget/mass-market, mid-range, premium/luxury) based on packaging quality

2. VISUAL IDENTITY:
   - Primary colors, materials, textures (glass/plastic/matte/glossy/metallic)
   - Design language (minimalist/ornate/playful/clinical/organic)
   - Packaging sophistication level

3. BRAND SIGNALS:
   - Brand personality from design (sophisticated, youthful, natural, professional, playful)
   - Target market hints from packaging choices
   - Quality positioning indicators

4. UNIQUE SELLING PROPOSITION HINTS:
   - What problem does this product likely solve?
   - What emotional benefit does it promise?

=== PRODUCT INFO ===
Name: ${input.productName || 'Not provided'}
Description: ${input.productDescription || 'Not provided'}
${input.productSellingPoints?.length ? `Selling Points: ${input.productSellingPoints.join(', ')}` : ''}
${input.productUsageMethod ? `Usage Method: ${input.productUsageMethod}` : ''}

=== AD TYPE ===
${input.adType}: ${adTypeDescriptions[input.adType]}

=== OPTION CATEGORIES (MUST provide customText for ALL) ===
Required categories: ${categoryKeys.join(', ')}

${groupsDescription}

⚠️ CRITICAL: You MUST provide customText for ALL ${categoryKeys.length} categories listed above. Do NOT skip any category. Each scenario's recommendations array must have exactly ${categoryKeys.length} items.

=== STEP 2: DYNAMIC SCENARIO GENERATION ===

Based on your product analysis, create 3 DISTINCT advertising scenarios.

**NAMING REQUIREMENT (CRITICAL):**
- Title must clearly show WHAT PRODUCT BENEFIT/FEATURE this scenario emphasizes
- User should INSTANTLY understand the selling point from the title alone
- Format: "[강조 포인트] + [표현 방식]" (8-15 characters)
- Focus on: efficacy, texture, lasting power, ingredients, target concern, usage benefit
- BANNED ABSTRACT WORDS: "감성", "무드", "순간", "프리미엄", "럭셔리", "스페셜", "특별한", "완벽한"
- BANNED AI-SOUNDING WORDS: "아름다운", "황홀한", "찬란한", "눈부신", "매력적인", "트렌디한", "세련된", "고급스러운", "조화로운", "감각적인"
- BANNED: Poetic/vague expressions that don't communicate product benefits
- BANNED PATTERNS: Marketing clichés like "~를 경험하세요", "~의 완벽한 조화", "~를 선사합니다"
- Each scenario = DIFFERENT product benefit angle (not just different mood/style)

**TARGETING REQUIREMENT:**
- Each scenario targets a specific audience segment that makes sense for THIS product
- Don't force premium positioning on budget products
- Don't force youthful positioning on products targeting mature audiences
- Consider the product's actual price point and brand positioning

**DIVERSITY REQUIREMENT:**
The 3 scenarios MUST each highlight a DIFFERENT product benefit:
- Scenario 1: Primary benefit (most obvious selling point)
- Scenario 2: Secondary benefit (another key feature)
- Scenario 3: Emotional/lifestyle benefit (how it makes user feel)
Each scenario's visual style should SUPPORT its emphasized benefit

**QUALITY REQUIREMENT:**
- Concept authenticity: Scenario should feel natural for the product
- Option coherence: All options (mood, lighting, background, etc.) should work together harmoniously
- Target alignment: Options should match target audience expectations

=== PRODUCT-APPROPRIATE CONSTRAINTS ===
- Budget-friendly products: Avoid overly luxury/aspirational positioning
- Premium products: At least one scenario should reflect premium positioning
- Age-specific products: Scenarios should respect that age range
- Gender-specific products: Maintain gender appropriateness

=== OUTPUT REQUIREMENTS FOR EACH SCENARIO ===
- Title: 8-15 characters (clearly states the product benefit this scenario emphasizes)
- Description: 30-50 characters (explain target & concept clearly)
- Provide CLEAR REASONING for each option based on product analysis
${avatarContext}

${SCENARIO_RECOMMENDATION_EXAMPLES}

${SCENARIO_DIVERSITY_CHECK}

=== OUTPUT FORMAT (JSON) ===
{
  "scenarios": [
    {
      "title": "Creative concept name (8-15 chars)",
      "description": "Target & concept explanation (30-50 chars)",
      "targetAudience": "Specific target description",
      "recommendations": [
        { "key": "category_key", "value": "__custom__", "customText": "Product-specific creative description for this category", "reason": "Why this setting" }
      ],
      "overallStrategy": "Strategy for this scenario",
      "recommendedAvatarStyle": { ... }  // If AI avatar mode
    }
  ]
}

=== CUSTOM TEXT WRITING GUIDELINES ===
For each category in recommendations, write CUSTOM descriptions (customText) that are:
1. **Product-specific**: Tailored to THIS product's unique characteristics, materials, colors, and brand identity
2. **Visually descriptive**: Describe the exact visual effect - be specific about colors, textures, positions, light directions
3. **Coherent**: All customText descriptions should work together to create a unified visual concept
4. **Detailed but concise**: 20-50 words per customText, enough detail for image generation
5. **In output language**: customText MUST be written in the specified output language
6. **UNIQUE**: Do NOT use generic descriptions. Each customText must be uniquely crafted for THIS specific product

=== NATURAL WRITING RULES (ANTI-AI) ===
AVOID these AI-typical patterns in ALL outputs:

❌ BANNED WRITING PATTERNS:
- Stacking 3+ adjectives: "따뜻하고 부드럽고 포근한" → Use max 2 adjectives
- Rhyming or parallel endings: "~는 느낌, ~는 분위기, ~는 감성"
- Excessive superlatives: "가장 완벽한", "최고의", "비교할 수 없는"
- Empty marketing phrases: "새로운 경험", "당신만의", "특별함을 선사"
- Repetitive sentence structures across scenarios (vary your phrasing)
- Starting every description with "부드러운" or "따뜻한"
- Using "자연스럽게", "은은하게" as filler words

✅ WRITE LIKE A REAL PHOTOGRAPHER/ART DIRECTOR:
- Use concrete visual terms: "오후 3시 창가 자연광" instead of "따뜻하고 자연스러운 조명"
- Be technically specific: "45도 측면광, 반사판 없음" instead of "은은한 조명"
- Reference real-world scenarios: "카페 창가 자리" instead of "아늑한 공간"
- Vary sentence length and structure between scenarios
- Use industry terminology when appropriate (ISO, f-stop style descriptions welcome)

=== ANATOMICAL RULES (CRITICAL FOR IMAGE GENERATION) ===
⚠️ Complex body part descriptions cause AI image generators to create extra limbs!

❌ NEVER describe multiple simultaneous hand actions:
- BAD: "한 손으로 턱을 괴고, 다른 손으로 제품을 들고, 머리카락을 쓸어 넘기며" (3 actions = 3 hands)
- BAD: "rests chin on one hand while holding product near cheek, tucking hair with the other"

✅ KEEP HAND DESCRIPTIONS SIMPLE:
- ONE clear action per description: "제품을 양손으로 들고 있는" or "한 손에 제품을 든 채 미소 짓는"
- If model holds product, that's the ONLY hand action needed
- Avoid combining: holding + touching face + hair styling in one pose

POSE SIMPLIFICATION RULES:
1. Product-holding poses: Focus ONLY on how product is held (one hand/both hands)
2. Non-product poses: Maximum ONE additional gesture (e.g., touching hair OR resting chin, not both)
3. When in doubt, describe FEWER hand actions rather than more

${SCENARIO_SELF_VERIFICATION}

IMPORTANT: All scenario titles, descriptions, reasons, and strategies must be written in the specified output language.`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['scenarios'],
      properties: {
        scenarios: {
          type: Type.ARRAY,
          description: '추천 시나리오 배열',
          items: {
            type: Type.OBJECT,
            required: ['title', 'description', 'recommendations', 'overallStrategy'],
            properties: {
              title: {
                type: Type.STRING,
                description: 'Scenario title (8-15 characters)',
              },
              description: {
                type: Type.STRING,
                description: 'Scenario description (30-50 characters)',
              },
              targetAudience: {
                type: Type.STRING,
                description: 'Target audience description',
              },
              conceptType: {
                type: Type.STRING,
                description: 'Concept type',
              },
              recommendations: {
                type: Type.ARRAY,
                description: 'Category recommendations with custom creative descriptions',
                items: {
                  type: Type.OBJECT,
                  required: ['key', 'value', 'customText', 'reason'],
                  properties: {
                    key: { type: Type.STRING, description: 'Category key (e.g., lighting, background, mood)' },
                    value: { type: Type.STRING, description: 'Always "__custom__" for creative descriptions' },
                    customText: { type: Type.STRING, description: 'Creative product-specific description for this category (20-50 words)' },
                    reason: { type: Type.STRING, description: 'Brief reason for this creative choice' },
                  },
                },
              },
              overallStrategy: {
                type: Type.STRING,
                description: 'Overall strategy for this scenario',
              },
              suggestedPrompt: {
                type: Type.STRING,
                description: 'Optional suggested prompt',
              },
              recommendedAvatarStyle: {
                type: Type.OBJECT,
                description: 'Recommended avatar style for AI avatar mode',
                properties: {
                  avatarPrompt: { type: Type.STRING, description: 'English prompt for avatar generation (40-60 words)' },
                  avatarDescription: { type: Type.STRING, description: 'Brief description in output language (15-25 chars)' },
                  gender: { type: Type.STRING, description: 'male | female | any' },
                  age: { type: Type.STRING, description: 'young | middle | mature | any' },
                  style: { type: Type.STRING, description: 'natural | professional | casual | elegant | any' },
                  ethnicity: { type: Type.STRING, description: 'korean | asian | western | any' },
                  bodyType: { type: Type.STRING, description: 'slim | average | athletic | curvy | any' },
                },
              },
            },
          },
        },
      },
    },
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (input.productImageUrl) {
    const imageData = await fetchImageAsBase64(input.productImageUrl)
    if (imageData) {
      parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
    }
  }

  parts.push({ text: prompt })

  console.log('[generateMultipleRecommendedOptions] 입력 프롬프트 길이:', prompt.length)
  console.log('[generateMultipleRecommendedOptions] 제품명:', input.productName)

  let response
  try {
    response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts }],
      config,
    })
    console.log('[generateMultipleRecommendedOptions] Gemini 응답 성공, 응답 길이:', response.text?.length || 0)
  } catch (apiError) {
    console.error('[generateMultipleRecommendedOptions] Gemini API 호출 실패:', apiError)
    throw apiError
  }

  try {
    const rawResult = JSON.parse(response.text || '') as {
      scenarios: Array<{
        title: string
        description: string
        targetAudience?: string
        conceptType?: string
        recommendations: Array<{ key: string; value: string; customText?: string; reason: string }>
        overallStrategy: string
        suggestedPrompt?: string
        recommendedAvatarStyle?: {
          avatarPrompt: string
          avatarDescription: string
          gender?: 'male' | 'female' | 'any'
          age?: 'young' | 'middle' | 'mature' | 'any'
          style?: 'natural' | 'professional' | 'casual' | 'elegant' | 'any'
          ethnicity?: 'korean' | 'asian' | 'western' | 'any'
          bodyType?: 'slim' | 'average' | 'athletic' | 'curvy' | 'any'
        }
      }>
    }

    return {
      scenarios: rawResult.scenarios.map(scenario => {
        const recommendedOptions: Record<string, { value: string; customText?: string; reason: string }> = {}
        for (const rec of scenario.recommendations) {
          recommendedOptions[rec.key] = { value: rec.value, customText: rec.customText, reason: rec.reason }
        }
        return {
          title: scenario.title,
          description: scenario.description,
          targetAudience: scenario.targetAudience,
          conceptType: scenario.conceptType,
          recommendedOptions,
          overallStrategy: scenario.overallStrategy,
          suggestedPrompt: scenario.suggestedPrompt,
          // AI 추천 아바타용 - 시나리오에 어울리는 아바타 스타일
          recommendedAvatarStyle: scenario.recommendedAvatarStyle,
        }
      }),
    }
  } catch (error) {
    console.error('[generateMultipleRecommendedOptions] 에러 발생:', error)
    console.error('[generateMultipleRecommendedOptions] Gemini 응답:', response.text)

    const fallbackMessages: Record<string, { title: string; description: string; reason: string; strategy: string }> = {
      ko: {
        title: '기본 시나리오',
        description: '제품에 맞는 기본 설정입니다.',
        reason: '기본 설정입니다.',
        strategy: '제품 정보를 기반으로 기본 설정이 적용되었습니다.',
      },
      en: {
        title: 'Default Scenario',
        description: 'Default settings for the product.',
        reason: 'Default setting.',
        strategy: 'Default settings applied based on product information.',
      },
      ja: {
        title: 'デフォルトシナリオ',
        description: '製品に合ったデフォルト設定です。',
        reason: 'デフォルト設定です。',
        strategy: '製品情報に基づいてデフォルト設定が適用されました。',
      },
    }
    const messages = fallbackMessages[language] || fallbackMessages.ko

    const fallbackOptions: Record<string, { value: string; reason: string }> = {}
    for (const group of input.categoryGroups) {
      if (group.options.length > 0) {
        fallbackOptions[group.key] = { value: group.options[0].key, reason: messages.reason }
      }
    }
    return {
      scenarios: [{
        title: messages.title,
        description: messages.description,
        recommendedOptions: fallbackOptions,
        overallStrategy: messages.strategy,
        suggestedPrompt: undefined,
      }],
    }
  }
}



/**
 * 참조 스타일 이미지를 분석합니다.
 */
export async function analyzeReferenceStyleImage(input: ReferenceStyleAnalysisInput): Promise<ReferenceStyleAnalysisResult> {
  const prompt = `Analyze this reference image for ${input.adType} advertisement style.

Available options to match:
${input.availableOptions.map(g => `${g.key}: ${g.options.join(', ')}`).join('\n')}

Analyze and recommend matching options for each category.
Output JSON with: analyzedOptions, overallStyle, suggestedPrompt, recommendedAdType`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  const imageData = await fetchImageAsBase64(input.imageUrl)
  if (imageData) {
    parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } })
  }

  parts.push({ text: prompt })

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config,
  })

  try {
    return JSON.parse(response.text || '') as ReferenceStyleAnalysisResult
  } catch {
    return {
      analyzedOptions: [],
      overallStyle: '분석 결과를 가져올 수 없습니다.',
      suggestedPrompt: '',
    }
  }
}

/**
 * 배경 프롬프트를 생성합니다.
 */
export async function generateBackgroundPrompt(input: BackgroundPromptInput): Promise<BackgroundPromptResult> {
  let promptContext = ''

  if (input.mode === 'PRODUCT' && input.productImageUrl) {
    promptContext = `Analyze the product image and generate a suitable background prompt.
Product: ${input.productName || ''} - ${input.productDescription || ''}`
  } else if (input.mode === 'OPTIONS' && input.options) {
    promptContext = `Generate background based on options:
Style: ${input.options.style || 'modern'}
Location: ${input.options.location || 'seamless backdrop'}
Mood: ${input.options.mood || 'professional'}
Color: ${input.options.color || 'neutral'}
Time: ${input.options.time || 'day'}
IMPORTANT: No visible lighting equipment, camera stands, or production equipment in the background.`
  } else if (input.mode === 'PROMPT' && input.userPrompt) {
    promptContext = `Enhance this user prompt into optimized z-image-turbo prompt:
"${input.userPrompt}"`
  }

  const prompt = `Generate z-image-turbo optimized background prompt.

${promptContext}
Aspect Ratio: ${input.aspectRatio || '16:9'}

Output JSON: { "optimizedPrompt": "English background prompt", "koreanDescription": "Korean description" }`

  const config: GenerateContentConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    responseMimeType: 'application/json',
  }

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (input.mode === 'PRODUCT' && input.productImageUrl) {
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
    return JSON.parse(response.text || '') as BackgroundPromptResult
  } catch {
    return {
      optimizedPrompt: 'Clean seamless solid color backdrop with soft gradient lighting effect. Professional product photography setting with no visible equipment.',
      koreanDescription: '깔끔한 모던 배경',
    }
  }
}
