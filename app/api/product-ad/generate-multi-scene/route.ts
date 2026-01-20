/**
 * 씬별 영상 프롬프트 생성 API (Vidu Q2 / Kling O1용)
 *
 * POST: 시나리오 정보를 기반으로 각 씬의 개별 영상 프롬프트를 생성합니다.
 * - 각 씬은 개별 영상으로 생성된 후 나중에 합쳐짐
 * - 모든 씬의 톤앤매너/색감/조명이 일관되어야 자연스러운 합성 가능
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
  scenarioElements: ScenarioElements
  scenarioDescription?: string
  sceneCount?: number  // 생성할 씬 수 (기본 3)
  totalDuration?: number  // 전체 영상 길이 (초)
}

interface SceneOutput {
  index: number
  scenePrompt: string       // 이 씬의 개별 영상 프롬프트 - 모션 포함, 사람 제외 (영어)
  duration: number          // 씬 영상 길이 (3-8초)
  movementAmplitude: 'auto' | 'small' | 'medium' | 'large'  // 카메라/모션 강도
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
      scenarioElements,
      scenarioDescription,
      sceneCount = 3,
      totalDuration = 15,
    } = body

    if (!productName || !scenarioElements) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 각 씬의 평균 길이 계산 (최소 3초, 최대 10초)
    const avgDuration = Math.min(10, Math.max(3, Math.floor(totalDuration / (sceneCount - 1))))

    // 제품 이미지 base64 변환 (있을 경우)
    let productImageData: { base64: string; mimeType: string } | null = null
    if (productImageUrl) {
      productImageData = await fetchImageAsBase64(productImageUrl)
    }

    const prompt = buildMultiScenePrompt(
      productName,
      productDescription,
      scenarioElements,
      scenarioDescription,
      sceneCount,
      avgDuration
    )

    const config: GenerateContentConfig = {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MEDIUM,
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
                  description: '카메라/모션 강도: small(정적, 미세한 움직임), medium(적당한 카메라 이동), large(역동적 움직임), auto(자동)',
                  enum: ['auto', 'small', 'medium', 'large'],
                },
              },
            },
          },
          visualStyle: {
            type: Type.STRING,
            description: '모든 씬에 적용된 공통 시각적 스타일 (조명, 색감, 분위기) 요약 - 영어',
          },
          narrativeFlow: {
            type: Type.STRING,
            description: '전체 영상의 내러티브 흐름 설명 (한국어)',
          },
        },
      },
    }

    // 멀티모달 콘텐츠 구성 (이미지 + 텍스트)
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

    // 제품 이미지가 있으면 먼저 추가
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
  elements: ScenarioElements,
  scenarioDescription: string | undefined,
  sceneCount: number,
  avgDuration: number
): string {
  return `You are an expert advertising video director creating a PREMIUM AD CAMPAIGN with multiple creative scenes.

🎬 GOAL: Create ${sceneCount} DISTINCTLY DIFFERENT scenes that feel like a cohesive professional advertisement.
Each scene should tell a different part of the product story while maintaining the same premium mood.

=== CRITICAL RULES ===
❌ ABSOLUTELY NO PEOPLE:
- NO humans, faces, hands, body parts, silhouettes
- ONLY the product, objects, environment, and natural elements

✅ OUTPUT LANGUAGE:
- scenePrompt: English only (for AI video generation)
- visualStyle: English (shared style description)
- narrativeFlow: Korean (for user)

⭐ MUST REFERENCE THE ATTACHED IMAGE:
- Each scenePrompt MUST start with "The product shown in the attached image" or "The exact product from the reference image"
- This ensures the AI image generator uses the EXACT product appearance from the attached image
- Describe how THIS SPECIFIC PRODUCT (from the image) is positioned and lit in each scene

=== PRODUCT INFORMATION (⚠️ CRITICAL - READ CAREFULLY) ===
Product Name: ${productName}
Product Description: ${productDescription || 'Not provided'}
Product Image: [ATTACHED - This is the PRODUCT to feature]

⚠️ PRODUCT IDENTIFICATION:
- The attached image shows the PRODUCT: "${productName}"
- This is a COMMERCIAL PRODUCT for advertisement, NOT a living being
- Even if the product looks like a person (figurine, doll, statue, mannequin, action figure, character merchandise), it is a PRODUCT ITEM to be showcased
- Treat the product as an OBJECT/ITEM to be displayed elegantly in commercial scenes
- Examples of products that may look human-like but are PRODUCTS:
  * Figurines, action figures, collectibles → Product items to display
  * Dolls, plush toys → Product items to showcase
  * Statues, sculptures → Art products to feature
  * Mannequins with clothing → Fashion products to advertise

=== SCENARIO ELEMENTS ===
Background/Location: ${elements.background}
Mood/Tone: ${elements.mood}
Camera Angle: ${elements.cameraAngle}
Product Placement: ${elements.productPlacement}
Lighting Style: ${elements.lighting}
Color Tone: ${elements.colorTone}
${scenarioDescription ? `Scenario Description: ${scenarioDescription}` : ''}

=== ⭐ CREATIVE VARIETY (매우 중요!) ===
Think like a premium ad campaign director. Each scene should be VISUALLY DISTINCT:

1. **DIFFERENT COMPOSITIONS** - Each scene needs unique visual storytelling:
   - Scene with product as hero (center focus, dramatic)
   - Scene with product in context (lifestyle setting, environment)
   - Scene with dynamic elements (motion, particles, splashes)
   - Scene with detail/texture focus (macro, close-up details)
   - Scene with atmospheric mood (lighting effects, shadows)

2. **DIFFERENT VISUAL ELEMENTS** - Pick ONLY 1-2 per scene (not multiple):
   - Floating particles drifting slowly upward
   - Soft mist or steam rising gently
   - Fabric or petals falling slowly
   - Subtle light beams or rim lighting
   - Gentle reflections on surface
   ⚠️ LIMIT: Maximum 2 effects per scene for clean AI video generation

3. **DIFFERENT CAMERA PERSPECTIVES** - Not just angle changes:
   - Wide establishing shot → intimate close-up
   - Macro detail shot → environmental context
   - Dynamic movement → static elegance
   - Top-down flat lay → dramatic low angle

=== ⚠️ VIDU Q2 VIDEO AI OPTIMIZATION (매우 중요!) ===
These prompts will be used by Vidu Q2 AI video generator. Follow these rules STRICTLY:

1. **NO TEXT RENDERING** - Never mention product text, labels, or brand names to "pop" or be visible
   - AI video CANNOT maintain text - it will distort and look bad
   - ❌ WRONG: "making the 'Brand Name' text pop"
   - ✅ CORRECT: Just describe the product visually without text expectations

2. **SIMPLE SURFACE DESCRIPTIONS** - No contradictions
   - ❌ WRONG: "polished, reflective frosted glass" (contradiction)
   - ✅ CORRECT: "smooth dark reflective surface" OR "matte frosted surface" (pick one)

3. **SPECIFIC CAMERA MOVEMENTS** - Always include "slowly" and direction
   - ❌ WRONG: "Camera pulls back" (vague)
   - ✅ CORRECT: "Camera slowly pulls back to reveal the full product"
   - ✅ CORRECT: "Slow cinematic dolly out revealing full product"

4. **LIMIT VISUAL EFFECTS** - Maximum 2 effects per scene
   - ❌ WRONG: "lens flares + micro-particles + backlighting + silhouette" (too many)
   - ✅ CORRECT: "rim lighting creates silhouette, tiny particles float slowly upward"

5. **USE SIMPLE, CLEAR LANGUAGE** - Short sentences, concrete verbs
   - ❌ WRONG: "ethereal light rays streaming through and illuminating"
   - ✅ CORRECT: "soft light beams shine through"

=== 🎨 MOOD CONSISTENCY (톤앤매너 통일) ===
While scenes are VISUALLY DIFFERENT, they should share the SAME FEELING:

1. **SAME COLOR GRADING** - Consistent color temperature and mood
   - Use the same color tone keywords in all scenes
   - Example: "warm golden tones" or "cool blue atmosphere"

2. **SAME QUALITY LEVEL** - Premium, cinematic feel throughout
   - End every prompt with: "premium commercial, cinematic lighting, photorealistic, 4K"

3. **SAME BRAND FEELING** - Cohesive luxury/premium aesthetic
   - All scenes should feel like they belong to the same brand campaign

=== SCENE PROMPT STRUCTURE (50-80 words) ===
Each scenePrompt MUST:
1. START by identifying the product: "The [product type: ${productName}] shown in the attached image"
2. Clearly state it's a PRODUCT/ITEM being showcased (not a living being)
3. Be UNIQUE and CREATIVE
4. Follow this structure:

[Product identification with name]. [Scene concept]. [How the PRODUCT ITEM is positioned/displayed]. [Specific visual elements]. [Camera movement]. [Atmospheric details]. [Color/mood keywords]. [Quality keywords].

Example format: "The ${productName} product shown in the attached image is elegantly displayed on..."

=== 🎥 VIDU Q2 OPTIMIZED SCENE EXAMPLES ===
These examples follow all Vidu Q2 optimization rules. Use "${productName}" as the product name.
Each example includes recommended movementAmplitude value.

Scene Type A - Hero Shot (clean, minimal effects) → movementAmplitude: "medium"
"The ${productName} product from the attached image stands centered on a smooth dark reflective surface. Warm rim lighting creates a soft glowing silhouette around this product item. Tiny luminous particles float slowly upward in the background. Camera slowly pushes in toward the product. Premium product showcase, warm golden tones, cinematic lighting, 4K."

Scene Type B - Dynamic Elements (limit to 1-2 effects) → movementAmplitude: "medium"
"The ${productName} product shown in the attached image displayed with gentle water droplets suspended around it. Soft backlighting highlights the product item edges. Camera slowly arcs around the product revealing different angles. Clean product presentation, warm golden tones, professional lighting, 4K."

Scene Type C - Atmospheric Mood (simple, clear language) → movementAmplitude: "small"
"The ${productName} product from the attached image emerges from soft rising mist. Warm light beams shine from behind this product item. Camera slowly reveals the product through clearing haze. Dreamy product showcase, warm golden tones, cinematic lighting, 4K."

Scene Type D - Detail Focus (no text expectations) → movementAmplitude: "small"
"Close-up of the ${productName} product from the attached image showing surface details and shape. Soft bokeh lights glow in the dark background behind this product item. Camera slowly pulls back to reveal the full product. Intimate product showcase, warm golden tones, professional lighting, 4K."

Scene Type E - Environmental Context (concrete simple descriptions) → movementAmplitude: "medium"
"The ${productName} product from the attached image placed elegantly among smooth stones and green leaves. Soft natural light falls on this product item creating gentle shadows. Camera slowly glides past revealing the scene. Nature meets luxury, warm golden tones, cinematic lighting, 4K."

✅ NOTICE: Each example uses:
- Simple surface descriptions (no contradictions)
- "slowly" in all camera movements
- Maximum 2 visual effects per scene
- NO text/label rendering expectations
- Short, clear sentences
- Appropriate movementAmplitude for the scene type

=== CAMERA MOVEMENTS (⚠️ ALWAYS include "slowly") ===
✅ CORRECT camera movement phrases:
- "Camera slowly pushes in toward the product"
- "Camera slowly pulls back to reveal the full product"
- "Camera slowly arcs around the product"
- "Camera slowly glides past revealing the scene"
- "Camera slowly tilts up/down"
- "Slow cinematic dolly out"
- "Slow zoom into product details"

❌ WRONG (too vague):
- "Camera pulls back" (missing speed)
- "Camera moves around" (no direction)

=== 🎚️ MOVEMENT AMPLITUDE (Vidu Q2 Parameter) ===
For each scene, choose the appropriate movementAmplitude value:

- **"small"** - For static, elegant shots with minimal movement
  * Close-up detail shots, product hero shots
  * Subtle particle floating, gentle light shifts
  * Best for: luxurious, sophisticated feel

- **"medium"** - For moderate camera movement (RECOMMENDED for most scenes)
  * Slow push-in, gentle arc around product
  * Balanced motion that feels cinematic
  * Best for: professional commercial look

- **"large"** - For dynamic, energetic shots
  * Dramatic reveals, sweeping camera moves
  * More particles, faster environmental motion
  * Best for: attention-grabbing opening/closing shots

- **"auto"** - Let AI decide (use sparingly)
  * Only when unsure about the right intensity

💡 TIP: Vary movementAmplitude across scenes for visual rhythm:
- Scene 1 (opening): "medium" or "large" for attention
- Middle scenes: "small" or "medium" for elegance
- Final scene: "medium" for memorable close

=== DURATION ===
- Each scene: ${avgDuration} seconds (range: 3-8)

=== NARRATIVE FLOW ===
Create a visual story arc:
- Opening: Intriguing, attention-grabbing
- Middle: Explore different aspects, build interest
- Closing: Memorable hero moment, brand statement

Generate ${sceneCount} CREATIVELY DIVERSE scene prompts for "${productName}".

⚠️ CRITICAL REQUIREMENTS:
1. Each prompt MUST start with "The ${productName} product from the attached image" to identify the exact product
2. Use words like "product", "item", "displayed", "showcased" to clarify it's a PRODUCT being advertised
3. Even if the product resembles a human (figurine, doll, statue), describe it as a PRODUCT ITEM
4. Each scene must be DISTINCTLY DIFFERENT while sharing the same premium mood and color tone
5. NO REAL PEOPLE - only the product and environment elements

⚠️ VIDU Q2 VIDEO AI RULES (MANDATORY):
6. NO text/label rendering expectations - never mention product text or brand names
7. Simple surface descriptions - no contradictions (e.g., NOT "reflective frosted")
8. ALL camera movements MUST include "slowly" (e.g., "Camera slowly pulls back")
9. Maximum 2 visual effects per scene - keep it clean and achievable
10. Use short, clear sentences with concrete verbs`
}
