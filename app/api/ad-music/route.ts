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
import { checkUsageLimit, incrementUsage } from '@/lib/subscription'

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

    // 사용량 제한 확인 (플랜별 무료 생성 가능 횟수)
    const usageCheck = await checkUsageLimit(user.id, 'music')
    const needsCredits = !usageCheck.withinLimit

    // 크레딧이 필요한 경우 (제한 초과) 크레딧 확인
    if (needsCredits) {
      const profile = await prisma.profiles.findUnique({
        where: { id: user.id },
      })

      if (!profile || (profile.credits ?? 0) < MUSIC_CREDIT_COST) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: MUSIC_CREDIT_COST,
            available: profile?.credits ?? 0,
            usageInfo: {
              used: usageCheck.used,
              limit: usageCheck.limit,
              message: `월간 무료 생성 ${usageCheck.limit}회를 모두 사용했습니다. 추가 생성은 ${MUSIC_CREDIT_COST} 크레딧이 필요합니다.`,
            },
          },
          { status: 402 }
        )
      }
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

    // 제한 초과 시 크레딧 차감
    if (needsCredits) {
      await prisma.profiles.update({
        where: { id: user.id },
        data: { credits: { decrement: MUSIC_CREDIT_COST } },
      })
    } else {
      // 무료 생성인 경우 사용량 증가
      await incrementUsage(user.id, 'music')
    }

    return NextResponse.json({
      music,
      creditUsed: needsCredits ? MUSIC_CREDIT_COST : 0,
      usageInfo: {
        used: usageCheck.used + (needsCredits ? 0 : 1),
        limit: usageCheck.limit,
        freeGeneration: !needsCredits,
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
