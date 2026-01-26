/**
 * 의상 교체 API 라우트
 *
 * POST /api/avatars/[id]/outfits - 의상 교체 요청 생성
 * GET /api/avatars/[id]/outfits - 아바타의 의상 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { generateOutfitInputUploadUrl } from '@/lib/storage/r2'
import { submitSeedreamOutfitEditToQueue } from '@/lib/fal/client'
import { submitOutfitEditToQueue as submitOutfitEditToKieQueue } from '@/lib/kie/client'
import { OUTFIT_CREDIT_COST } from '@/lib/credits'

/** 라우트 파라미터 타입 */
interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/avatars/[id]/outfits
 *
 * 의상 교체 요청을 생성합니다.
 * FormData로 이미지를 받아 R2에 업로드 후 fal.ai에 요청을 제출합니다.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: avatarId } = await params

    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 아바타 조회 (본인 소유 & 완료 상태 확인)
    const avatar = await prisma.avatars.findFirst({
      where: {
        id: avatarId,
        user_id: user.id,
        status: 'COMPLETED',
      },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found or not completed' }, { status: 404 })
    }

    if (!avatar.image_url_original) {
      return NextResponse.json({ error: 'Avatar has no original image' }, { status: 400 })
    }

    // 크레딧 확인
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
    })

    if (!profile || (profile.credits ?? 0) < OUTFIT_CREDIT_COST) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    // FormData 파싱
    const formData = await request.formData()
    const name = formData.get('name') as string
    const outfitType = formData.get('outfitType') as 'combined' | 'separate'

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // 이미지 파일 가져오기
    let outfitImage: File | null = null
    let topImage: File | null = null
    let bottomImage: File | null = null
    let shoesImage: File | null = null

    if (outfitType === 'combined') {
      outfitImage = formData.get('outfitImage') as File | null
      if (!outfitImage) {
        return NextResponse.json({ error: 'Outfit image is required' }, { status: 400 })
      }
    } else {
      topImage = formData.get('topImage') as File | null
      bottomImage = formData.get('bottomImage') as File | null
      shoesImage = formData.get('shoesImage') as File | null

      if (!topImage && !bottomImage && !shoesImage) {
        return NextResponse.json({ error: 'At least one clothing item is required' }, { status: 400 })
      }
    }

    // 의상 레코드 생성
    const outfit = await prisma.avatar_outfits.create({
      data: {
        avatar_id: avatarId,
        user_id: user.id,
        name: name.trim(),
        outfit_type: outfitType,
        status: 'PENDING',
      },
    })

    // 이미지 R2 업로드 및 URL 저장
    const uploadImageToR2 = async (file: File, type: 'outfit' | 'top' | 'bottom' | 'shoes'): Promise<string> => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const uploadInfo = await generateOutfitInputUploadUrl(outfit.id, type, ext)

      // 파일을 R2에 업로드
      const arrayBuffer = await file.arrayBuffer()
      const response = await fetch(uploadInfo.uploadUrl, {
        method: 'PUT',
        body: arrayBuffer,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to upload ${type} image`)
      }

      return uploadInfo.publicUrl
    }

    // 이미지 업로드
    let outfitImageUrl: string | null = null
    let topImageUrl: string | null = null
    let bottomImageUrl: string | null = null
    let shoesImageUrl: string | null = null

    if (outfitType === 'combined' && outfitImage) {
      outfitImageUrl = await uploadImageToR2(outfitImage, 'outfit')
    } else {
      if (topImage) topImageUrl = await uploadImageToR2(topImage, 'top')
      if (bottomImage) bottomImageUrl = await uploadImageToR2(bottomImage, 'bottom')
      if (shoesImage) shoesImageUrl = await uploadImageToR2(shoesImage, 'shoes')
    }

    // 의상 레코드 업데이트
    await prisma.avatar_outfits.update({
      where: { id: outfit.id },
      data: {
        outfit_image_url: outfitImageUrl,
        top_image_url: topImageUrl,
        bottom_image_url: bottomImageUrl,
        shoes_image_url: shoesImageUrl,
        status: 'IN_QUEUE',
      },
    })

    // 의상 이미지 URL 결정
    let garmentImageUrl: string

    if (outfitType === 'combined' && outfitImageUrl) {
      garmentImageUrl = outfitImageUrl
    } else if (topImageUrl) {
      garmentImageUrl = topImageUrl
    } else if (bottomImageUrl) {
      garmentImageUrl = bottomImageUrl
    } else if (shoesImageUrl) {
      garmentImageUrl = shoesImageUrl
    } else {
      return NextResponse.json({ error: 'No valid garment image' }, { status: 400 })
    }

    // fal.ai Seedream 4.5로 요청 제출 (실패 시 Kie.ai 폴백)
    let queueResponse: { request_id: string }

    try {
      // fal.ai Seedream 4.5 먼저 시도
      queueResponse = await submitSeedreamOutfitEditToQueue(
        avatar.image_url_original,
        garmentImageUrl,
        '9:16'  // 아바타용 세로 비율
      )
    } catch (falError) {
      console.warn('fal.ai Seedream 실패, Kie.ai로 폴백:', falError)
      // Kie.ai 폴백
      queueResponse = await submitOutfitEditToKieQueue(
        avatar.image_url_original,
        garmentImageUrl,
        '9:16'
      )
    }

    // 요청 ID 저장 및 크레딧 차감
    await prisma.$transaction([
      prisma.avatar_outfits.update({
        where: { id: outfit.id },
        data: {
          fal_request_id: queueResponse.request_id,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.profiles.update({
        where: { id: user.id },
        data: {
          credits: { decrement: OUTFIT_CREDIT_COST },
        },
      }),
    ])

    return NextResponse.json({
      outfit: {
        id: outfit.id,
        name: outfit.name,
        status: 'IN_PROGRESS',
      },
    })
  } catch (error) {
    console.error('의상 교체 요청 오류:', error)
    return NextResponse.json(
      { error: 'Failed to create outfit change request' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/avatars/[id]/outfits
 *
 * 아바타의 의상 목록을 조회합니다.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: avatarId } = await params

    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 아바타 소유권 확인
    const avatar = await prisma.avatars.findFirst({
      where: {
        id: avatarId,
        user_id: user.id,
      },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    // 의상 목록 조회
    const outfits = await prisma.avatar_outfits.findMany({
      where: {
        avatar_id: avatarId,
        user_id: user.id,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json({ outfits })
  } catch (error) {
    console.error('의상 목록 조회 오류:', error)
    return NextResponse.json(
      { error: 'Failed to fetch outfits' },
      { status: 500 }
    )
  }
}
