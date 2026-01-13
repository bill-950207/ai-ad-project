/**
 * 아바타 상태 조회 API 라우트
 *
 * 아바타 생성 상태를 폴링합니다.
 * fal.ai 생성이 완료되면 임시 이미지 URL을 반환하고,
 * 클라이언트에서 R2로 직접 업로드합니다.
 *
 * GET /api/avatars/[id]/status - 아바타 생성 상태 조회
 *
 * 이미지 업로드 흐름:
 * 1. 클라이언트가 status API 폴링
 * 2. COMPLETED 상태 + tempImageUrl 반환
 * 3. 클라이언트가 이미지 다운로드 → 압축 → R2 업로드
 * 4. 클라이언트가 complete API 호출하여 URL 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { getQueueStatus as getFalQueueStatus, getQueueResponse as getFalQueueResponse } from '@/lib/fal/client'
import { getZImageQueueStatus, getZImageQueueResponse } from '@/lib/kie/client'
import { avatar_status } from '@/lib/generated/prisma/client'

// AI 프로바이더 설정 (기본값: kie, fallback: fal)
const AI_PROVIDER = process.env.AVATAR_AI_PROVIDER || 'kie'

/** 라우트 파라미터 타입 */
interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/avatars/[id]/status
 *
 * 아바타 생성 상태를 조회합니다.
 * 클라이언트에서 2초 간격으로 폴링하여 진행 상황을 확인합니다.
 *
 * 상태 흐름:
 * PENDING → IN_QUEUE → IN_PROGRESS → COMPLETED/FAILED
 *
 * 완료 시:
 * - fal.ai에서 생성된 이미지를 다운로드
 * - Cloudflare R2에 영구 저장
 * - 아바타 레코드 업데이트 (이미지 URL, 크기, 시드 등)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 아바타 조회 (본인 소유 확인)
    const avatar = await prisma.avatars.findFirst({
      where: {
        id,
        user_id: user.id,
      },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    // 이미 완료/실패/취소된 경우 현재 상태 반환
    if (avatar.status === 'COMPLETED' || avatar.status === 'FAILED' || avatar.status === 'CANCELLED') {
      return NextResponse.json({ avatar })
    }

    // fal 요청 ID가 없는 경우 (비정상 상태)
    if (!avatar.fal_request_id) {
      return NextResponse.json({ avatar })
    }

    // AI 프로바이더에 따라 상태 조회
    const queueStatus = AI_PROVIDER === 'kie'
      ? await getZImageQueueStatus(avatar.fal_request_id)
      : await getFalQueueStatus(avatar.fal_request_id)

    // 상태를 내부 상태로 매핑
    let newStatus: avatar_status = avatar.status

    if (queueStatus.status === 'IN_QUEUE') {
      newStatus = 'IN_QUEUE'
    } else if (queueStatus.status === 'IN_PROGRESS') {
      newStatus = 'IN_PROGRESS'
    } else if (queueStatus.status === 'COMPLETED') {
      // 생성 완료 - 결과 반환 (클라이언트에서 R2 업로드 처리)
      try {
        let imageUrl: string
        let imageWidth: number | undefined
        let imageHeight: number | undefined
        let seed: number | undefined
        let expandedPrompt: string | undefined
        let hasNsfw: boolean = false

        if (AI_PROVIDER === 'kie') {
          // Kie.ai Z Image 결과 조회
          const kieResponse = await getZImageQueueResponse(avatar.fal_request_id)
          if (kieResponse.images && kieResponse.images.length > 0) {
            const image = kieResponse.images[0]
            imageUrl = image.url
            imageWidth = image.width
            imageHeight = image.height
            seed = kieResponse.seed
            expandedPrompt = kieResponse.prompt
          } else {
            throw new Error('No images generated')
          }
        } else {
          // fal.ai 결과 조회
          const falResponse = await getFalQueueResponse(avatar.fal_request_id)
          if (falResponse.images && falResponse.images.length > 0) {
            const image = falResponse.images[0]
            imageUrl = image.url
            imageWidth = image.width
            imageHeight = image.height
            seed = falResponse.seed
            expandedPrompt = falResponse.prompt
            hasNsfw = falResponse.has_nsfw_concepts?.[0] || false
          } else {
            throw new Error('No images generated')
          }
        }

        // 상태를 UPLOADING으로 변경 (클라이언트 업로드 대기)
        const updatedAvatar = await prisma.avatars.update({
          where: { id },
          data: {
            status: 'UPLOADING',
            image_width: imageWidth,
            image_height: imageHeight,
            seed: seed,
            prompt_expanded: expandedPrompt,
            has_nsfw: hasNsfw,
          },
        })

        // 임시 이미지 URL을 함께 반환 (클라이언트 업로드용)
        return NextResponse.json({
          avatar: updatedAvatar,
          tempImageUrl: imageUrl,  // 임시 URL (클라이언트가 다운로드하여 R2에 업로드)
        })
      } catch (error) {
        // 결과 처리 중 오류 발생
        console.error('아바타 완료 처리 오류:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        const updatedAvatar = await prisma.avatars.update({
          where: { id },
          data: {
            status: 'FAILED',
            error_message: errorMessage,
          },
        })

        return NextResponse.json({ avatar: updatedAvatar })
      }
    }

    // 상태가 변경된 경우 DB 업데이트
    if (newStatus !== avatar.status) {
      const updatedAvatar = await prisma.avatars.update({
        where: { id },
        data: { status: newStatus },
      })

      return NextResponse.json({ avatar: updatedAvatar })
    }

    // 상태 변경 없음 - 현재 상태 반환
    return NextResponse.json({ avatar })
  } catch (error) {
    console.error('아바타 상태 확인 오류:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
