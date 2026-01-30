/**
 * 씬별 영상 프롬프트 생성 API (Vidu Q2 / Kling O1용)
 *
 * POST: 시나리오 정보를 기반으로 각 씬의 개별 영상 프롬프트를 생성합니다.
 * - 각 씬은 개별 영상으로 생성된 후 나중에 합쳐짐
 * - 씬별로 다른 배경, 조명, 카메라 앵글 등 개별 설정 지원
 * - 모든 씬의 톤앤매너/색감이 일관되어야 자연스러운 합성 가능
 * - 사람/얼굴 제외, 제품 중심 광고
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI, GenerateContentConfig, ThinkingLevel, Type } from '@google/genai'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

const MODEL_NAME = 'gemini-3-flash-preview'

// 씬별 광고 요소
interface SceneElementOptions {
  background: string
  mood: string
  cameraAngle: string
  productPlacement: string
  lighting: string
  colorTone: string
}

// 레거시 호환용 (전체 요소)
interface ScenarioElements {
  background: string
  mood: string
  cameraAngle: string
  productPlacement: string
  lighting: string
  colorTone: string
}

interface GenerateMultiSceneRequest {
  productName: string
  productDescription?: string | null
  productImageUrl?: string | null
  sellingPoints?: string[] | null
  sceneElements?: SceneElementOptions[]  // 씬별 광고 요소 (신규)
  scenarioElements?: ScenarioElements  // 레거시 호환 (전체 요소)
  overallMood?: string  // 전체 분위기
  scenarioDescription?: string
  sceneCount?: number
  totalDuration?: number
}

interface SceneOutput {
  index: number
  scenePrompt: string
  duration: number
  movementAmplitude: 'auto' | 'small' | 'medium' | 'large'
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

    const body: GenerateMultiSceneRequest = await request.json()
    const {
      productName,
      productDescription,
      productImageUrl,
      sellingPoints,
      sceneElements,  // 씬별 요소 (신규)
      scenarioElements,  // 레거시 호환
      overallMood,
      scenarioDescription,
      sceneCount = 3,
      totalDuration = 15,
    } = body

    // sceneElements 또는 scenarioElements 중 하나는 필수
    if (!productName || (!sceneElements && !scenarioElements)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 씬별 요소가 없으면 레거시 요소로 모든 씬에 동일하게 적용
    const resolvedSceneElements: SceneElementOptions[] = sceneElements
      ? sceneElements
      : Array(sceneCount).fill(scenarioElements)

    // 각 씬의 평균 길이 계산
    const avgDuration = Math.min(10, Math.max(3, Math.floor(totalDuration / (sceneCount - 1))))

    // 제품 이미지 base64 변환
    let productImageData: { base64: string; mimeType: string } | null = null
    if (productImageUrl) {
      productImageData = await fetchImageAsBase64(productImageUrl)
    }

    const prompt = buildMultiScenePrompt(
      productName,
      productDescription,
      sellingPoints,
      resolvedSceneElements,
      overallMood,
      scenarioDescription,
      sceneCount,
      avgDuration
    )

    const config: GenerateContentConfig = {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        required: ['scenes', 'visualStyle'],
        properties: {
          scenes: {
            type: Type.ARRAY,
            description: '생성된 씬별 개별 영상 프롬프트 배열',
            items: {
              type: Type.OBJECT,
              required: ['index', 'scenePrompt', 'duration', 'movementAmplitude'],
              properties: {
                index: {
                  type: Type.NUMBER,
                  description: '씬 인덱스 (0부터 시작)',
                },
                scenePrompt: {
                  type: Type.STRING,
                  description: '이 씬의 개별 영상 프롬프트 - 모션 포함, 사람 제외, 40-60단어 (영어)',
                },
                duration: {
                  type: Type.NUMBER,
                  description: '씬 영상 길이 (초, 3-8)',
                },
                movementAmplitude: {
                  type: Type.STRING,
                  description: '카메라/모션 강도',
                  enum: ['auto', 'small', 'medium', 'large'],
                },
              },
            },
          },
          visualStyle: {
            type: Type.STRING,
            description: '모든 씬에 적용된 공통 시각적 스타일 요약 (영어)',
          },
          narrativeFlow: {
            type: Type.STRING,
            description: '전체 영상의 내러티브 흐름 설명 (한국어)',
          },
        },
      },
    }

    // 멀티모달 콘텐츠 구성
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

    if (productImageData) {
      parts.push({
        inlineData: {
          mimeType: productImageData.mimeType,
          data: productImageData.base64,
        },
      })
    }

    parts.push({ text: prompt })

    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts }],
      config,
    })

    const responseText = response.text || ''
    const result = JSON.parse(responseText) as {
      scenes: SceneOutput[]
      visualStyle?: string
      narrativeFlow?: string
    }

    return NextResponse.json({
      scenes: result.scenes,
      visualStyle: result.visualStyle,
      narrativeFlow: result.narrativeFlow,
    })
  } catch (error) {
    console.error('멀티씬 시나리오 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate multi-scene scenario' },
      { status: 500 }
    )
  }
}

function buildMultiScenePrompt(
  productName: string,
  productDescription: string | null | undefined,
  sellingPoints: string[] | null | undefined,
  sceneElements: SceneElementOptions[],
  overallMood: string | undefined,
  scenarioDescription: string | undefined,
  sceneCount: number,
  avgDuration: number
): string {
  // 셀링 포인트 포맷팅
  const sellingPointsText = sellingPoints && sellingPoints.length > 0
    ? sellingPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')
    : 'Not provided'

  // 씬별 요소 설명 생성
  const sceneElementsDescription = sceneElements.map((elem, idx) => `
=== SCENE ${idx + 1} SPECIFIC ELEMENTS ===
- Background: ${elem.background || 'Clean seamless backdrop'}
- Mood: ${elem.mood || overallMood || 'Premium commercial'}
- Camera Angle: ${elem.cameraAngle || 'Cinematic'}
- Product Placement: ${elem.productPlacement || 'Center hero'}
- Lighting: ${elem.lighting || 'Professional even lighting'}
- Color Tone: ${elem.colorTone || 'Natural'}
`).join('\n')

  // 대표 색상 톤 (일관성 유지용)
  const primaryColorTone = sceneElements[0]?.colorTone || overallMood || 'cinematic'

  return `You are an expert advertising video director creating a PREMIUM AD CAMPAIGN with ${sceneCount} scenes.

🎬 GOAL: Create ${sceneCount} SCENES where EACH scene uses its OWN specific elements listed below.
IMPORTANT: Each scene has DIFFERENT settings - USE the specific elements for EACH scene.

=== CRITICAL RULES ===
❌ ABSOLUTELY NO PEOPLE:
- NO humans, faces, hands, body parts, silhouettes
- ONLY the product, objects, environment, and natural elements

✅ OUTPUT LANGUAGE:
- scenePrompt: English only (for AI video generation)
- visualStyle: English (shared style description)
- narrativeFlow: Korean (for user)

⭐ MUST REFERENCE THE ATTACHED IMAGE:
- Each scenePrompt MUST start with "The product shown in the attached image" or similar
- This ensures the AI uses the EXACT product appearance

=== PRODUCT INFORMATION ===
Product Name: ${productName}
Product Description: ${productDescription || 'Not provided'}
Product Selling Points:
${sellingPointsText}
Product Image: [ATTACHED - This is the PRODUCT to feature]

=== OVERALL MOOD (전체 톤앤매너) ===
${overallMood || 'Premium commercial style'}
${scenarioDescription ? `Scenario Description: ${scenarioDescription}` : ''}

=== ⚠️ SCENE-SPECIFIC ELEMENTS (각 씬별 개별 설정 - 매우 중요!) ===
EACH SCENE HAS DIFFERENT SETTINGS. You MUST use the specific elements for each scene:

${sceneElementsDescription}

⚠️ IMPORTANT:
- Scene 1 MUST use Scene 1's background, lighting, camera angle, etc.
- Scene 2 MUST use Scene 2's settings, which may be DIFFERENT from Scene 1
- And so on for all scenes
- This creates visual variety while maintaining the overall mood

=== 🎨 VISUAL CONSISTENCY (톤앤매너 통일) ===
While scenes have DIFFERENT settings, they should share:
1. **Same overall mood/feeling**: ${overallMood || 'Premium commercial'}
2. **Quality level**: All scenes should feel like same premium campaign
3. **Transition flow**: Scenes should connect naturally

=== SCENE PROMPT STRUCTURE (50-80 words) ===
Each scenePrompt MUST:
1. START by identifying the product: "The ${productName} shown in the attached image"
2. Use THAT SCENE's specific background, lighting, camera angle from the elements above
3. Be UNIQUE based on its specific elements
4. End with: "[THAT SCENE'S COLOR TONE] tones, cinematic lighting, photorealistic, 4K"

=== VIDU Q2 VIDEO AI RULES ===
- NO text/label rendering expectations
- Simple surface descriptions (no contradictions)
- ALL camera movements MUST include "slowly"
- Maximum 2 visual effects per scene

=== 🎚️ MOVEMENT AMPLITUDE ===
- "small": Static, elegant (close-up, detail shots)
- "medium": Moderate camera movement (recommended)
- "large": Dynamic, energetic (opening/closing)

=== DURATION ===
Each scene: ${avgDuration} seconds (range: 3-8)

Generate ${sceneCount} CONNECTED scene prompts for "${productName}".
Create a unique and creative narrative flow that best highlights this specific product's characteristics.

⚠️ MANDATORY:
1. Each scene MUST use ITS OWN specific elements from the list above
2. Scene 1 uses Scene 1 elements, Scene 2 uses Scene 2 elements, etc.
3. Scenes should flow together as one story while having VISUAL VARIETY
4. NO REAL PEOPLE - only product and environment
5. Each prompt ends with that scene's color tone + "cinematic lighting, photorealistic, 4K"
6. End visualStyle with: "Overall mood: ${primaryColorTone}, premium commercial quality"`
}
