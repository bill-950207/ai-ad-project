/**
 * 이미지 광고 환불 API
 *
 * POST: 실패한 이미지 광고에 대한 크레딧 환불 및 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { IMAGE_AD_CREDIT_COST } from '@/lib/credits'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 이미지 광고 조회
    const { data: imageAd, error: findError } = await supabase
      .from('image_ads')
      .select('id, status, quality')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (findError || !imageAd) {
      return NextResponse.json(
        { error: 'Image ad not found' },
        { status: 404 }
      )
    }

    // 실패 상태 확인
    if (imageAd.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Only failed image ads can be refunded' },
        { status: 400 }
      )
    }

    // 환불 크레딧 계산
    const quality = (imageAd.quality || 'medium') as keyof typeof IMAGE_AD_CREDIT_COST
    const refundCredits = IMAGE_AD_CREDIT_COST[quality] || IMAGE_AD_CREDIT_COST.medium

    // 트랜잭션: 크레딧 환불 + 이미지 광고 삭제
    await prisma.$transaction([
      // 크레딧 환불
      prisma.profiles.update({
        where: { id: user.id },
        data: {
          credits: { increment: refundCredits },
        },
      }),
      // 이미지 광고 삭제
      prisma.image_ads.delete({
        where: { id },
      }),
    ])

    console.log('이미지 광고 환불 완료:', { userId: user.id, imageAdId: id, refundCredits })

    return NextResponse.json({
      success: true,
      refundedCredits: refundCredits,
    })
  } catch (error) {
    console.error('이미지 광고 환불 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
