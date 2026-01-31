/**
 * 제품 광고 시나리오 생성 API
 *
 * POST: AI가 제품 정보를 분석하여 광고 시나리오를 추천합니다.
 * - 전체 분위기(mood)와 함께 씬별 광고 요소(sceneElements)를 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI, GenerateContentConfig, ThinkingLevel, Type } from '@google/genai'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

const MODEL_NAME = 'gemini-3-flash-preview'

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

/**
 * URL에서 이미지를 가져와 base64로 변환합니다.
 */
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return { base64, mimeType: contentType }
  } catch (error) {
    console.error('이미지 로드 오류:', error)
    return null
  }
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
                        description: 'Seedream용 영어 이미지 프롬프트 (50-80 words)',
                      },
                      videoPrompt: {
                        type: Type.STRING,
                        description: 'Vidu용 영어 영상 프롬프트 (50-80 words, motion included)',
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
                      description: '씬 개수 (2-8)',
                    },
                    sceneDurations: {
                      type: Type.ARRAY,
                      description: '각 씬별 영상 길이 (초, 1-8초)',
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

    const response = await genAI.models.generateContent({
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

=== SCENE COUNT (AI DECIDES) ===
Based on the product characteristics and storytelling needs, YOU decide the optimal number of scenes (2-8).
- Simple products: 2-3 scenes
- Products with multiple features: 4-5 scenes
- Complex or premium products: 5-8 scenes
Choose what best tells this product's story.

=== TONE & STORY CONSISTENCY ===
CRITICAL: Each scenario must tell a coherent mini-story with the product as the hero.

1. DETERMINE OVERALL TONE first (based on product):
   - Analyze product image: colors, materials, packaging → derive tone
   - Premium/Luxury → Elegant, sophisticated, refined visuals
   - Beauty/Skincare → Clean, soft, trustworthy atmosphere
   - Tech/Gadgets → Modern, sleek, innovative feel
   - Food/Beverage → Warm, appetizing, inviting mood

2. STORY ARC structure:
   - Scene 1: Introduction/Discovery (제품과의 첫 만남)
   - Middle scenes: Exploration/Features (제품 탐색, 특징 부각)
   - Final scene: Satisfaction/Result (만족감, 결과)

3. SCENE CONTINUITY rules:
   - Each scene must logically connect to the next
   - Maintain consistent color temperature across all scenes
   - Mood can evolve (e.g., curious → impressed → satisfied) but stay within the same tone family
   - Avoid jarring transitions (e.g., don't go from calm indoor to extreme outdoor suddenly)

=== FOR EACH SCENE, PROVIDE ===
1. background (배경/장소, 한국어): 제품 특성에 맞는 창의적이고 구체적인 장소 (자유 작성)
   - 이전 씬과 자연스럽게 연결되는 장소 선택

2. mood (분위기/톤, 한국어): 제품과 씬에 어울리는 구체적인 분위기 (자유 작성)
   - 전체 톤을 유지하면서 씬별로 감정 변화 표현

3. additionalPrompt (추가 지시사항, 한국어): 이 씬만의 특별한 연출/카메라 워크/비주얼 포인트 (자유 작성)

4. movementAmplitude: "small" | "medium" | "large" | "auto"
   - small: 미세한 움직임, 디테일 강조, 안정적 (클로즈업, 질감 표현)
   - medium: 부드러운 움직임, 제품 탐색 (기본 권장)
   - large: 역동적 움직임, 임팩트 (오프닝, 전환)
   - auto: 씬 특성에 맞게 자동 결정

   씬 위치별 권장:
   - 오프닝: medium~large (주목 유도)
   - 중간 씬: small~medium (디테일 집중)
   - 마지막 씬: small (안정감, 마무리)

5. imagePrompt (영어, 50-80 words): Seedream 이미지 생성용
   - Start with: "The product shown in the attached image" (제품명 대신 generic 표현 사용)
   - End with: "soft professional lighting, photorealistic, 4K, commercial quality"
   - NO PEOPLE
   - NO visible studio equipment in the scene
   - Describe lighting as EFFECT only (e.g., "soft warm light from above"), NOT as equipment
   - ⚠️ FORBIDDEN WORDS: "camera", "tripod", "photographer", "filming", "behind the scenes", "DSLR", "mirrorless"
     (These words cause cameras/equipment to appear in the generated image!)
   - Describe the FINAL SCENE only, never mention filming process or equipment
   - ⚠️ WARNING: Do NOT include product name "${productName}" in the prompt - it may contain misleading words

6. videoPrompt (영어, 50-80 words): Vidu 영상 생성용
   - Start with: "The product shown in the attached image" (제품명 대신 generic 표현 사용)
   - End with: "soft natural lighting, photorealistic, 4K"
   - NO PEOPLE
   - NO visible studio equipment in the scene
   - Describe lighting as EFFECT only, NOT as equipment
   - ⚠️ FORBIDDEN WORDS: "camera", "tripod", "lens", "shot on", "filmed", "recorded", "photographer", "shooting", "capture"
     (These words cause cameras/equipment to appear in the generated video!)
   - ⚠️ WARNING: Do NOT include product name "${productName}" in the prompt - it may contain misleading words

   Motion description guidelines (describe results without mentioning camera):
   - Product motion: "slowly rotating", "gently floating", "gradually revealing"
   - Viewpoint shift: "moving closer to details", "pulling back to show full view"
   - Atmosphere: "drifting through soft light", "emerging from shadows"
   - Match motion to scene position: opening (dynamic) / middle (exploratory) / final (stable)

=== VIDEO SETTINGS ===
- aspectRatio: Choose based on content purpose
  - "16:9": Landscape, YouTube/TV ads, wide product shots
  - "9:16": Vertical, Instagram Reels/TikTok/Shorts, mobile-first
  - "1:1": Square, Instagram feed, balanced composition
- sceneCount: The number of scenes YOU decided (2-8)
- sceneDurations: Array of durations matching your sceneCount
  - RECOMMENDED: 2-4 seconds per scene (optimal for engagement and visual rhythm)
  - Range: 1-8 seconds each
  - Vary durations for rhythm (avoid same duration consecutively)

=== CRITICAL: ARRAY LENGTH CONSISTENCY ===
- sceneElements array length MUST equal sceneCount
- sceneDurations array length MUST equal sceneCount
- Example: If sceneCount is 4, provide exactly 4 sceneElements and 4 sceneDurations

=== OUTPUT FORMAT ===
1. "elements": { "mood": "overall mood in ${outputLanguage}" }
2. "sceneElements": all 6 fields for each scene (array length = sceneCount)
3. title, description, background, mood, additionalPrompt: ${outputLanguage}
4. imagePrompt, videoPrompt: English only (NEVER include product name)

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

=== SCENE COUNT (AI DECIDES) ===
Based on the product characteristics and reference style, YOU decide the optimal number of scenes (2-8).
Choose what best tells this product's story while adapting the reference style.

=== TONE & STORY CONSISTENCY ===
CRITICAL: Adapt the reference video's tone while creating a coherent product story.

1. EXTRACT TONE from reference video:
   - Identify the reference's mood, pacing, and visual style
   - Apply this tone consistently to your product scenario

2. STORY ARC structure:
   - Scene 1: Introduction/Discovery (제품과의 첫 만남)
   - Middle scenes: Exploration/Features (제품 탐색, 특징 부각)
   - Final scene: Satisfaction/Result (만족감, 결과)

3. SCENE CONTINUITY rules:
   - Each scene must logically connect to the next
   - Maintain consistent color temperature across all scenes
   - Mood can evolve but stay within the reference tone family
   - Match the reference video's transition style

=== FOR EACH SCENE, PROVIDE ===
1. background (배경/장소, 한국어): 참조 스타일을 적용하여 제품에 맞게 자유 작성
   - 이전 씬과 자연스럽게 연결되는 장소 선택

2. mood (분위기/톤, 한국어): 참조 영상의 분위기를 기반으로 제품에 맞게 자유 작성
   - 전체 톤을 유지하면서 씬별로 감정 변화 표현

3. additionalPrompt (추가 지시사항, 한국어): 참조 영상의 연출을 분석하여 적용 (자유 작성)

4. movementAmplitude: "small" | "medium" | "large" | "auto"
   - small: 미세한 움직임, 디테일 강조, 안정적 (클로즈업, 질감 표현)
   - medium: 부드러운 움직임, 제품 탐색 (기본 권장)
   - large: 역동적 움직임, 임팩트 (오프닝, 전환)
   - auto: 씬 특성에 맞게 자동 결정

   씬 위치별 권장:
   - 오프닝: medium~large (주목 유도)
   - 중간 씬: small~medium (디테일 집중)
   - 마지막 씬: small (안정감, 마무리)

5. imagePrompt (영어, 50-80 words): Seedream 이미지 생성용
   - Start with: "The product shown in the attached image" (제품명 대신 generic 표현 사용)
   - End with: "soft professional lighting, photorealistic, 4K, commercial quality"
   - NO PEOPLE
   - NO visible studio equipment in the scene
   - Describe lighting as EFFECT only (e.g., "soft warm light from above"), NOT as equipment
   - ⚠️ FORBIDDEN WORDS: "camera", "tripod", "photographer", "filming", "behind the scenes", "DSLR", "mirrorless"
     (These words cause cameras/equipment to appear in the generated image!)
   - Describe the FINAL SCENE only, never mention filming process or equipment
   - ⚠️ WARNING: Do NOT include product name "${productName}" in the prompt - it may contain misleading words

6. videoPrompt (영어, 50-80 words): Vidu 영상 생성용
   - Start with: "The product shown in the attached image" (제품명 대신 generic 표현 사용)
   - End with: "soft natural lighting, photorealistic, 4K"
   - NO PEOPLE
   - NO visible studio equipment in the scene
   - Describe lighting as EFFECT only, NOT as equipment
   - ⚠️ FORBIDDEN WORDS: "camera", "tripod", "lens", "shot on", "filmed", "recorded", "photographer", "shooting", "capture"
     (These words cause cameras/equipment to appear in the generated video!)
   - ⚠️ WARNING: Do NOT include product name "${productName}" in the prompt - it may contain misleading words

   Motion description guidelines (describe results without mentioning camera):
   - Product motion: "slowly rotating", "gently floating", "gradually revealing"
   - Viewpoint shift: "moving closer to details", "pulling back to show full view"
   - Atmosphere: "drifting through soft light", "emerging from shadows"
   - Match motion to scene position: opening (dynamic) / middle (exploratory) / final (stable)

=== VIDEO SETTINGS ===
- aspectRatio: Choose based on content purpose
  - "16:9": Landscape, YouTube/TV ads, wide product shots
  - "9:16": Vertical, Instagram Reels/TikTok/Shorts, mobile-first
  - "1:1": Square, Instagram feed, balanced composition
- sceneCount: The number of scenes YOU decided (2-8)
- sceneDurations: Array of durations matching your sceneCount
  - RECOMMENDED: 2-4 seconds per scene (optimal for engagement and visual rhythm)
  - Range: 1-8 seconds each
  - Vary durations for rhythm (avoid same duration consecutively)

=== CRITICAL: ARRAY LENGTH CONSISTENCY ===
- sceneElements array length MUST equal sceneCount
- sceneDurations array length MUST equal sceneCount
- Example: If sceneCount is 4, provide exactly 4 sceneElements and 4 sceneDurations

=== OUTPUT FORMAT ===
1. "elements": { "mood": "overall mood in ${outputLanguage}" }
2. "sceneElements": all 6 fields for each scene (array length = sceneCount)
3. title, description, background, mood, additionalPrompt: ${outputLanguage}
4. imagePrompt, videoPrompt: English only (NEVER include product name)

background, mood, additionalPrompt: Write creatively and freely based on the product.

Create 1 optimized scenario adapting the reference style.`
}
