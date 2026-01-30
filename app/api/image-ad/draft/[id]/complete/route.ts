/**
 * 이미지 광고 Draft 완료 API
 *
 * POST /api/image-ad/draft/[id]/complete - Draft 상태를 COMPLETED로 변경
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/image-ad/draft/[id]/complete
 *
 * Draft 상태를 완료로 변경합니다.
 * 이미지 생성이 성공적으로 완료되었을 때 호출됩니다.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Draft 확인
    const draft = await prisma.image_ads.findFirst({
      where: {
        id,
        user_id: user.id,
        status: 'DRAFT',
      },
    })

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // 상태를 COMPLETED로 변경
    const updated = await prisma.image_ads.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ success: true, imageAd: updated })
  } catch (error) {
    console.error('Draft 완료 처리 오류:', error)
    return NextResponse.json(
      { error: 'Failed to complete draft' },
      { status: 500 }
    )
  }
}
