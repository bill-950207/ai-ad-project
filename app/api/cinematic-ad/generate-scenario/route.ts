/**
 * 시네마틱 광고 시나리오 생성 API
 *
 * POST: 제품 정보 + 이미지 → Gemini로 3개 시네마틱 광고 시나리오 생성
 * Seedance 2.0 멀티샷 프롬프트 기반
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI, GenerateContentConfig, ThinkingLevel, Type } from '@google/genai'
import { buildCinematicScenarioPrompt } from '@/lib/gemini/cinematic-ad-prompt'

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

const MODEL_NAME = 'gemini-3-flash-preview'

interface GenerateScenarioRequest {
  productName: string
  productDescription?: string | null
  sellingPoints?: string[] | null
  productImageUrl?: string | null
  count?: number
  language?: 'ko' | 'en' | 'ja' | 'zh'
}

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

    const body: GenerateScenarioRequest = await request.json()
    const {
      productName,
      productDescription,
      sellingPoints,
      productImageUrl,
      count = 3,
      language = 'ko',
    } = body

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    // 프롬프트 구성
    const prompt = buildCinematicScenarioPrompt({
      productName,
      productDescription,
      sellingPoints,
      count,
      language,
    })

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
            description: '시네마틱 광고 시나리오 배열',
            items: {
              type: Type.OBJECT,
              required: ['title', 'description', 'mood', 'multiShotPrompt', 'shotBreakdown', 'recommendedSettings'],
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'Scenario title (in output language)',
                },
                description: {
                  type: Type.STRING,
                  description: 'Scenario description 1-2 sentences (in output language)',
                },
                mood: {
                  type: Type.STRING,
                  description: 'Overall mood/atmosphere (in output language)',
                },
                multiShotPrompt: {
                  type: Type.STRING,
                  description: 'Complete multi-shot prompt for Seedance 2.0 API (MUST be in English). Format: "Shot 1: ... Shot 2: ... Shot 3: ..."',
                },
                shotBreakdown: {
                  type: Type.ARRAY,
                  description: 'Shot-by-shot breakdown for UI display',
                  items: {
                    type: Type.OBJECT,
                    required: ['shotNumber', 'description', 'estimatedDuration'],
                    properties: {
                      shotNumber: {
                        type: Type.INTEGER,
                        description: 'Shot sequence number',
                      },
                      description: {
                        type: Type.STRING,
                        description: 'What happens in this shot (in output language)',
                      },
                      estimatedDuration: {
                        type: Type.STRING,
                        description: 'Estimated duration like "2-3s"',
                      },
                    },
                  },
                },
                recommendedSettings: {
                  type: Type.OBJECT,
                  description: 'Recommended video settings',
                  required: ['aspectRatio', 'duration'],
                  properties: {
                    aspectRatio: {
                      type: Type.STRING,
                      description: 'Recommended aspect ratio',
                      enum: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
                    },
                    duration: {
                      type: Type.INTEGER,
                      description: 'Recommended duration in seconds (5-12)',
                    },
                  },
                },
              },
            },
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
      scenarios: Array<{
        title: string
        description: string
        mood: string
        multiShotPrompt: string
        shotBreakdown: Array<{ shotNumber: number; description: string; estimatedDuration: string }>
        recommendedSettings: { aspectRatio: string; duration: number }
      }>
    }

    return NextResponse.json({
      scenarios: result.scenarios,
    })
  } catch (error) {
    console.error('시네마틱 시나리오 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate cinematic scenario' },
      { status: 500 }
    )
  }
}
