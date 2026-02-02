import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEFAULT_SIGNUP_CREDITS } from '@/lib/credits/constants'

export async function POST(request: Request) {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 요청 데이터 파싱
    const body = await request.json()
    const {
      name,
      company,
      jobTitle,
      industry,
      teamSize,
      referralSource,
    } = body

    // 필수 필드 검증
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '이름은 필수입니다' },
        { status: 400 }
      )
    }

    // 프로필 upsert (없으면 생성, 있으면 업데이트)
    const profile = await prisma.profiles.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        name: name.trim(),
        company: company?.trim() || null,
        job_title: jobTitle || null,
        industry: industry || null,
        team_size: teamSize || null,
        referral_source: referralSource || null,
        is_onboarded: true,
        credits: DEFAULT_SIGNUP_CREDITS,
      },
      update: {
        name: name.trim(),
        company: company?.trim() || null,
        job_title: jobTitle || null,
        industry: industry || null,
        team_size: teamSize || null,
        referral_source: referralSource || null,
        is_onboarded: true,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        job_title: true,
        industry: true,
        team_size: true,
        referral_source: true,
        is_onboarded: true,
        credits: true,
      },
    })

    return NextResponse.json({
      success: true,
      profile,
    })

  } catch (error) {
    console.error('온보딩 API 오류:', error)
    return NextResponse.json(
      { error: '온보딩 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 온보딩 상태 확인 API
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        is_onboarded: true,
        credits: true,
      },
    })

    if (!profile) {
      return NextResponse.json({
        isOnboarded: false,
        profile: null,
      })
    }

    return NextResponse.json({
      isOnboarded: profile.is_onboarded,
      profile,
    })

  } catch (error) {
    console.error('온보딩 상태 확인 오류:', error)
    return NextResponse.json(
      { error: '상태 확인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
