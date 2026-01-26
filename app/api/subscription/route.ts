/**
 * 구독 상태 API
 *
 * GET: 현재 사용자의 구독 정보 및 사용량 조회
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/subscription/queries'
import { getUsageSummary } from '@/lib/subscription/usage'
import { getPlanFeatures } from '@/lib/subscription/features'

export async function GET() {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 구독 정보, 사용량, 기능 정보 병렬 조회
    const [subscription, usage, features] = await Promise.all([
      getUserSubscription(user.id),
      getUsageSummary(user.id),
      getPlanFeatures(user.id),
    ])

    return NextResponse.json({
      subscription,
      usage,
      features,
    })
  } catch (error) {
    console.error('구독 상태 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}
