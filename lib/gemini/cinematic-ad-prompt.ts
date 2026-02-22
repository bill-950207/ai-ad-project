/**
 * Seedance 2.0 시네마틱 광고 - Gemini 프롬프트 빌더
 *
 * 기존 product-ad 시나리오와 차이점:
 * - 기존: 씬별 imagePrompt + videoPrompt 분리 → 씬 단위 생성
 * - 신규: 단일 multiShotPrompt → Seedance 2.0이 내부적으로 멀티샷 처리
 *
 * Gemini가 생성하는 구조:
 * - title, description, mood: 사용자 언어
 * - multiShotPrompt: 영어 (Seedance 2.0 API용)
 * - shotBreakdown: 사용자 언어 (UI 표시용)
 * - recommendedSettings: 추천 설정
 */

export interface CinematicScenarioPromptInput {
  productName: string
  productDescription?: string | null
  sellingPoints?: string[] | null
  count?: number
  language?: 'ko' | 'en' | 'ja' | 'zh'
}

/**
 * 시네마틱 광고 시나리오 생성 프롬프트를 구성합니다.
 */
export function buildCinematicScenarioPrompt(input: CinematicScenarioPromptInput): string {
  const {
    productName,
    productDescription,
    sellingPoints,
    count = 3,
    language = 'ko',
  } = input

  const languageNames: Record<string, string> = {
    ko: 'Korean',
    en: 'English',
    ja: 'Japanese',
    zh: 'Chinese',
  }
  const outputLanguage = languageNames[language] || 'Korean'

  return `You are an expert cinematic advertising producer specializing in AI-generated video ads.
Create ${count} distinct cinematic advertising scenarios for the given product.

These scenarios will be used with Seedance 2.0 AI video generation model, which:
- Generates 4-15 second videos in a SINGLE API call
- Natively handles multi-shot transitions within one video
- Supports native audio generation including lip-sync
- Accepts a single text prompt that describes ALL shots/scenes together

OUTPUT LANGUAGE: title, description, mood, shotBreakdown[].description must be in ${outputLanguage}.
multiShotPrompt MUST be in English (for the AI video model).

=== PRODUCT INFORMATION ===
Product Name: ${productName}
Product Description: ${productDescription || 'Not provided'}
Selling Points: ${sellingPoints?.join(', ') || 'Not provided'}
Product Image: [Analyze the provided image for visual characteristics if available]

=== MULTI-SHOT PROMPT GUIDELINES ===
The multiShotPrompt is the KEY output - it goes directly to the Seedance 2.0 API.

**FORMAT:** Write as a flowing cinematic description with clear shot transitions:
"Shot 1: [description]. Shot 2: [description]. Shot 3: [description]."

**VISUAL QUALITY:**
- Describe premium, cinematic visuals: dramatic lighting, depth of field, lens flares
- Include camera movements: slow dolly, orbit, crane, tracking shot
- Specify atmosphere: particles, mist, reflections, bokeh
- End each shot description with quality tags: "cinematic, 4K, commercial quality"

**PRODUCT REFERENCE:**
- ALWAYS refer to product as "the product" or "the item" (NEVER use the actual product name "${productName}")
- Start with: "The product shown in the reference image" for the first mention
- For subsequent shots: "the product", "the item"

**HUMAN ELEMENTS (if appropriate):**
- Hands holding/using the product: OK
- Partial body, silhouettes, back view: OK
- NO full face close-ups (AI faces look unnatural)

**STORYTELLING STRUCTURE (within 4-15 seconds):**
- Opening: Dramatic product reveal or hero shot
- Middle: Feature showcase, lifestyle context, or emotional moment
- Closing: Brand moment, final product beauty shot

**BANNED WORDS in multiShotPrompt:**
- "camera", "tripod", "DSLR", "photographer", "filming", "studio setup"
- The product name "${productName}" - use "the product" instead

=== RECOMMENDED SETTINGS ===
Based on product type, recommend optimal settings:
- aspectRatio: Choose the BEST ratio for the product
  - "16:9" → landscape/cinematic (YouTube, web ads, TV-style)
  - "9:16" → vertical/mobile (Instagram Reels, TikTok, Shorts)
  - "4:3" → classic (product showcases)
  - "1:1" → square (Instagram feed, social media)
  - "21:9" → ultra-wide (premium cinematic)
  - "3:4" → portrait (Pinterest, product cards)
- duration: 5-12 seconds (match product complexity and storytelling needs)

=== SHOT BREAKDOWN ===
For UI display, break down the multiShotPrompt into individual shots:
- shotNumber: sequential number
- description: what happens in this shot (in ${outputLanguage})
- estimatedDuration: approximate duration like "2-3s"

=== DIVERSITY ===
Create ${count} DIVERSE scenarios with different:
- Visual styles (luxury/minimal, dynamic/energetic, warm/lifestyle)
- Aspect ratios (vary across scenarios)
- Moods and storytelling approaches
- Duration recommendations

Each scenario should feel distinctly different while all being appropriate for the product.`
}
