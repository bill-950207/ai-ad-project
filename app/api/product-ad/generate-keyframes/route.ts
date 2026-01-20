/**
 * 멀티씬 키프레임 이미지 생성 API
 *
 * POST: 각 씬의 프롬프트를 기반으로 키프레임 이미지들을 생성합니다.
 * Seedream 4.5 (kie.ai)를 사용하여 제품 이미지와 프롬프트로 씬 이미지 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createEditTask,
  type EditAspectRatio,
} from '@/lib/kie/client'

interface SceneInput {
  index: number
  scenePrompt: string
}

interface GenerateKeyframesRequest {
  productImageUrl: string
  scenes: SceneInput[]
  aspectRatio: '16:9' | '9:16' | '1:1'
}

// 비율 매핑 (Seedream 4.5용)
function mapAspectRatio(ratio: '16:9' | '9:16' | '1:1'): EditAspectRatio {
  const mapping: Record<string, EditAspectRatio> = {
    '16:9': '16:9',
    '9:16': '9:16',
    '1:1': '1:1',
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

    const body: GenerateKeyframesRequest = await request.json()
    const {
      productImageUrl,
      scenes,
      aspectRatio,
    } = body

    if (!productImageUrl || !scenes || scenes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 각 씬에 대해 Seedream 4.5로 이미지 생성 요청
    const requests = await Promise.all(
      scenes.map(async (scene) => {
        const result = await createEditTask({
          prompt: scene.scenePrompt,
          image_urls: [productImageUrl],
          aspect_ratio: mapAspectRatio(aspectRatio),
          quality: 'high',
        })
        return {
          sceneIndex: scene.index,
          requestId: `kie:${result.taskId}`,
          prompt: scene.scenePrompt,
        }
      })
    )

    return NextResponse.json({
      requests,
    })
  } catch (error) {
    console.error('키프레임 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate keyframes' },
      { status: 500 }
    )
  }
}
