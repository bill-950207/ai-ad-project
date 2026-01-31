/**
 * 프롬프트 합치기 API
 *
 * POST: 기존 프롬프트와 추가 프롬프트를 LLM으로 자연스럽게 합칩니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI, GenerateContentConfig, Type } from '@google/genai'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

const MODEL_NAME = 'gemini-3-flash-preview'

interface MergePromptsRequest {
  originalPrompt: string
  additionalPrompt: string
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

    const body: MergePromptsRequest = await request.json()
    const { originalPrompt, additionalPrompt } = body

    if (!originalPrompt || !additionalPrompt) {
      return NextResponse.json(
        { error: 'Both prompts are required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert prompt engineer for AI video generation.
Your task is to merge two prompts into a single, coherent prompt for video generation.

Rules:
1. The result must be a single, natural-flowing English prompt
2. Preserve the key visual elements from the original prompt
3. Incorporate the additional request naturally
4. Keep the prompt concise (under 100 words)
5. Focus on visual description, motion, and mood
6. Do not include technical jargon or model-specific terms

Original Prompt:
${originalPrompt}

Additional Request:
${additionalPrompt}

Output a single merged prompt that combines both seamlessly.`

    const config: GenerateContentConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        required: ['mergedPrompt'],
        properties: {
          mergedPrompt: {
            type: Type.STRING,
            description: '합쳐진 영상 프롬프트 (영어)',
          },
        },
      },
    }

    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      config,
    })

    const responseText = response.text || ''
    const result = JSON.parse(responseText) as { mergedPrompt: string }

    return NextResponse.json({
      mergedPrompt: result.mergedPrompt,
      originalPrompt,
      additionalPrompt,
    })
  } catch (error) {
    console.error('프롬프트 합치기 오류:', error)
    return NextResponse.json(
      { error: 'Failed to merge prompts' },
      { status: 500 }
    )
  }
}
