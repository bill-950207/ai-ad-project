/**
 * 멀티씬 영상 생성 API (Vidu Q2 Turbo)
 *
 * POST: 각 씬 키프레임 이미지로 개별 영상을 생성합니다.
 * - 씬1 이미지 → 씬1 영상
 * - 씬2 이미지 → 씬2 영상
 * - ...
 *
 * 지원 모델:
 * - vidu-q2: WaveSpeed Vidu Q2 Turbo (Primary)
 * - fallback: fal.ai Vidu Q2 (WaveSpeed 실패 시)
 *
 * 해상도: 540p, 720p, 1080p
 * 영상 길이: 1-8초
 *
 * 전환 방식: 컷 전환 (하드컷)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  submitViduToQueue,
  type ViduResolution,
  type ViduDuration,
} from '@/lib/wavespeed/client'
import {
  submitViduQ2ToQueue as submitFalViduQ2ToQueue,
} from '@/lib/fal/client'

interface SceneKeyframe {
  sceneIndex: number
  imageUrl: string
  scenePrompt?: string  // 씬 영상 프롬프트
  duration?: number     // 씬별 영상 길이 (1-8초)
  movementAmplitude?: 'auto' | 'small' | 'medium' | 'large'  // 카메라/모션 강도
}

interface GenerateSceneVideosRequest {
  keyframes: SceneKeyframe[]
  duration?: number        // 씬당 영상 길이 (1-8초, 기본 4)
  resolution?: ViduResolution  // 해상도 (540p, 720p, 1080p, 기본 720p)
  audioEnabled?: boolean   // 배경 음악 (기본 false)
}

interface SceneVideoRequest {
  sceneIndex: number
  requestId: string
  prompt: string
  provider: 'wavespeed' | 'fal'
}

/**
 * 안전하게 duration을 ViduDuration으로 변환
 */
function toViduDuration(d: number): ViduDuration {
  const clamped = Math.min(Math.max(Math.round(d), 1), 8)
  return clamped as ViduDuration
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

    const body: GenerateSceneVideosRequest = await request.json()
    const {
      keyframes,
      duration = 4,
      resolution = '720p',
      audioEnabled = false,
    } = body

    if (!keyframes || keyframes.length === 0) {
      return NextResponse.json(
        { error: 'At least 1 keyframe is required' },
        { status: 400 }
      )
    }

    // 키프레임 인덱스 순으로 정렬
    const sortedKeyframes = [...keyframes].sort((a, b) => a.sceneIndex - b.sceneIndex)

    // 각 씬에 대해 영상 생성 요청
    const sceneVideoRequests: SceneVideoRequest[] = []

    for (const keyframe of sortedKeyframes) {
      // 씬 프롬프트 (없으면 기본값 - 모션 요소 포함)
      const scenePrompt = keyframe.scenePrompt ||
        `Product centered in frame. Camera slowly pushes in on the product. Soft lighting gently shifts creating subtle shadow movement. Premium advertisement aesthetic, photorealistic, 4K.`

      // 씬별 duration 사용 (없으면 글로벌 duration 사용)
      const sceneDuration = keyframe.duration ?? duration
      // 씬별 movementAmplitude 사용 (없으면 'auto')
      const sceneMovementAmplitude = keyframe.movementAmplitude ?? 'auto'

      let requestId: string
      let provider: 'wavespeed' | 'fal' = 'wavespeed'

      try {
        // WaveSpeed Vidu Q2 Turbo (Primary)
        const result = await submitViduToQueue({
          prompt: scenePrompt,
          image: keyframe.imageUrl,
          duration: toViduDuration(sceneDuration),
          resolution: resolution,
          bgm: audioEnabled,
          movement_amplitude: sceneMovementAmplitude,
        })
        requestId = `wavespeed-vidu:${result.request_id}`
        provider = 'wavespeed'
      } catch (waveSpeedError) {
        // WaveSpeed 실패 시 fal.ai로 Fallback
        console.warn('WaveSpeed Vidu Q2 실패, fal.ai로 Fallback:', waveSpeedError)

        try {
          const falResult = await submitFalViduQ2ToQueue({
            prompt: scenePrompt,
            image_url: keyframe.imageUrl,
            duration: Math.min(Math.max(sceneDuration, 2), 8) as 2 | 3 | 4 | 5 | 6 | 7 | 8,
            resolution: resolution === '1080p' ? '1080p' : '720p',  // fal.ai는 720p, 1080p만 지원
            movement_amplitude: sceneMovementAmplitude,
          })
          requestId = `fal-vidu:${falResult.request_id}`
          provider = 'fal'
        } catch (falError) {
          console.error('fal.ai Vidu Q2도 실패:', falError)
          throw new Error('모든 비디오 생성 서비스가 실패했습니다')
        }
      }

      sceneVideoRequests.push({
        sceneIndex: keyframe.sceneIndex,
        requestId,
        prompt: scenePrompt,
        provider,
      })
    }

    return NextResponse.json({
      sceneVideos: sceneVideoRequests,
      totalScenes: sceneVideoRequests.length,
      resolution,
      duration,
    })
  } catch (error) {
    console.error('씬 영상 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to generate scene videos' },
      { status: 500 }
    )
  }
}
