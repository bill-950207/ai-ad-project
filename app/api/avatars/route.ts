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
import { buildPromptFromOptions, validateAvatarOptions, AvatarOptions, DEFAULT_AVATAR_OPTIONS } from '@/lib/avatar/prompt-builder'
import { AVATAR_CREDIT_COST } from '@/lib/credits'
import { checkUsageLimit } from '@/lib/subscription'
import { applyRateLimit, RateLimits, rateLimitExceededResponse } from '@/lib/rate-limit'

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
 * prompt와 options 모두 없으면 기본 옵션(DEFAULT_AVATAR_OPTIONS)이 적용됩니다.
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting 체크 (크레딧 소모 API)
    const rateLimitResult = applyRateLimit(user.id, RateLimits.aiGeneration)
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult.reset)
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
    // 아무것도 입력하지 않은 경우 기본 옵션 사용
    // 주의: 빈 객체 {}도 truthy이므로 Object.keys로 확인 필요
    // 주의: 공백만 입력한 경우도 빈 입력으로 처리
    const trimmedPrompt = directPrompt?.trim()
    const hasValidOptions = options && Object.keys(options).length > 0
    // 사용자 옵션을 기본값과 병합 (체형 등 누락 방지)
    const effectiveOptions = hasValidOptions
      ? { ...DEFAULT_AVATAR_OPTIONS, ...options }
      : (!trimmedPrompt ? DEFAULT_AVATAR_OPTIONS : undefined)
    const rawPrompt = trimmedPrompt || buildPromptFromOptions(effectiveOptions || DEFAULT_AVATAR_OPTIONS)
    // AI 이미지 생성에 최적화된 프롬프트
    // 참고: prompt-builder.ts가 이미 처리하는 항목 (중복 방지)
    // - 매력도 향상 (attractivenessEnhancerMap)
    // - 체형 설명 (getBodyTypeDescription)
    // - 포즈 + 카메라 응시 (poseMap, 기본값 포함)
    // - 의상 스타일 (outfitStyleMap)
    // - 배경 (backgroundMap)

    const hasBackground = effectiveOptions?.background

    // 품질 키워드 (중복 제거)
    const qualityKeywords = 'high quality photo, realistic, detailed skin texture'
    // 기본 배경 (배경 옵션이 없을 때만)
    const defaultBackground = hasBackground ? '' : ', against clean white seamless backdrop with soft even lighting'
    // 촬영 구도 (상체만, 정면 눈높이 앵글)
    const viewType = 'upper body portrait from chest up, eye level camera angle, straight on view, medium close-up shot'

    const finalPrompt = `${rawPrompt}, ${qualityKeywords}${defaultBackground}, ${viewType}`

    // 슬롯 제한 확인 (플랜별 최대 보유 가능 개수)
    const slotCheck = await checkUsageLimit(user.id, 'avatar')

    // 슬롯이 꽉 찬 경우 생성 불가
    if (!slotCheck.withinLimit) {
      return NextResponse.json(
        {
          error: 'Slot limit reached',
          slotInfo: {
            used: slotCheck.used,
            limit: slotCheck.limit,
            message: `아바타 슬롯이 가득 찼습니다. 현재 ${slotCheck.used}/${slotCheck.limit}개 보유 중. 새로 생성하려면 기존 아바타를 삭제해주세요.`,
          },
        },
        { status: 403 }
      )
    }

    // 크레딧 사전 확인 (빠른 실패를 위해)
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { credits: true },
    })

    if (!profile || (profile.credits ?? 0) < AVATAR_CREDIT_COST) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: AVATAR_CREDIT_COST,
          available: profile?.credits ?? 0,
        },
        { status: 402 }
      )
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

    // 트랜잭션으로 크레딧 확인/차감 및 아바타 레코드 생성 (원자적 처리로 Race Condition 방지)
    const avatar = await prisma.$transaction(async (tx) => {
      // 트랜잭션 내에서 크레딧 재확인 (동시성 문제 해결)
      const currentProfile = await tx.profiles.findUnique({
        where: { id: user.id },
        select: { credits: true },
      })

      if (!currentProfile || (currentProfile.credits ?? 0) < AVATAR_CREDIT_COST) {
        throw new Error('INSUFFICIENT_CREDITS')
      }

      // 크레딧 차감 (원자적)
      await tx.profiles.update({
        where: { id: user.id },
        data: { credits: { decrement: AVATAR_CREDIT_COST } },
      })

      // 아바타 레코드 생성
      return tx.avatars.create({
        data: {
          user_id: user.id,
          name: name.trim(),
          prompt: rawPrompt,                // 원본 프롬프트
          prompt_expanded: finalPrompt,     // 품질 향상 문구가 추가된 프롬프트
          options: effectiveOptions ? JSON.parse(JSON.stringify(effectiveOptions)) : undefined,
          status: 'IN_QUEUE',
          fal_request_id: queueResponse.request_id,
          fal_response_url: queueResponse.response_url || null,
          fal_status_url: queueResponse.status_url || null,
          fal_cancel_url: queueResponse.cancel_url || null,
        },
      })
    }, {
      timeout: 10000,  // 트랜잭션 타임아웃 10초
    })


    return NextResponse.json({
      avatar,
      creditUsed: AVATAR_CREDIT_COST,
      slotInfo: {
        used: slotCheck.used + 1,
        limit: slotCheck.limit,
      },
    }, { status: 201 })
  } catch (error) {
    // 크레딧 부족 에러 처리 (트랜잭션 내에서 발생)
    if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json(
        { error: 'Insufficient credits (concurrent request detected)' },
        { status: 402 }
      )
    }

    console.error('아바타 생성 오류:', error)
    return NextResponse.json(
      { error: 'Failed to create avatar' },
      { status: 500 }
    )
  }
}
