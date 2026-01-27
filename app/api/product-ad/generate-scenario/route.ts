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

// 전체 요소 (레거시 호환 + 전체 분위기)
interface ScenarioElements {
  background: string
  mood: string
  cameraAngle: string
  productPlacement: string
  lighting: string
  colorTone: string
}

// 씬별 요소 (신규)
interface SceneElementOptions {
  background: string
  mood: string
  cameraAngle: string
  productPlacement: string
  lighting: string
  colorTone: string
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
    } = body

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    // 참조 기반인지 확인
    const isReference = !!referenceElements || !!referenceDescription

    // 프롬프트 구성
    const prompt = isReference
      ? buildReferenceBasedPrompt(productName, productDescription, sellingPoints, referenceElements, referenceDescription, sceneCount)
      : buildAiRecommendPrompt(productName, productDescription, sellingPoints, count, sceneCount)

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
        required: ['scenarios', 'reasons'],
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
                  description: '시나리오 제목 (한국어)',
                },
                description: {
                  type: Type.STRING,
                  description: '시나리오 설명 (1-2문장, 한국어)',
                },
                elements: {
                  type: Type.OBJECT,
                  description: '전체 영상의 대표 분위기/스타일 (레거시 호환)',
                  required: ['background', 'mood', 'cameraAngle', 'productPlacement', 'lighting', 'colorTone'],
                  properties: {
                    background: { type: Type.STRING, description: '대표 배경/장소' },
                    mood: { type: Type.STRING, description: '전체 분위기/톤' },
                    cameraAngle: { type: Type.STRING, description: '대표 카메라 구도' },
                    productPlacement: { type: Type.STRING, description: '대표 제품 배치' },
                    lighting: { type: Type.STRING, description: '대표 조명 스타일' },
                    colorTone: { type: Type.STRING, description: '대표 색상 톤' },
                  },
                },
                sceneElements: {
                  type: Type.ARRAY,
                  description: '씬별 광고 요소 (스토리 흐름에 맞게 연속성 있게)',
                  items: {
                    type: Type.OBJECT,
                    required: ['background', 'mood', 'cameraAngle', 'productPlacement', 'lighting', 'colorTone'],
                    properties: {
                      background: { type: Type.STRING, description: '이 씬의 배경/장소' },
                      mood: { type: Type.STRING, description: '이 씬의 분위기/톤' },
                      cameraAngle: { type: Type.STRING, description: '이 씬의 카메라 구도' },
                      productPlacement: { type: Type.STRING, description: '이 씬의 제품 배치' },
                      lighting: { type: Type.STRING, description: '이 씬의 조명 스타일' },
                      colorTone: { type: Type.STRING, description: '이 씬의 색상 톤' },
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
          reasons: {
            type: Type.OBJECT,
            description: '각 요소별 선택 이유',
            properties: {
              background: { type: Type.STRING },
              mood: { type: Type.STRING },
              cameraAngle: { type: Type.STRING },
              productPlacement: { type: Type.STRING },
              lighting: { type: Type.STRING },
              colorTone: { type: Type.STRING },
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
      reasons: Record<string, string>
    }

    return NextResponse.json({
      scenarios: result.scenarios,
      reasons: result.reasons,
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
  sceneCount: number
): string {
  return `You are an expert advertising producer specializing in product video ads.
Analyze the product information (including the product image if provided) and recommend ${count} optimal advertising scenarios.

IMPORTANT: If a product image is provided, carefully analyze its visual characteristics:
- Product shape, size, and form factor
- Colors and materials
- Packaging design
- Visual appeal and premium feel
Use these visual insights to inform your scenario recommendations.

OUTPUT LANGUAGE: Korean

=== PRODUCT INFORMATION ===
Product Name: ${productName}
Product Description: ${productDescription || 'Not provided'}
Selling Points: ${sellingPoints?.join(', ') || 'Not provided'}
Product Image: [Analyze the provided image for visual characteristics]

=== SCENE COUNT ===
Number of scenes to create: ${sceneCount}
You MUST generate exactly ${sceneCount} scene elements for each scenario.

=== SCENE-BY-SCENE STORYTELLING ===
CRITICAL: Design each scene to flow naturally into the next while maintaining the overall mood.
Think of it as a short film that tells a story about the product.
Create a unique and creative narrative arc that best suits this specific product.

=== ADVERTISING ELEMENTS ===
For EACH SCENE, specify:
1. background (배경/장소): Where is this scene set?
   - Options: 미니멀 스튜디오, 고급 인테리어, 자연 배경, 도시 풍경, 추상적 배경, 그라데이션 배경, 텍스처 배경, etc.

2. mood (분위기/톤): What feeling does this scene convey?
   - Options: 고급스럽고 우아한, 따뜻하고 친근한, 모던하고 세련된, 역동적이고 에너지틱한, 차분하고 편안한, 트렌디하고 젊은, 클래식하고 전통적인, etc.

3. cameraAngle (카메라 구도): How is the product filmed in this scene?
   - Options: 정면 클로즈업, 45도 각도, 측면 샷, 탑다운 뷰, 로우앵글, 극적인 앵글, 매크로 샷, etc.

4. productPlacement (제품 배치/연출): How is the product presented in this scene?
   - Options: 중앙 배치, 플로팅 효과, 회전하는 모션, 언박싱 연출, 사용 장면, 비교 배치, 디테일 강조, etc.

5. lighting (조명 스타일): What lighting is used in this scene?
   - Options: 스튜디오 조명, 자연광, 드라마틱 조명, 소프트 라이트, 백라이트, 네온 조명, 골든 아워, etc.

6. colorTone (색상 톤): What color palette dominates this scene?
   - Options: 밝고 화사한, 따뜻한 톤, 차가운 톤, 모노톤, 비비드 컬러, 파스텔 톤, 다크 톤, etc.

=== VIDEO SETTINGS ===
7. aspectRatio: "16:9" (landscape), "9:16" (portrait/vertical), or "1:1" (square)
8. sceneCount: Must be ${sceneCount}
9. sceneDurations: Array of ${sceneCount} durations (1-8 seconds each)

=== OUTPUT REQUIREMENTS ===
1. "elements" field: Overall/representative style for the entire video (use the dominant mood)
2. "sceneElements" array: EXACTLY ${sceneCount} elements, one for each scene
   - Each scene should build on the previous one
   - Maintain visual continuity while adding variety
   - The overall mood should be consistent but scenes can have subtle variations

Create ${count} diverse scenarios that tell different stories about the product.`
}

function buildReferenceBasedPrompt(
  productName: string,
  productDescription: string | null | undefined,
  sellingPoints: string[] | null | undefined,
  referenceElements: Record<string, string> | undefined,
  referenceDescription: string | undefined,
  sceneCount: number
): string {
  return `You are an expert advertising producer specializing in product video ads.
Based on the reference video analysis, create an advertising scenario adapted for this product.

IMPORTANT: If a product image is provided, carefully analyze its visual characteristics:
- Product shape, size, and form factor
- Colors and materials
- Packaging design
- Visual appeal and premium feel
Use these visual insights along with the reference style to create the optimal scenario.

OUTPUT LANGUAGE: Korean

=== PRODUCT INFORMATION ===
Product Name: ${productName}
Product Description: ${productDescription || 'Not provided'}
Selling Points: ${sellingPoints?.join(', ') || 'Not provided'}
Product Image: [Analyze the provided image for visual characteristics]

=== REFERENCE VIDEO ANALYSIS ===
${referenceDescription || 'No description provided'}

Reference Elements:
${referenceElements ? Object.entries(referenceElements).map(([key, value]) => `- ${key}: ${value}`).join('\n') : 'Not provided'}

=== SCENE COUNT ===
Number of scenes to create: ${sceneCount}
You MUST generate exactly ${sceneCount} scene elements.

=== TASK ===
Adapt the reference video style for this product while:
1. Keeping elements that work well for this product type
2. Adjusting elements that don't fit the product
3. Maintaining the overall feel but optimizing for this specific product
4. Creating ${sceneCount} scenes that tell a cohesive story

=== OUTPUT REQUIREMENTS ===
1. "elements" field: Overall/representative style (based on reference mood)
2. "sceneElements" array: EXACTLY ${sceneCount} scene-specific elements
   - Each scene should flow naturally into the next
   - Adapt the reference style scene by scene

Create 1 optimized scenario that combines the reference style with this product's unique characteristics.
Explain why each element was chosen (kept from reference or adapted).`
}
