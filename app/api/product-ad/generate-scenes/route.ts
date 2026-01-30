/**
 * 제품 광고 첫 씬 생성 API
 *
 * POST: 시나리오 정보와 제품 이미지를 기반으로 첫 씬 이미지를 생성합니다.
 * Seedream 4.5를 사용하여 3가지 변형을 생성합니다.
 *
 * 특징:
 * - 사람/얼굴 제외, 제품 중심 광고
 * - ⭐ 프리미엄 3D 상업 스타일 (동적 요소, 스플래시, 공중 부유 효과)
 * - 시네마틱 스튜디오 조명 (밝은 하이라이트, 선명한 그림자, 높은 대비)
 * - 동적 프롬프트 (60-100 단어)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI, GenerateContentConfig, ThinkingLevel, Type } from '@google/genai'
import {
  createEditTask,
  type EditAspectRatio,
} from '@/lib/kie/client'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

const MODEL_NAME = 'gemini-3-flash-preview'

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

interface ScenarioElements {
  background: string
  mood: string
  cameraAngle: string
  productPlacement: string
  lighting: string
  colorTone: string
}

interface GenerateScenesRequest {
  productId: string
  productName: string
  productImageUrl: string
  scenarioElements: ScenarioElements
  aspectRatio: '16:9' | '9:16' | '1:1'
  count?: number  // 생성할 씬 수 (기본 3)
}

// 비율 매핑 (Seedream 4.5용)
function mapAspectRatio(ratio: '16:9' | '9:16' | '1:1'): EditAspectRatio {
  const mapping: Record<string, EditAspectRatio> = {
    '16:9': '16:9',  // 가로형
    '9:16': '9:16',  // 세로형
    '1:1': '1:1',    // 정방형
  }
  return mapping[ratio] || '9:16'
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

    const body: GenerateScenesRequest = await request.json()
    const {
      productName,
      productImageUrl,
      scenarioElements,
      aspectRatio,
      count = 3,
    } = body

    if (!productName || !productImageUrl || !scenarioElements) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // LLM으로 첫 씬 프롬프트 생성 (3가지 변형)
    const prompts = await generateFirstScenePrompts(
      productName,
      productImageUrl,
      scenarioElements,
      count
    )

    // 각 프롬프트로 Seedream 4.5로 이미지 생성 요청
    const requests = await Promise.all(
      prompts.map(async (prompt) => {
        const result = await createEditTask({
          prompt,
          image_urls: [productImageUrl],
          aspect_ratio: mapAspectRatio(aspectRatio),
          quality: 'high',
        })
        return {
          requestId: `kie:${result.taskId}`,
          prompt,
        }
      })
    )

    return NextResponse.json({
      requests,
    })
  } catch (error) {
    console.error('첫 씬 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate first scenes' },
      { status: 500 }
    )
  }
}

async function generateFirstScenePrompts(
  productName: string,
  productImageUrl: string,
  elements: ScenarioElements,
  count: number
): Promise<string[]> {
  const prompt = `You are an expert advertising image prompt engineer for PRODUCT-ONLY commercials.
Create ${count} different image generation prompts for a PREMIUM 3D COMMERCIAL-STYLE product advertisement scene.

=== CRITICAL RULES ===
⚠️ ABSOLUTELY NO PEOPLE:
- NO humans, faces, hands, body parts, silhouettes, or human shadows
- NO models, actors, avatars, or any person-like elements
- ONLY the product, objects, environment, and natural elements
- If interaction is needed, use artistic props like wooden hand sculptures or elegant product stands

⚠️ ABSOLUTELY NO VISIBLE PRODUCTION EQUIPMENT:
- NO cameras, tripods, lighting rigs, softboxes, ring lights, reflectors, or any studio equipment
- NO behind-the-scenes elements, production setups, or filming equipment
- Describe lighting as EFFECT only (e.g., "bright highlights", "soft shadows"), NOT as visible equipment
- The image should look like a FINAL ADVERTISEMENT, not a behind-the-scenes photo

OUTPUT LANGUAGE: English (prompts must be in English for AI image generation)

=== PRODUCT INFORMATION ===
Product Name: ${productName}
Product Image: [The product image is provided as reference]

=== SCENARIO ELEMENTS ===
Background/Location: ${elements.background}
Mood/Tone: ${elements.mood}
Camera Angle: ${elements.cameraAngle}
Product Placement: ${elements.productPlacement}
Lighting Style: ${elements.lighting}
Color Tone: ${elements.colorTone}

=== ⭐ PREMIUM 3D COMMERCIAL STYLE (매우 중요!) ===
Create ultra-realistic, visually striking 3D commercial-style product shots with these elements:

1. **Product Presentation**:
   - Product suspended mid-air or dynamically positioned
   - Slightly tilted to convey movement and sophistication
   - Intricate condensation droplets on surface (if applicable)
   - Clear label visibility with subtle reflections

2. **Dynamic Elements (REQUIRED)**:
   - Splashing liquid/droplets frozen in high-speed motion
   - Floating ingredients related to product (fruits, leaves, ice cubes, etc.)
   - Each element sharply defined with vibrant clarity
   - Frozen motion effect for energy and freshness

3. **Background & Color**:
   - Rich gradient background complementing product color
   - Deep, vibrant colors that evoke premium quality
   - Subtle reflections beneath product for depth

4. **Lighting (Cinematic Commercial-Style) - EFFECT ONLY, NO VISIBLE EQUIPMENT**:
   - Bright highlights reflecting off product surface
   - Crisp shadows with high contrast
   - Professional lighting EFFECT creating luxurious, polished look (NOT visible lighting equipment)
   - Dramatic lighting for visual impact
   - NEVER mention softbox, ring light, studio light, or any visible equipment

5. **Quality Keywords to Include**:
   - "ultra-realistic 3D commercial-style"
   - "frozen in high-speed motion"
   - "cinematic professional lighting effect" (NOT visible equipment)
   - "premium quality, luxurious aesthetic"
   - "Ultra-HD, photorealistic"
   - "no visible studio equipment, pure advertisement"

=== PROMPT STRUCTURE (60-100 words) ===
Start with: "Create an ultra-realistic 3D commercial-style product shot of [product]..."
Include: Dynamic elements, frozen motion, lighting description, background, quality keywords

=== EXAMPLE PROMPT ===
"Create an ultra-realistic 3D commercial-style product shot of a premium [product] bottle, suspended mid-air with intricate condensation droplets. Surround with dynamic splashing droplets and floating [related ingredients] frozen in high-speed motion. Rich [color] gradient background. Cinematic lighting effect with bright highlights, crisp shadows, high contrast. Product slightly tilted conveying movement. Luxurious, polished look. Ultra-HD, photorealistic. No visible studio equipment or production setup."

=== ⭐ VISUAL CONSISTENCY (매우 중요!) ===
ALL ${count} variations MUST share the SAME visual DNA to ensure cohesive look:
- **SAME Color Palette**: Identical color tones based on scenario (e.g., all warm golden, all cool blue)
- **SAME Lighting Setup**: Consistent lighting style (e.g., all "cinematic professional lighting with bright highlights")
- **SAME Background Style**: Same background family (e.g., all gradient backgrounds, all marble surfaces)
- **SAME Quality Keywords**: Include identical ending keywords: "Ultra-HD, photorealistic, premium commercial, cinematic"

The variations should differ ONLY in:
- Camera angle / composition
- Amount of dynamic elements
- Product tilt/rotation

=== VARIATION GUIDELINES ===
All variations must look like they belong to the SAME AD CAMPAIGN:

- Version 1: Hero shot with maximum dynamic elements (splashes, floating ingredients)
  * Camera: Front-facing hero angle, product centered
  * Most dramatic splash/motion effects

- Version 2: Elegant profile with dramatic lighting and reflections
  * Camera: 45-degree side angle showcasing product depth
  * Emphasis on lighting and reflections, moderate motion effects

- Version 3: Top-down creative composition with atmospheric effects
  * Camera: 30-degree overhead angle revealing product top
  * Unique perspective, subtle motion effects, emphasis on atmosphere

Generate ${count} prompts optimized for PREMIUM 3D COMMERCIAL-STYLE product advertisement.
- NO PEOPLE
- NO visible studio equipment, cameras, tripods, lighting rigs, softboxes, or production setup
All prompts must share the SAME tone, color palette, and quality keywords for visual consistency.`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['prompts'],
      properties: {
        prompts: {
          type: Type.ARRAY,
          description: '생성된 프리미엄 3D 상업 스타일 이미지 프롬프트 배열 - 사람 제외, 60-100단어, 동적 요소/스플래시/공중 부유 효과 포함 (영어)',
          items: {
            type: Type.STRING,
          },
        },
      },
    },
  }

  // Build multimodal contents
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // 제품 이미지를 base64로 변환하여 추가
  const imageData = await fetchImageAsBase64(productImageUrl)
  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: imageData.mimeType,
        data: imageData.base64,
      },
    })
  }

  // 프롬프트 추가
  parts.push({ text: prompt })

  // Gemini에 전달
  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    config,
  })

  const responseText = response.text || ''
  const result = JSON.parse(responseText) as { prompts: string[] }

  return result.prompts
}
