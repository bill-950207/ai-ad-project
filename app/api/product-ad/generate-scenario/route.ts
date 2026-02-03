/**
 * 제품 광고 시나리오 생성 API
 *
 * POST: AI가 제품 정보를 분석하여 광고 시나리오를 추천합니다.
 * - 전체 분위기(mood)와 함께 씬별 광고 요소(sceneElements)를 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GenerateContentConfig, ThinkingLevel, Type } from '@google/genai'
import { getGenAI, MODEL_NAME, fetchImageAsBase64 } from '@/lib/gemini/shared'

interface GenerateScenarioRequest {
  productName: string
  productDescription?: string | null
  sellingPoints?: string[] | null
  productImageUrl?: string | null  // 제품 이미지 URL (시각적 분석용)
  referenceElements?: Record<string, string>
  referenceDescription?: string
  count?: number  // 생성할 시나리오 수 (기본 3)
  sceneCount?: number  // 씬 개수 (기본 3, 씬별 요소 생성용)
  language?: 'ko' | 'en' | 'ja'  // 출력 언어 (기본 ko)
}

// 전체 요소 (간소화 - mood만 필수)
interface ScenarioElements {
  mood: string
}

// 씬별 요소 (간소화 + AI 생성 프롬프트)
interface SceneElementOptions {
  background: string           // 배경/장소 (한국어, 자유 입력)
  mood: string                 // 분위기/톤 (한국어, 자유 입력)
  additionalPrompt: string     // 추가 지시사항 (한국어)
  movementAmplitude: 'auto' | 'small' | 'medium' | 'large'  // 카메라 움직임 속도
  imagePrompt: string          // Seedream용 영어 프롬프트
  videoPrompt: string          // Vidu용 영어 프롬프트
}

// 영상 설정 추천
interface VideoSettings {
  aspectRatio: '16:9' | '9:16' | '1:1'
  sceneCount: number
  sceneDurations: number[]
}

interface Scenario {
  title: string
  description: string
  elements: ScenarioElements  // 전체 분위기 (레거시 호환)
  sceneElements: SceneElementOptions[]  // 씬별 요소 (신규)
  videoSettings: VideoSettings
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: GenerateScenarioRequest = await request.json()
    const {
      productName,
      productDescription,
      sellingPoints,
      productImageUrl,
      referenceElements,
      referenceDescription,
      count = 3,
      sceneCount = 3,  // 기본 3개 씬
      language = 'ko',  // 기본 한국어
    } = body

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    // 언어명 매핑
    const languageNames: Record<string, string> = {
      ko: 'Korean',
      en: 'English',
      ja: 'Japanese',
    }
    const outputLanguage = languageNames[language] || 'Korean'

    // 참조 기반인지 확인
    const isReference = !!referenceElements || !!referenceDescription

    // 프롬프트 구성
    const prompt = isReference
      ? buildReferenceBasedPrompt(productName, productDescription, sellingPoints, referenceElements, referenceDescription, sceneCount, outputLanguage)
      : buildAiRecommendPrompt(productName, productDescription, sellingPoints, count, sceneCount, outputLanguage)

    // 제품 이미지 base64 변환 (있을 경우)
    let productImageData: { base64: string; mimeType: string } | null = null
    if (productImageUrl) {
      productImageData = await fetchImageAsBase64(productImageUrl)
    }

    const config: GenerateContentConfig = {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        required: ['scenarios'],
        properties: {
          scenarios: {
            type: Type.ARRAY,
            description: '생성된 시나리오 배열',
            items: {
              type: Type.OBJECT,
              required: ['title', 'description', 'elements', 'sceneElements', 'videoSettings'],
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'Scenario title (in output language)',
                },
                description: {
                  type: Type.STRING,
                  description: 'Scenario description 1-2 sentences (in output language)',
                },
                elements: {
                  type: Type.OBJECT,
                  description: 'Overall mood/style',
                  required: ['mood'],
                  properties: {
                    mood: { type: Type.STRING, description: 'Overall mood (in output language)' },
                  },
                },
                sceneElements: {
                  type: Type.ARRAY,
                  description: 'Per-scene elements + AI generated prompts',
                  items: {
                    type: Type.OBJECT,
                    required: ['background', 'mood', 'additionalPrompt', 'movementAmplitude', 'imagePrompt', 'videoPrompt'],
                    properties: {
                      background: { type: Type.STRING, description: 'Background/location - write freely (in output language)' },
                      mood: { type: Type.STRING, description: 'Mood/tone - write freely (in output language)' },
                      additionalPrompt: { type: Type.STRING, description: 'Additional direction for this scene (in output language)' },
                      movementAmplitude: {
                        type: Type.STRING,
                        description: '카메라 움직임 속도 (Vidu용)',
                        enum: ['auto', 'small', 'medium', 'large'],
                      },
                      imagePrompt: {
                        type: Type.STRING,
                        description: 'Seedream용 영어 이미지 프롬프트 (50-100 words)',
                      },
                      videoPrompt: {
                        type: Type.STRING,
                        description: 'Vidu용 영어 영상 프롬프트 (50-100 words, motion included)',
                      },
                    },
                  },
                },
                videoSettings: {
                  type: Type.OBJECT,
                  description: '영상 설정 추천',
                  required: ['aspectRatio', 'sceneCount', 'sceneDurations'],
                  properties: {
                    aspectRatio: {
                      type: Type.STRING,
                      description: '영상 비율 (16:9, 9:16, 1:1)',
                      enum: ['16:9', '9:16', '1:1'],
                    },
                    sceneCount: {
                      type: Type.INTEGER,
                      description: '씬 개수 (3-5개 권장, 총 영상 6-15초 권장)',
                    },
                    sceneDurations: {
                      type: Type.ARRAY,
                      description: '각 씬별 영상 길이 (1-3초 권장)',
                      items: { type: Type.INTEGER },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    // 멀티모달 콘텐츠 구성 (이미지 + 텍스트)
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

    // 제품 이미지가 있으면 먼저 추가 (시각적 분석용)
    if (productImageData) {
      parts.push({
        inlineData: {
          mimeType: productImageData.mimeType,
          data: productImageData.base64,
        },
      })
    }

    // 프롬프트 추가
    parts.push({ text: prompt })

    const response = await getGenAI().models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts }],
      config,
    })

    const responseText = response.text || ''
    const result = JSON.parse(responseText) as {
      scenarios: Scenario[]
    }

    return NextResponse.json({
      scenarios: result.scenarios,
    })
  } catch (error) {
    console.error('시나리오 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate scenario' },
      { status: 500 }
    )
  }
}

function buildAiRecommendPrompt(
  productName: string,
  productDescription: string | null | undefined,
  sellingPoints: string[] | null | undefined,
  count: number,
  _sceneCount: number,  // 미사용 - AI가 자체 결정
  outputLanguage: string  // 출력 언어
): string {
  return `You are an expert advertising producer specializing in product video ads.
Analyze the product information (including the product image if provided) and recommend ${count} optimal advertising scenarios.

OUTPUT LANGUAGE: All text fields (title, description, background, mood, additionalPrompt, elements.mood) must be in ${outputLanguage}.
Only imagePrompt and videoPrompt should be in English.

IMPORTANT: If a product image is provided, carefully analyze its visual characteristics:
- Product shape, size, and form factor
- Colors and materials
- Packaging design
- Visual appeal and premium feel
Use these visual insights to inform your scenario recommendations.

=== PRODUCT INFORMATION ===
Product Name: ${productName}
Product Description: ${productDescription || 'Not provided'}
Selling Points: ${sellingPoints?.join(', ') || 'Not provided'}
Product Image: [Analyze the provided image for visual characteristics]

=== SCENE COUNT & PACING (AI DECIDES) ===
Based on the product characteristics and storytelling needs, YOU decide the optimal number of scenes.
**RECOMMENDED: 3-5 scenes, 1-3 seconds each, total video 6-15 seconds**
- Elegant/luxury products: 3 scenes (2-3 seconds each, slower pacing)
- Standard products: 4 scenes (2 seconds each) - MOST COMMON
- Dynamic/feature-rich products: 5 scenes (1-2 seconds each, fast-paced)
Keep it impactful. Match pacing to product personality - luxury=slower, sports/tech=faster cuts.

=== SCENE-BY-SCENE STORYTELLING ===
CRITICAL: Design scenes that tell a CONNECTED STORY with clear narrative flow.
Think of it as a mini commercial film - each scene must logically lead to the next.

**NARRATIVE STRUCTURE:**
- Scene 1 (Opening): Introduce the product with visual impact - grab attention
- Middle Scenes: Build interest, show features/benefits, create desire
- Final Scene (Climax): Memorable ending - product hero shot or emotional peak

**VISUAL CONTINUITY:**
- Maintain consistent color palette and lighting mood across all scenes
- Use visual motifs that connect scenes (e.g., same accent color, recurring element)
- Each scene should feel like part of the SAME story, not disconnected shots

**BE BOLD & CREATIVE:**
- Match visuals to product personality (luxury=elegant, sports=dynamic, tech=futuristic)
- Use dramatic lighting, interesting angles, environmental effects
- Create visually stunning scenes that capture attention

=== FOR EACH SCENE, PROVIDE ===
1. background (배경/장소, 한국어): 제품 특성에 맞는 창의적이고 구체적인 장소 (자유 작성)

2. mood (분위기/톤, 한국어): 제품과 씬에 어울리는 구체적인 분위기 (자유 작성)

3. additionalPrompt (추가 지시사항, 한국어): 이 씬만의 특별한 연출/카메라 워크/비주얼 포인트 (자유 작성)

4. movementAmplitude: Choose based on PRODUCT TYPE and SCENE MOOD (not just scene position!)
   - "small": Luxury/premium products (cosmetics, jewelry, perfume), calm/elegant mood
   - "medium": General products, feature demonstrations, balanced energy
   - "large": Sports/energy products, dynamic/exciting mood, action-oriented
   - "auto": Let AI decide based on content

   Consider the PRODUCT CHARACTERISTICS and OVERALL MOOD when choosing:
   - Premium/luxury feel → prefer "small" for elegance
   - Energetic/sporty feel → prefer "medium" or "large"
   - Technical/feature-focused → prefer "medium" for clarity
   - Food/beverage → "small" to "medium" for appetizing presentation

5. imagePrompt (영어, 50-100 words): Seedream 이미지 생성용
   - Start with: "The product shown in the attached image" (NEVER use "${productName}"!)
   - End with: "photorealistic, 8K, premium commercial advertisement"

   **HUMAN ELEMENTS (필요시 사람 포함 가능):**
   ❌ NO FULL FACE CLOSE-UPS (AI-generated faces often look unnatural)
   ✅ ALLOWED: Hands holding/using the product, partial body, silhouettes, back view
   ✅ ALLOWED: Lifestyle scenes with people (but keep faces obscured, out of frame, or from behind)

   **CREATE STUNNING VISUALS like real TV commercials:**
   - **SPECIFIC ENVIRONMENT**: Describe exact location details (e.g., "floating above a reflective black water surface" not just "dark background")
   - **DRAMATIC LIGHTING**: Use cinematic light effects (rim lighting, volumetric rays, neon glows, golden hour warmth, caustic reflections)
   - **ATMOSPHERIC ELEMENTS**: Add particles, mist, water droplets, floating dust, lens flares, bokeh orbs, light streaks
   - **PREMIUM SURFACES**: Reflective floors, glass, marble, brushed metal, wet surfaces with mirror reflections
   - **SCENE 1 = HERO SHOT**: Product as the star - dramatic reveal, eye-catching composition, maximum visual impact

   Example: "The product shown in the attached image floating majestically above an infinite black mirror surface, surrounded by swirling golden particles and soft volumetric light rays, dramatic rim lighting creates a glowing halo effect, scattered water droplets catch prismatic reflections, deep shadows contrast with ethereal highlights, photorealistic, 8K, premium commercial advertisement"

   🚨 BANNED WORDS (will generate unwanted objects):
   ❌ "camera", "tripod", "DSLR", "photographer", "filming", "studio setup"
   ❌ the product name "${productName}" - use "the product" instead

6. videoPrompt (영어, 50-100 words): Vidu 영상 생성용
   - Start with: "The product shown in the attached image"
   - Include motion with "slowly" and "steady, gimbal-stabilized"
   - Include "no camera shake", "professional dolly motion" for stability
   - End with: "soft natural lighting, photorealistic, 4K"
   - HUMAN ELEMENTS: Hands/body allowed, but NO full face close-ups (keep faces out of frame or from behind)
   - NO visible studio equipment, cameras, tripods, lighting rigs, softboxes, reflectors, or any production equipment
   - Describe lighting as EFFECT only, NOT as visible equipment
   - ⚠️ FORBIDDEN WORDS: "camera", "tripod", "photographer", "filming", "behind the scenes", "DSLR", "mirrorless", "handheld", "shaky"
   - ⚠️ Do NOT use "${productName}" directly - use generic terms like "the product", "the item"

=== VIDEO SETTINGS ===
- aspectRatio: "16:9" (landscape), "9:16" (portrait/vertical), or "1:1" (square)
- sceneCount: The number of scenes YOU decided (3-5 recommended)
- sceneDurations: Array of durations matching your sceneCount (1-3 seconds each, total 6-15 seconds)

=== OUTPUT FORMAT ===
1. "elements": { "mood": "overall mood in ${outputLanguage}" }
2. "sceneElements": all 6 fields for each scene
3. title, description, background, mood, additionalPrompt: ${outputLanguage}
4. imagePrompt, videoPrompt: English only

background, mood, additionalPrompt: Write creatively and freely based on the product.

Create ${count} diverse scenarios.`
}

function buildReferenceBasedPrompt(
  productName: string,
  productDescription: string | null | undefined,
  sellingPoints: string[] | null | undefined,
  referenceElements: Record<string, string> | undefined,
  referenceDescription: string | undefined,
  _sceneCount: number,  // 미사용 - AI가 자체 결정
  outputLanguage: string  // 출력 언어
): string {
  return `You are an expert advertising producer specializing in product video ads.
Based on the reference video analysis, create an advertising scenario adapted for this product.

OUTPUT LANGUAGE: All text fields (title, description, background, mood, additionalPrompt, elements.mood) must be in ${outputLanguage}.
Only imagePrompt and videoPrompt should be in English.

IMPORTANT: If a product image is provided, carefully analyze its visual characteristics:
- Product shape, size, and form factor
- Colors and materials
- Packaging design
- Visual appeal and premium feel
Use these visual insights along with the reference style to create the optimal scenario.

=== PRODUCT INFORMATION ===
Product Name: ${productName}
Product Description: ${productDescription || 'Not provided'}
Selling Points: ${sellingPoints?.join(', ') || 'Not provided'}
Product Image: [Analyze the provided image for visual characteristics]

=== REFERENCE VIDEO ANALYSIS ===
${referenceDescription || 'No description provided'}

Reference Elements:
${referenceElements ? Object.entries(referenceElements).map(([key, value]) => `- ${key}: ${value}`).join('\n') : 'Not provided'}

=== SCENE COUNT & PACING (AI DECIDES) ===
Based on the product characteristics and reference style, YOU decide the optimal number of scenes.
**RECOMMENDED: 3-5 scenes, 1-3 seconds each, total video 6-15 seconds**
Keep it impactful while adapting the reference style. Match pacing to product personality.

=== FOR EACH SCENE, PROVIDE ===
1. background (배경/장소, 한국어): 참조 스타일을 적용하여 제품에 맞게 자유 작성

2. mood (분위기/톤, 한국어): 참조 영상의 분위기를 기반으로 제품에 맞게 자유 작성

3. additionalPrompt (추가 지시사항, 한국어): 참조 영상의 연출을 분석하여 적용 (자유 작성)

4. movementAmplitude: Choose based on PRODUCT TYPE, REFERENCE STYLE, and SCENE MOOD
   - "small": Luxury/premium, calm/elegant mood, slow reference style
   - "medium": General products, feature demonstrations, balanced energy
   - "large": Sports/energy products, dynamic/exciting reference style
   - "auto": Let AI decide based on content

   Adapt to the reference video's motion style while matching the product characteristics.

5. imagePrompt (영어, 50-100 words): Seedream 이미지 생성용
   - Start with: "The product shown in the attached image" (NEVER use "${productName}"!)
   - End with: "photorealistic, 8K, premium commercial advertisement"

   **HUMAN ELEMENTS (필요시 사람 포함 가능):**
   ❌ NO FULL FACE CLOSE-UPS (AI-generated faces often look unnatural)
   ✅ ALLOWED: Hands holding/using the product, partial body, silhouettes, back view
   ✅ ALLOWED: Lifestyle scenes with people (but keep faces obscured, out of frame, or from behind)

   **CREATE STUNNING VISUALS like real TV commercials:**
   - **SPECIFIC ENVIRONMENT**: Describe exact location details (e.g., "floating above a reflective black water surface" not just "dark background")
   - **DRAMATIC LIGHTING**: Use cinematic light effects (rim lighting, volumetric rays, neon glows, golden hour warmth, caustic reflections)
   - **ATMOSPHERIC ELEMENTS**: Add particles, mist, water droplets, floating dust, lens flares, bokeh orbs, light streaks
   - **PREMIUM SURFACES**: Reflective floors, glass, marble, brushed metal, wet surfaces with mirror reflections
   - **SCENE 1 = HERO SHOT**: Product as the star - dramatic reveal, eye-catching composition, maximum visual impact

   Example: "The product shown in the attached image floating majestically above an infinite black mirror surface, surrounded by swirling golden particles and soft volumetric light rays, dramatic rim lighting creates a glowing halo effect, scattered water droplets catch prismatic reflections, deep shadows contrast with ethereal highlights, photorealistic, 8K, premium commercial advertisement"

   🚨 BANNED WORDS (will generate unwanted objects):
   ❌ "camera", "tripod", "DSLR", "photographer", "filming", "studio setup"
   ❌ the product name "${productName}" - use "the product" instead

6. videoPrompt (영어, 50-100 words): Vidu 영상 생성용
   - Start with: "The product shown in the attached image"
   - Include motion with "slowly" and "steady, gimbal-stabilized"
   - Include "no camera shake", "professional dolly motion" for stability
   - End with: "soft natural lighting, photorealistic, 4K"
   - HUMAN ELEMENTS: Hands/body allowed, but NO full face close-ups (keep faces out of frame or from behind)
   - NO visible studio equipment, cameras, tripods, lighting rigs, softboxes, reflectors, or any production equipment
   - Describe lighting as EFFECT only, NOT as visible equipment
   - ⚠️ FORBIDDEN WORDS: "camera", "tripod", "photographer", "filming", "behind the scenes", "DSLR", "mirrorless", "handheld", "shaky"
   - ⚠️ Do NOT use "${productName}" directly - use generic terms like "the product", "the item"

=== VIDEO SETTINGS ===
- aspectRatio: "16:9" (landscape), "9:16" (portrait/vertical), or "1:1" (square)
- sceneCount: The number of scenes YOU decided (3-5 recommended)
- sceneDurations: Array of durations matching your sceneCount (1-3 seconds each, total 6-15 seconds)

=== OUTPUT FORMAT ===
1. "elements": { "mood": "overall mood in ${outputLanguage}" }
2. "sceneElements": all 6 fields for each scene
3. title, description, background, mood, additionalPrompt: ${outputLanguage}
4. imagePrompt, videoPrompt: English only

background, mood, additionalPrompt: Write creatively and freely based on the product.

Create 1 optimized scenario adapting the reference style.`
}
