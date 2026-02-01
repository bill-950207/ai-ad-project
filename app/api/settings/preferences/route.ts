/**
 * 사용자 설정 API
 *
 * GET  /api/settings/preferences - 사용자 설정 조회
 * PATCH /api/settings/preferences - 사용자 설정 업데이트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

// 허용된 설정 필드
const ALLOWED_FIELDS = ['email_notifications', 'marketing_emails'] as const
type PreferenceField = typeof ALLOWED_FIELDS[number]

/**
 * GET /api/settings/preferences
 *
 * 현재 로그인한 사용자의 설정을 조회합니다.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: {
        email_notifications: true,
        marketing_emails: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      preferences: {
        email_notifications: profile.email_notifications ?? true,
        marketing_emails: profile.marketing_emails ?? false,
      },
    })
  } catch (error) {
    console.error('설정 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/settings/preferences
 *
 * 사용자 설정을 업데이트합니다.
 *
 * 요청 본문:
 * - email_notifications?: boolean
 * - marketing_emails?: boolean
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // 허용된 필드만 추출
    const updateData: Partial<Record<PreferenceField, boolean>> = {}

    for (const field of ALLOWED_FIELDS) {
      if (typeof body[field] === 'boolean') {
        updateData[field] = body[field]
      }
    }

    // 업데이트할 필드가 없으면 에러
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // 프로필 업데이트
    const updatedProfile = await prisma.profiles.update({
      where: { id: user.id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      select: {
        email_notifications: true,
        marketing_emails: true,
      },
    })

    return NextResponse.json({
      preferences: {
        email_notifications: updatedProfile.email_notifications ?? true,
        marketing_emails: updatedProfile.marketing_emails ?? false,
      },
    })
  } catch (error) {
    console.error('설정 업데이트 오류:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
