/**
 * 광고 음악 API
 *
 * GET: 광고 음악 목록 조회
 * POST: 광고 음악 생성 요청
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { submitAdMusicToQueue } from '@/lib/kie/client'
import { MUSIC_CREDIT_COST } from '@/lib/credits'
import { recordCreditUse } from '@/lib/credits/history'
import { checkUsageLimit } from '@/lib/subscription'

// 요청 바디 타입
interface AdMusicRequestBody {
  name: string
  mood: string
  genre: string
  productType: string
}

// GET: 광고 음악 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // 음악 목록 조회
    const { data: musicList, error } = await supabase
      .from('ad_music')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('광고 음악 조회 오류:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ad music' },
        { status: 500 }
      )
    }

    return NextResponse.json({ musicList })
  } catch (error) {
    console.error('광고 음악 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: 광고 음악 생성 요청
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 요청 바디 파싱
    const body: AdMusicRequestBody = await request.json()
    const { name, mood, genre, productType } = body

    // 필수 필드 검증
    if (!name || !mood || !genre || !productType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, mood, genre, productType' },
        { status: 400 }
      )
    }

    // 슬롯 제한 확인 (플랜별 최대 보유 가능 개수)
    const slotCheck = await checkUsageLimit(user.id, 'music')

    // 슬롯이 꽉 찬 경우 생성 불가
    if (!slotCheck.withinLimit) {
      return NextResponse.json(
        {
          error: 'Slot limit reached',
          slotInfo: {
            used: slotCheck.used,
            limit: slotCheck.limit,
            message: `음악 슬롯이 가득 찼습니다. 현재 ${slotCheck.used}/${slotCheck.limit}개 보유 중. 새로 생성하려면 기존 음악을 삭제해주세요.`,
          },
        },
        { status: 403 }
      )
    }

    // 크레딧 확인
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { credits: true },
    })

    if (!profile || (profile.credits ?? 0) < MUSIC_CREDIT_COST) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: MUSIC_CREDIT_COST,
          available: profile?.credits ?? 0,
        },
        { status: 402 }
      )
    }

    // 콜백 URL 생성
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'
    const callbackUrl = `${appUrl}/api/ad-music/callback`

    // KIE API로 음악 생성 요청
    const { taskId } = await submitAdMusicToQueue(mood, genre, productType, callbackUrl)

    // DB에 레코드 생성
    const { data: music, error: insertError } = await supabase
      .from('ad_music')
      .insert({
        user_id: user.id,
        name,
        status: 'IN_QUEUE',
        kie_task_id: taskId,
        mood,
        genre,
        product_type: productType,
        model: 'V5',
      })
      .select()
      .single()

    if (insertError) {
      console.error('광고 음악 생성 오류:', insertError)
      return NextResponse.json(
        { error: 'Failed to create ad music record' },
        { status: 500 }
      )
    }

    // 크레딧 차감 (트랜잭션으로 재확인 후 원자적 차감 + 히스토리 기록)
    try {
      await prisma.$transaction(async (tx) => {
        const currentProfile = await tx.profiles.findUnique({
          where: { id: user.id },
          select: { credits: true },
        })

        if (!currentProfile || (currentProfile.credits ?? 0) < MUSIC_CREDIT_COST) {
          throw new Error('INSUFFICIENT_CREDITS')
        }

        const balanceAfter = (currentProfile.credits ?? 0) - MUSIC_CREDIT_COST

        await tx.profiles.update({
          where: { id: user.id },
          data: { credits: { decrement: MUSIC_CREDIT_COST } },
        })

        // 크레딧 히스토리 기록
        await recordCreditUse({
          userId: user.id,
          featureType: 'MUSIC',
          amount: MUSIC_CREDIT_COST,
          balanceAfter,
          relatedEntityId: music.id,
          description: `음악 생성 (${mood}, ${genre})`,
        }, tx)
      }, { timeout: 10000 })
    } catch (txError) {
      // 크레딧 차감 실패 시 생성된 음악 레코드 정리
      if (txError instanceof Error && txError.message === 'INSUFFICIENT_CREDITS') {
        await supabase.from('ad_music').delete().eq('id', music.id)
        return NextResponse.json(
          { error: 'Insufficient credits (concurrent request detected)' },
          { status: 402 }
        )
      }
      // 기타 트랜잭션 에러 시에도 레코드 정리
      await supabase.from('ad_music').update({ status: 'FAILED' }).eq('id', music.id)
      throw txError
    }

    return NextResponse.json({
      music,
      creditUsed: MUSIC_CREDIT_COST,
      slotInfo: {
        used: slotCheck.used + 1,
        limit: slotCheck.limit,
      },
    })
  } catch (error) {
    console.error('광고 음악 생성 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
