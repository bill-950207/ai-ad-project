/**
 * 아바타 API 라우트
 *
 * 아바타 목록 조회 및 새 아바타 생성을 처리합니다.
 *
 * GET  /api/avatars - 사용자의 아바타 목록 조회
 * POST /api/avatars - 새 아바타 생성 요청
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { submitToQueue as submitToFalQueue } from '@/lib/fal/client'
import { submitZImageToQueue } from '@/lib/kie/client'
import { buildPromptFromOptions, validateAvatarOptions, AvatarOptions } from '@/lib/avatar/prompt-builder'
import { AVATAR_CREDIT_COST } from '@/lib/credits'
import { checkUsageLimit, incrementUsage } from '@/lib/subscription'

// AI 프로바이더 설정 (기본값: kie, fallback: fal)
const AI_PROVIDER = process.env.AVATAR_AI_PROVIDER || 'kie'

/**
 * GET /api/avatars
 *
 * 현재 로그인한 사용자의 모든 아바타를 조회합니다.
 * 최신순으로 정렬하여 반환합니다.
 *
 * Query Parameters:
 * - includeOutfits: true일 경우 아바타별 의상 목록도 함께 조회 (N+1 문제 해결)
 */
export async function GET(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 쿼리 파라미터 확인
    const { searchParams } = new URL(request.url)
    const includeOutfits = searchParams.get('includeOutfits') === 'true'

    // 사용자의 아바타 목록 조회 (최신순)
    const avatars = await prisma.avatars.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      ...(includeOutfits && {
        include: {
          outfits: {
            where: {
              status: 'COMPLETED',
              image_url: { not: null },
            },
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              name: true,
              image_url: true,
              status: true,
            },
          },
        },
      }),
    })

    return NextResponse.json({ avatars })
  } catch (error) {
    console.error('아바타 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch avatars' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/avatars
 *
 * 새 아바타 생성을 요청합니다.
 * 크레딧을 차감하고 fal.ai 큐에 생성 요청을 제출합니다.
 *
 * 요청 본문:
 * - name: 아바타 이름 (필수)
 * - prompt: 직접 입력 프롬프트 (선택)
 * - options: 아바타 옵션 객체 (선택)
 *
 * prompt 또는 options 중 하나는 필수입니다.
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { name, prompt: directPrompt, options } = body as {
      name: string
      prompt?: string
      options?: AvatarOptions
    }

    // 필수 필드 검증: 이름
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // 옵션 유효성 검증
    if (options && !validateAvatarOptions(options)) {
      return NextResponse.json(
        { error: 'Invalid avatar options' },
        { status: 400 }
      )
    }

    // 프롬프트 생성: 직접 입력 또는 옵션 기반
    const rawPrompt = directPrompt || (options ? buildPromptFromOptions(options) : '')

    if (!rawPrompt || rawPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt or options are required' },
        { status: 400 }
      )
    }
    // AI 이미지 생성에 최적화된 프롬프트 (품질 향상 문구 추가)
    // 배경/포즈 옵션이 있으면 프롬프트 빌더가 처리하므로 기본 배경 문구 제외
    const hasBackground = options?.background
    const hasPose = options?.pose

    // 품질 향상 문구 (좋은 결과물 프롬프트 참고)
    const qualityEnhancers = 'high quality photo, realistic, professional photography, sharp focus, detailed skin texture'
    // 기본 배경: 구체적인 스튜디오 설정으로 흐릿함 방지
    const defaultBackground = hasBackground ? '' : ', in a professional photo studio with soft studio lighting and clean white backdrop, well-lit'
    // 기본 포즈: 자연스러운 포즈와 중립적 표정 (광고에서 다양한 표정 적용 가능)
    const defaultPose = hasPose ? '' : ', in a relaxed natural pose, neutral calm expression, candid shot'
    const viewType = 'upper body shot'

    const finalPrompt = `${rawPrompt}, ${qualityEnhancers}${defaultBackground}${defaultPose}, ${viewType}`

    // 사용량 제한 확인 (플랜별 무료 생성 가능 횟수)
    const usageCheck = await checkUsageLimit(user.id, 'avatar')
    const needsCredits = !usageCheck.withinLimit

    // 크레딧이 필요한 경우 (제한 초과) 크레딧 확인
    if (needsCredits) {
      const profile = await prisma.profiles.findUnique({
        where: { id: user.id },
      })

      if (!profile || (profile.credits ?? 0) < AVATAR_CREDIT_COST) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: AVATAR_CREDIT_COST,
            available: profile?.credits ?? 0,
            usageInfo: {
              used: usageCheck.used,
              limit: usageCheck.limit,
              message: `월간 무료 생성 ${usageCheck.limit}회를 모두 사용했습니다. 추가 생성은 ${AVATAR_CREDIT_COST} 크레딧이 필요합니다.`,
            },
          },
          { status: 402 }  // 402 Payment Required
        )
      }
    }

    // AI 프로바이더에 따라 큐에 생성 요청 제출
    let queueResponse: { request_id: string; response_url?: string; status_url?: string; cancel_url?: string }

    if (AI_PROVIDER === 'kie') {
      // Kie.ai Z Image 사용
      const kieResponse = await submitZImageToQueue(finalPrompt, '9:16')
      queueResponse = {
        request_id: kieResponse.request_id,
        // Kie.ai는 URL을 별도로 제공하지 않음 - taskId로 조회
      }
    } else {
      // fal.ai 사용
      queueResponse = await submitToFalQueue(finalPrompt)
    }

    // 트랜잭션으로 사용량/크레딧 처리 및 아바타 레코드 생성
    const avatar = await prisma.$transaction(async (tx) => {
      if (needsCredits) {
        // 제한 초과: 크레딧 차감
        await tx.profiles.update({
          where: { id: user.id },
          data: { credits: { decrement: AVATAR_CREDIT_COST } },
        })
      }

      // 아바타 레코드 생성
      return tx.avatars.create({
        data: {
          user_id: user.id,
          name: name.trim(),
          prompt: rawPrompt,                // 원본 프롬프트
          prompt_expanded: finalPrompt,     // 품질 향상 문구가 추가된 프롬프트
          options: options ? JSON.parse(JSON.stringify(options)) : undefined,
          status: 'IN_QUEUE',
          fal_request_id: queueResponse.request_id,
          fal_response_url: queueResponse.response_url || null,
          fal_status_url: queueResponse.status_url || null,
          fal_cancel_url: queueResponse.cancel_url || null,
        },
      })
    })

    // 무료 생성인 경우 사용량 증가 (트랜잭션 외부에서 처리)
    if (!needsCredits) {
      await incrementUsage(user.id, 'avatar')
    }

    return NextResponse.json({ avatar }, { status: 201 })
  } catch (error) {
    console.error('아바타 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to create avatar' },
      { status: 500 }
    )
  }
}
