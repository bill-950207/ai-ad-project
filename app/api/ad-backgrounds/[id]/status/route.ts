/**
 * 광고 배경 상태 조회 API
 *
 * GET: 배경 생성 상태 폴링
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getZImageTurboQueueResponse, getZImageTurboQueueStatus } from '@/lib/kie/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 배경 레코드 조회
    const { data: background, error: fetchError } = await supabase
      .from('ad_background')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !background) {
      return NextResponse.json(
        { error: 'Background not found' },
        { status: 404 }
      )
    }

    // 이미 완료되었거나 실패한 경우 DB 값 반환
    if (background.status === 'COMPLETED' || background.status === 'FAILED') {
      return NextResponse.json({ background })
    }

    // KIE API에서 상태 조회
    if (background.kie_task_id) {
      try {
        const queueStatus = await getZImageTurboQueueStatus(background.kie_task_id)

        if (queueStatus.status === 'COMPLETED') {
          // 결과 조회
          try {
            const result = await getZImageTurboQueueResponse(background.kie_task_id)

            if (result.images && result.images.length > 0) {
              // 성공: 이미지 URL 저장
              const imageUrl = result.images[0].url

              const { data: updatedBackground, error: updateError } = await supabase
                .from('ad_background')
                .update({
                  status: 'COMPLETED',
                  image_url: imageUrl,
                  thumbnail_url: imageUrl,  // 썸네일도 같은 이미지 사용
                  updated_at: new Date().toISOString(),
                  completed_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single()

              if (!updateError && updatedBackground) {
                return NextResponse.json({ background: updatedBackground })
              }
            }
          } catch (resultError) {
            console.error('KIE 결과 조회 오류:', resultError)

            // 실패 처리
            const { data: failedBackground, error: updateError } = await supabase
              .from('ad_background')
              .update({
                status: 'FAILED',
                error_message: resultError instanceof Error ? resultError.message : 'Unknown error',
                updated_at: new Date().toISOString(),
              })
              .eq('id', id)
              .select()
              .single()

            if (!updateError && failedBackground) {
              return NextResponse.json({ background: failedBackground })
            }
          }
        } else if (queueStatus.status === 'IN_PROGRESS' && background.status !== 'IN_PROGRESS') {
          // 상태 업데이트
          await supabase
            .from('ad_background')
            .update({
              status: 'IN_PROGRESS',
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
        }
      } catch (apiError) {
        console.error('KIE API 조회 오류:', apiError)
        // API 오류 시 DB 값 그대로 반환
      }
    }

    return NextResponse.json({ background })
  } catch (error) {
    console.error('배경 상태 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
