/**
 * 광고 배경 API
 *
 * POST: 새 배경 이미지 생성 요청
 * GET: 사용자의 배경 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { generateBackgroundPrompt, type BackgroundGenerationMode, type BackgroundOptions } from '@/lib/gemini/client'
import { submitAdBackgroundToQueue, type ZImageAspectRatio } from '@/lib/kie/client'
import { BACKGROUND_CREDIT_COST } from '@/lib/credits'

interface CreateBackgroundRequest {
  name: string
  mode: BackgroundGenerationMode
  // PRODUCT 모드
  adProductId?: string
  // OPTIONS 모드
  options?: BackgroundOptions
  // PROMPT 모드
  userPrompt?: string
  // 공통
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
}

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

    const body: CreateBackgroundRequest = await request.json()
    const { name, mode, adProductId, options, userPrompt, aspectRatio = '16:9' } = body

    // 입력 유효성 검사
    if (!name || !mode) {
      return NextResponse.json(
        { error: 'name과 mode는 필수입니다' },
        { status: 400 }
      )
    }

    // 크레딧 확인
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
    })

    if (!profile || (profile.credits ?? 0) < BACKGROUND_CREDIT_COST) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: BACKGROUND_CREDIT_COST, available: profile?.credits ?? 0 },
        { status: 402 }
      )
    }

    // PRODUCT 모드 시 제품 정보 조회
    let productName: string | undefined
    let productDescription: string | undefined
    let productImageUrl: string | undefined

    if (mode === 'PRODUCT' && adProductId) {
      const { data: product, error: productError } = await supabase
        .from('ad_products')
        .select('name, description, image_url')
        .eq('id', adProductId)
        .eq('user_id', user.id)
        .single()

      if (productError || !product) {
        return NextResponse.json(
          { error: '제품을 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      productName = product.name
      productDescription = product.description || undefined
      productImageUrl = product.image_url || undefined
    }

    // 원본 프롬프트 저장용
    let originalPrompt: string | undefined
    if (mode === 'PROMPT') {
      originalPrompt = userPrompt
    } else if (mode === 'OPTIONS') {
      originalPrompt = JSON.stringify(options)
    } else if (mode === 'PRODUCT') {
      originalPrompt = `제품: ${productName}`
    }

    // Gemini로 프롬프트 최적화
    const promptResult = await generateBackgroundPrompt({
      mode,
      productImageUrl,
      productName,
      productDescription,
      options,
      userPrompt,
      aspectRatio,
    })

    // 배경 레코드 생성 (IN_QUEUE 상태)
    const { data: background, error: insertError } = await supabase
      .from('ad_background')
      .insert({
        user_id: user.id,
        name,
        status: 'IN_QUEUE',
        mode,
        ad_product_id: adProductId || null,
        original_prompt: originalPrompt,
        optimized_prompt: promptResult.optimizedPrompt,
        options: mode === 'OPTIONS' ? options : null,
        aspect_ratio: aspectRatio,
        model: 'z-image-turbo',
      })
      .select()
      .single()

    if (insertError || !background) {
      console.error('배경 레코드 생성 오류:', insertError)
      return NextResponse.json(
        { error: '배경 생성 요청 실패' },
        { status: 500 }
      )
    }

    // KIE API로 이미지 생성 요청
    try {
      const { taskId } = await submitAdBackgroundToQueue(
        promptResult.optimizedPrompt,
        aspectRatio as ZImageAspectRatio
      )

      // Task ID 업데이트 및 크레딧 차감
      await Promise.all([
        supabase
          .from('ad_background')
          .update({
            kie_task_id: taskId,
            status: 'IN_PROGRESS',
            updated_at: new Date().toISOString(),
          })
          .eq('id', background.id),
        prisma.profiles.update({
          where: { id: user.id },
          data: { credits: { decrement: BACKGROUND_CREDIT_COST } },
        }),
      ])

      return NextResponse.json({
        background: {
          ...background,
          kie_task_id: taskId,
          status: 'IN_PROGRESS',
        },
        koreanDescription: promptResult.koreanDescription,
      })
    } catch (kieError) {
      console.error('KIE API 오류:', kieError)

      // 실패 처리
      await supabase
        .from('ad_background')
        .update({
          status: 'FAILED',
          error_message: kieError instanceof Error ? kieError.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', background.id)

      return NextResponse.json(
        { error: '이미지 생성 요청 실패' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('배경 생성 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') // COMPLETED, PENDING, etc.

    // 배경 목록 조회
    let query = supabase
      .from('ad_background')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: backgrounds, error: fetchError, count } = await query

    if (fetchError) {
      console.error('배경 목록 조회 오류:', fetchError)
      return NextResponse.json(
        { error: '배경 목록 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      backgrounds,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error('배경 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
