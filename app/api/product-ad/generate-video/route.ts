/**
 * 제품 광고 영상 생성 API
 *
 * POST: 선택된 첫 씬 이미지로 Seedance 1.5를 사용하여 영상을 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { GoogleGenAI, GenerateContentConfig, ThinkingLevel, Type } from '@google/genai'
import {
  submitSeedanceToQueue,
  submitWan26ToQueue,
  type SeedanceAspectRatio,
  type SeedanceDuration,
  type Wan26Duration,
  type Wan26Resolution,
} from '@/lib/kie/client'
import { PRODUCT_AD_VIDEO_CREDIT_COST } from '@/lib/credits'

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

type VideoModel = 'seedance' | 'kling2.6' | 'wan2.6'

interface GenerateVideoRequest {
  draftId?: string
  startFrameUrl: string
  productName: string
  scenarioElements: ScenarioElements
  aspectRatio: '16:9' | '9:16' | '1:1'
  duration: number  // 4, 8, 12
  multiShot?: boolean  // 멀티샷 모드
  videoCount?: number  // 생성할 영상 개수 (1-3)
  videoModel?: VideoModel  // 영상 생성 모델 (기본: seedance)
}

// 비율 매핑 (Seedance용)
function mapAspectRatioForSeedance(ratio: '16:9' | '9:16' | '1:1'): SeedanceAspectRatio {
  const mapping: Record<string, SeedanceAspectRatio> = {
    '16:9': '16:9',
    '9:16': '9:16',
    '1:1': '1:1',
  }
  return mapping[ratio] || '9:16'
}

// Duration 매핑 (Seedance는 4, 8, 12초 지원)
function mapDurationForSeedance(duration: number): SeedanceDuration {
  if (duration <= 5) return '4'
  if (duration <= 10) return '8'
  return '12'
}

// Duration 매핑 (Wan 2.6은 5, 10, 15초 지원)
function mapDurationForWan26(duration: number): Wan26Duration {
  if (duration <= 7) return '5'
  if (duration <= 12) return '10'
  return '15'
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

    const body: GenerateVideoRequest = await request.json()
    const {
      draftId,
      startFrameUrl,
      productName,
      scenarioElements,
      aspectRatio,
      duration,
      multiShot = false,
      videoCount = 1,
      videoModel = 'seedance',
    } = body

    if (!startFrameUrl || !productName || !scenarioElements) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 생성할 영상 개수 제한 (최대 3개)
    const count = Math.min(Math.max(videoCount, 1), 3)

    // 크레딧 계산
    const getVideoCreditCost = (): number => {
      if (videoModel === 'wan2.6') {
        const durationKey = duration <= 7 ? 5 : duration <= 12 ? 10 : 15
        return PRODUCT_AD_VIDEO_CREDIT_COST['wan2.6'][durationKey as keyof typeof PRODUCT_AD_VIDEO_CREDIT_COST['wan2.6']]
      }
      // seedance (default)
      const durationKey = duration <= 5 ? 4 : duration <= 10 ? 8 : 12
      return PRODUCT_AD_VIDEO_CREDIT_COST.seedance[durationKey as keyof typeof PRODUCT_AD_VIDEO_CREDIT_COST.seedance]
    }
    const creditCostPerVideo = getVideoCreditCost()
    const totalCreditCost = creditCostPerVideo * count

    // 트랜잭션으로 크레딧 확인 및 차감 (원자적 처리)
    try {
      await prisma.$transaction(async (tx) => {
        const profile = await tx.profiles.findUnique({
          where: { id: user.id },
          select: { credits: true },
        })

        if (!profile || (profile.credits ?? 0) < totalCreditCost) {
          throw new Error('INSUFFICIENT_CREDITS')
        }

        await tx.profiles.update({
          where: { id: user.id },
          data: { credits: { decrement: totalCreditCost } },
        })
      }, { timeout: 10000 })
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
        const profile = await prisma.profiles.findUnique({
          where: { id: user.id },
          select: { credits: true },
        })
        return NextResponse.json(
          { error: 'Insufficient credits', required: totalCreditCost, available: profile?.credits ?? 0 },
          { status: 402 }
        )
      }
      throw error
    }

    // 각 영상에 대해 프롬프트 생성 및 요청
    const requests: { requestId: string; prompt: string }[] = []

    try {
      for (let i = 0; i < count; i++) {
        // 모델별 최적화된 프롬프트 생성
        const videoPrompt = multiShot
          ? await generateMultiShotPrompt(productName, scenarioElements, duration, videoModel, i)
          : await generateVideoPrompt(productName, scenarioElements, duration, videoModel, i)

        let result: { request_id: string }

        // 모델에 따라 다른 API 호출
        switch (videoModel) {
          case 'wan2.6':
            result = await submitWan26ToQueue(
              startFrameUrl,
              videoPrompt,
              {
                duration: mapDurationForWan26(duration),
                resolution: '720p' as Wan26Resolution,
                multiShots: multiShot,  // 멀티샷 프롬프트 + API 멀티샷 옵션 함께 사용
              }
            )
            break

          case 'seedance':
          default:
            result = await submitSeedanceToQueue(
              startFrameUrl,
              null, // 끝 프레임 없음
              videoPrompt,
              {
                aspectRatio: mapAspectRatioForSeedance(aspectRatio),
                resolution: '720p',
                duration: mapDurationForSeedance(duration),
                fixedLens: false,
                generateAudio: false,
              }
            )
            break
        }

        requests.push({
          requestId: `kie:${result.request_id}`,
          prompt: videoPrompt,
        })
      }
    } catch (requestError) {
      // 영상 생성 요청 실패 시 크레딧 환불
      console.error('영상 생성 요청 실패, 크레딧 환불:', requestError)
      await prisma.profiles.update({
        where: { id: user.id },
        data: { credits: { increment: totalCreditCost } },
      })
      throw requestError
    }

    // Draft가 있으면 상태 업데이트 (첫 번째 요청 ID 저장)
    if (draftId && requests.length > 0) {
      await prisma.video_ads.update({
        where: { id: draftId },
        data: {
          video_request_id: requests[0].requestId,
          status: 'GENERATING_VIDEO',
          updated_at: new Date(),
        },
      })
    }

    return NextResponse.json({
      requests,
      // 하위 호환성을 위해 단일 requestId도 반환
      requestId: requests[0]?.requestId,
      prompt: requests[0]?.prompt,
      creditUsed: totalCreditCost,
    })
  } catch (error) {
    console.error('영상 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    )
  }
}

async function generateVideoPrompt(
  productName: string,
  elements: ScenarioElements,
  duration: number,
  videoModel: VideoModel,
  variationIndex: number = 0
): Promise<string> {
  // 모델별 최적화된 힌트
  const modelSpecificGuidelines = getModelGuidelines(videoModel, false)

  const variationHints = [
    'Focus on elegant, slow motion and subtle product highlights.',
    'Emphasize dynamic lighting transitions and atmospheric depth.',
    'Create an artistic, cinematic feel with creative composition angles.',
  ]

  const prompt = `You are an expert advertising video prompt engineer.
Create an optimized video generation prompt for a product advertisement.

OUTPUT LANGUAGE: English (prompt must be in English for AI video generation)

=== TARGET MODEL ===
${videoModel === 'wan2.6' ? 'Wan 2.6 (Alibaba) - High resolution 1080p, excels at cinematic quality and detailed textures' : 'Seedance 1.5 Pro (ByteDance) - Smooth motion, natural movements, elegant transitions'}

=== PRODUCT INFORMATION ===
Product: [Refer to the product shown in the start frame image]

⚠️ WARNING: Do NOT include the product name "${productName}" directly in the generated prompt.
The product name may contain misleading words (e.g., "Camera Lens Cleaner" would generate actual cameras).
Instead, use generic terms like "the product", "the bottle", "the item" based on the start frame image.

=== SCENARIO ELEMENTS ===
Background/Location: ${elements.background}
Mood/Tone: ${elements.mood}
Composition/Angle: ${elements.cameraAngle}
Product Placement: ${elements.productPlacement}
Lighting Style: ${elements.lighting}
Color Tone: ${elements.colorTone}

=== VIDEO REQUIREMENTS ===
Duration: approximately ${duration} seconds
Starting Frame: Will be provided (the video should continue naturally from this frame)
Variation Style: ${variationHints[variationIndex % variationHints.length]}

=== MODEL-SPECIFIC GUIDELINES ===
${modelSpecificGuidelines}

=== GENERAL GUIDELINES ===
1. Describe smooth, natural motion for the product
2. Include motion and movement that enhances the product appeal
3. Maintain the established mood throughout
4. Keep the prompt concise but descriptive (50-80 words)
5. Avoid sudden changes or jarring transitions
6. The video should feel premium and polished

=== 🎥 CAMERA STABILIZATION (매우 중요!) ===
- Use "steady", "stable", "gimbal-stabilized" keywords for smooth motion
- Include "no camera shake", "professional dolly motion" for stability
- AVOID "handheld", "shaky", "dynamic camera" - these cause unstable footage
- All motion should feel like professional broadcast/commercial quality

=== CRITICAL: NO VISIBLE EQUIPMENT ===
- NO cameras, tripods, lighting rigs, softboxes, ring lights, reflectors, or any studio equipment visible
- Describe lighting as EFFECT only (e.g., "soft highlights", "dramatic shadows"), NOT as visible equipment
- The video should look like a FINAL ADVERTISEMENT, not a behind-the-scenes production

⚠️ FORBIDDEN WORDS (이 단어들을 프롬프트에 포함하면 촬영 장비가 영상에 등장함!):
NEVER include: "camera", "tripod", "photographer", "filming", "behind the scenes", "DSLR", "mirrorless"

Create a single, optimized video prompt.`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['prompt'],
      properties: {
        prompt: {
          type: Type.STRING,
          description: '영상 생성 프롬프트 (영어)',
        },
      },
    },
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  const responseText = response.text || ''
  const result = JSON.parse(responseText) as { prompt: string }

  return result.prompt
}

/**
 * 모델별 최적화 가이드라인 반환
 */
function getModelGuidelines(videoModel: VideoModel, isMultiShot: boolean): string {
  if (videoModel === 'wan2.6') {
    return isMultiShot
      ? `For Wan 2.6 Multi-Shot:
- Leverage 1080p high resolution for detailed close-ups
- Use dramatic motion between shots (dolly-in, crane shots, tracking)
- Include clear visual transitions between shots
- Focus on cinematic storytelling with emotional build-up
- Each shot should have distinct framing and composition`
      : `For Wan 2.6:
- Leverage 1080p resolution for crisp, detailed product shots
- Include cinematic motion (slow dolly, elegant pans)
- Focus on high-quality textures and reflections
- Use dramatic lighting transitions
- Emphasize visual depth and atmosphere`
  }

  // Seedance (default)
  return isMultiShot
    ? `For Seedance Multi-Shot:
- Focus on smooth, fluid transitions between shots
- Use gentle motion that flows naturally
- Maintain consistent lighting across shots
- Keep product as the visual anchor throughout
- Emphasize elegant, premium feel in each shot`
    : `For Seedance:
- Prioritize smooth, natural motion throughout
- Use slow, elegant motion (gentle dolly, subtle pan)
- Focus on fluid product motion (smooth rotation, gentle floating)
- Maintain soft lighting transitions
- Create a polished, refined aesthetic`
}

/**
 * 멀티샷 프롬프트 생성 (여러 샷으로 구성된 시네마틱 영상)
 */
async function generateMultiShotPrompt(
  productName: string,
  elements: ScenarioElements,
  duration: number,
  videoModel: VideoModel,
  variationIndex: number = 0
): Promise<string> {
  // duration에 따른 샷 수 결정
  const shotCount = duration <= 5 ? 2 : duration <= 10 ? 3 : 4
  const modelSpecificGuidelines = getModelGuidelines(videoModel, true)

  const variationStyles = [
    'cinematic product reveal sequence',
    'dynamic showcase with multiple angles',
    'storytelling approach with emotional impact',
  ]

  const prompt = `You are an expert advertising video prompt engineer specializing in multi-shot sequences.
Create a multi-shot video prompt for a premium product advertisement.

OUTPUT LANGUAGE: English (prompt must be in English for AI video generation)

=== TARGET MODEL ===
${videoModel === 'wan2.6' ? 'Wan 2.6 (Alibaba) - Native multi-shot support, 1080p resolution, cinematic quality' : 'Seedance 1.5 Pro (ByteDance) - Smooth transitions, natural motion, 720p'}

=== PRODUCT INFORMATION ===
Product: [Refer to the product shown in the start frame image]

⚠️ WARNING: Do NOT include the product name "${productName}" directly in the generated prompt.
The product name may contain misleading words (e.g., "Camera Lens Cleaner" would generate actual cameras).
Instead, use generic terms like "the product", "the bottle", "the item" based on the start frame image.

=== SCENARIO ELEMENTS ===
Background/Location: ${elements.background}
Mood/Tone: ${elements.mood}
Composition/Angle: ${elements.cameraAngle}
Product Placement: ${elements.productPlacement}
Lighting Style: ${elements.lighting}
Color Tone: ${elements.colorTone}

=== VIDEO REQUIREMENTS ===
Total Duration: approximately ${duration} seconds
Number of Shots: ${shotCount}
Style: ${variationStyles[variationIndex % variationStyles.length]}
Starting Frame: Will be provided

=== MULTI-SHOT FORMAT ===
Use this exact format:
"Shot 1: [description]. Shot 2: [description]. Shot 3: [description]."

=== REFERENCE EXAMPLES ===
Example 1 (Product Focus): "Shot 1: Close-up on the product, soft professional lighting highlights its sleek surface. Shot 2: View slowly pulls back revealing the premium packaging. Shot 3: Product rotates elegantly, catching light reflections as view dollies around."

Example 2 (Cinematic): "Shot 1: Wide establishing shot of minimalist setting with product centered. Shot 2: Dynamic dolly-in to hero shot, dramatic lighting builds. Shot 3: Extreme close-up on product details, lens flare accents the premium finish."

=== MODEL-SPECIFIC GUIDELINES ===
${modelSpecificGuidelines}

=== GENERAL GUIDELINES ===
1. Each shot should be distinct but flow naturally into the next
2. Start with establishing shot, build to hero shot of the product
3. Include specific motion (dolly-in, pan, close-up, etc.)
4. End with a memorable final shot showcasing the product
5. Keep each shot description concise (15-25 words)
6. Total prompt should be 60-120 words

=== 🎥 CAMERA STABILIZATION (매우 중요!) ===
- Use "steady", "stable", "gimbal-stabilized" keywords for smooth motion
- Include "no camera shake", "professional dolly motion" for stability
- AVOID "handheld", "shaky", "dynamic camera" - these cause unstable footage
- All motion should feel like professional broadcast/commercial quality

=== CRITICAL: NO VISIBLE EQUIPMENT ===
- NO cameras, tripods, lighting rigs, softboxes, ring lights, reflectors, or any studio equipment visible
- Describe lighting as EFFECT only (e.g., "soft highlights", "dramatic shadows"), NOT as visible equipment
- The video should look like a FINAL ADVERTISEMENT, not a behind-the-scenes production

⚠️ FORBIDDEN WORDS (이 단어들을 프롬프트에 포함하면 촬영 장비가 영상에 등장함!):
NEVER include: "camera", "tripod", "photographer", "filming", "behind the scenes", "DSLR", "mirrorless"

Create a multi-shot prompt that tells a compelling visual story about the product.`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['prompt'],
      properties: {
        prompt: {
          type: Type.STRING,
          description: '멀티샷 영상 생성 프롬프트 (영어, Shot 1: ... Shot 2: ... 형식)',
        },
      },
    },
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  const responseText = response.text || ''
  const result = JSON.parse(responseText) as { prompt: string }

  return result.prompt
}
