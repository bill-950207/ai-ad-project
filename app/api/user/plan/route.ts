/**
 * 사용자 플랜 조회 API
 *
 * GET: 현재 로그인한 사용자의 플랜 정보를 반환합니다.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/subscription/queries'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const plan = await getUserPlan(user.id)

    return NextResponse.json({
      planType: plan.planType,
      displayName: plan.displayName,
      avatarLimit: plan.avatarLimit,
      musicLimit: plan.musicLimit,
      productLimit: plan.productLimit,
      monthlyCredits: plan.monthlyCredits,
      keyframeCount: plan.keyframeCount,
      watermarkFree: plan.watermarkFree,
      hdUpscale: plan.hdUpscale,
    })
  } catch (error) {
    console.error('플랜 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to get user plan' },
      { status: 500 }
    )
  }
}
