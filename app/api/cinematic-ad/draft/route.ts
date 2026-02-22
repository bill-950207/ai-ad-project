/**
 * 시네마틱 광고 드래프트 API
 *
 * GET: 최신 cinematicAd 드래프트 조회
 * POST: 드래프트 생성/업데이트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

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

    // 최신 cinematicAd 드래프트 조회
    const draft = await prisma.video_ads.findFirst({
      where: {
        user_id: user.id,
        category: 'cinematicAd',
        status: 'DRAFT',
      },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        product_id: true,
        wizard_step: true,
        scenario_info: true,
        scenario_method: true,
        prompt: true,
        aspect_ratio: true,
        resolution: true,
        duration: true,
        generate_audio: true,
        updated_at: true,
      },
    })

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('드래프트 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to load draft' },
      { status: 500 }
    )
  }
}

interface DraftRequest {
  videoAdId?: string
  productId?: string
  wizardStep?: number
  scenarioInfo?: string
  scenarioMethod?: string
  prompt?: string
  aspectRatio?: string
  resolution?: string
  duration?: number
  generateAudio?: boolean
  forceNew?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: DraftRequest = await request.json()
    const {
      videoAdId,
      productId,
      wizardStep,
      scenarioInfo,
      scenarioMethod,
      prompt,
      aspectRatio,
      resolution,
      duration,
      generateAudio,
      forceNew = false,
    } = body

    // 기존 드래프트 업데이트
    if (videoAdId && !forceNew) {
      // 소유권 확인
      const existing = await prisma.video_ads.findFirst({
        where: {
          id: videoAdId,
          user_id: user.id,
        },
      })

      if (!existing) {
        return NextResponse.json(
          { error: 'Draft not found' },
          { status: 404 }
        )
      }

      const updated = await prisma.video_ads.update({
        where: { id: videoAdId },
        data: {
          product_id: productId || existing.product_id,
          wizard_step: wizardStep ?? existing.wizard_step,
          scenario_info: scenarioInfo ?? existing.scenario_info,
          scenario_method: scenarioMethod ?? existing.scenario_method,
          prompt: prompt ?? existing.prompt,
          aspect_ratio: aspectRatio ?? existing.aspect_ratio,
          resolution: resolution ?? existing.resolution,
          duration: duration ?? existing.duration,
          generate_audio: generateAudio ?? existing.generate_audio,
          updated_at: new Date(),
        },
        select: { id: true },
      })

      return NextResponse.json({ id: updated.id })
    }

    // 새 드래프트 생성
    const newDraft = await prisma.video_ads.create({
      data: {
        user_id: user.id,
        product_id: productId || null,
        category: 'cinematicAd',
        status: 'DRAFT',
        wizard_step: wizardStep || 1,
        scenario_info: scenarioInfo,
        scenario_method: scenarioMethod,
        prompt,
        aspect_ratio: aspectRatio,
        resolution,
        duration,
        generate_audio: generateAudio,
      },
      select: { id: true },
    })

    return NextResponse.json({ id: newDraft.id }, { status: 201 })
  } catch (error) {
    console.error('드래프트 저장 오류:', error)
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    )
  }
}
