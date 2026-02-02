/**
 * 이미지 광고 재시도 API
 *
 * POST: 실패한 이미지 광고를 동일한 입력값으로 새로 생성
 * - 기존 입력값(ad_type, product_id, avatar_id 등)을 사용하여 새로운 프롬프트 생성
 * - 크레딧은 이미 차감되었으므로 재차감 없음
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitSeedreamEditToQueue, type SeedreamAspectRatio } from '@/lib/fal/client'
import {
  submitGPTImageToQueue as submitKieGptImageToQueue,
  type GPTImageAspectRatio,
} from '@/lib/kie/client'
import { generateImageAdPrompt, type ImageAdType as GeminiImageAdType } from '@/lib/gemini/client'

// 이미지 크기를 Seedream aspect_ratio로 변환
function imageSizeToAspectRatio(size: string): SeedreamAspectRatio {
  switch (size) {
    case '1024x1024':
      return '1:1'
    case '1536x1024':
      return '3:2'
    case '1024x1536':
      return '2:3'
    default:
      return '1:1'
  }
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 실패한 이미지 광고 조회 (원본 입력값 포함)
    const { data: imageAd, error: findError } = await supabase
      .from('image_ads')
      .select(`
        id,
        status,
        ad_type,
        product_id,
        avatar_id,
        outfit_id,
        image_size,
        quality,
        selected_options,
        ad_products (
          id,
          name,
          description,
          rembg_image_url,
          image_url
        ),
        avatars (
          id,
          name,
          image_url
        ),
        avatar_outfits (
          id,
          name,
          image_url
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (findError || !imageAd) {
      return NextResponse.json(
        { error: 'Image ad not found' },
        { status: 404 }
      )
    }

    // 실패 상태 확인
    if (imageAd.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Only failed image ads can be retried' },
        { status: 400 }
      )
    }

    const quality = (imageAd.quality || 'medium') as 'medium' | 'high'
    const adType = imageAd.ad_type as GeminiImageAdType

    // 이미지 URL 수집
    const imageUrls: string[] = []

    // 제품 정보
    const adProduct = imageAd.ad_products as unknown as {
      id: string
      name: string
      description: string | null
      rembg_image_url: string | null
      image_url: string | null
    } | null

    let productName: string | undefined
    let productDescription: string | undefined
    let productImageUrl: string | undefined

    if (adProduct) {
      productName = adProduct.name
      productDescription = adProduct.description || undefined
      productImageUrl = adProduct.rembg_image_url || adProduct.image_url || undefined
      if (productImageUrl) {
        imageUrls.push(productImageUrl)
      }
    }

    // 아바타/의상 정보
    const avatar = imageAd.avatars as unknown as { id: string; name: string; image_url: string | null } | null
    const outfit = imageAd.avatar_outfits as unknown as { id: string; name: string; image_url: string | null } | null

    const avatarImageUrls: string[] = []
    let outfitImageUrl: string | undefined

    // 착용샷은 의상 이미지 사용, 그 외는 아바타 이미지
    if (imageAd.ad_type === 'wearing' && outfit?.image_url) {
      imageUrls.push(outfit.image_url)
      outfitImageUrl = outfit.image_url
      if (avatar?.image_url) {
        avatarImageUrls.push(avatar.image_url)
      }
    } else if (avatar?.image_url) {
      imageUrls.push(avatar.image_url)
      avatarImageUrls.push(avatar.image_url)
    }

    // AI 생성 아바타인지 확인 (avatar_id가 null인데 productOnly가 아닌 경우)
    const isAiGeneratedAvatar = !imageAd.avatar_id && imageAd.ad_type !== 'productOnly'

    // 선택 옵션 (AI 아바타 옵션 분리)
    const rawSelectedOptions = (imageAd.selected_options as Record<string, unknown>) || {}
    const aiAvatarOptions = rawSelectedOptions._aiAvatarOptions as {
      targetGender?: string
      targetAge?: string
      style?: string
      ethnicity?: string
      bodyType?: string
      // 상세 옵션
      height?: string
      hairStyle?: string
      hairColor?: string
      outfitStyle?: string
    } | undefined

    // _aiAvatarOptions 제외한 일반 옵션
    const selectedOptions: Record<string, string> = {}
    for (const [key, value] of Object.entries(rawSelectedOptions)) {
      if (key !== '_aiAvatarOptions' && typeof value === 'string') {
        selectedOptions[key] = value
      }
    }

    // Gemini를 사용하여 새로운 프롬프트 생성
    let finalPrompt: string
    try {
      console.log('재시도: Gemini 프롬프트 생성 시작:', {
        adType,
        productName,
        hasProductImage: !!productImageUrl,
        avatarCount: avatarImageUrls.length,
        isAiGeneratedAvatar,
      })

      const geminiResult = await generateImageAdPrompt({
        adType,
        productName,
        productDescription,
        productImageUrl,
        avatarImageUrls: avatarImageUrls.length > 0 ? avatarImageUrls : undefined,
        outfitImageUrl,
        selectedOptions,
        additionalPrompt: '', // 추가 프롬프트는 원본에서 가져올 수 없으므로 빈 문자열
      })

      finalPrompt = geminiResult.optimizedPrompt
      console.log('재시도: Gemini 프롬프트 생성 완료:', { koreanDescription: geminiResult.koreanDescription })
    } catch (geminiError) {
      console.error('재시도: Gemini 프롬프트 생성 실패, 기본 프롬프트 사용:', geminiError)

      // Gemini 실패 시 기본 프롬프트 생성
      const optionParts: string[] = []
      if (selectedOptions.background) optionParts.push(`${selectedOptions.background} background`)
      if (selectedOptions.lighting) optionParts.push(`${selectedOptions.lighting} lighting`)
      if (selectedOptions.mood) optionParts.push(`${selectedOptions.mood} mood`)
      if (selectedOptions.angle) optionParts.push(`${selectedOptions.angle} angle`)

      finalPrompt = getTypePromptPrefix(adType)
      if (optionParts.length > 0) {
        finalPrompt += ` Style: ${optionParts.join(', ')}.`
      }
    }

    // AI 아바타인 경우 아바타 설명을 프롬프트 앞에 추가
    let promptToSave = finalPrompt
    if (isAiGeneratedAvatar && aiAvatarOptions) {
      const genderMap: Record<string, string> = { male: 'male', female: 'female', any: '' }
      const ageMap: Record<string, string> = {
        teen: 'teenage',
        early20s: 'in their early 20s',
        late20s: 'in their late 20s',
        '30s': 'in their 30s',
        '40plus': 'in their 40s or older',
        young: 'in their 20s-30s',
        middle: 'in their 30s-40s',
        mature: 'in their 40s-50s',
        any: ''
      }
      const styleMap: Record<string, string> = { natural: 'natural and friendly', professional: 'professional and sophisticated', casual: 'casual and relaxed', elegant: 'elegant and luxurious', any: '' }
      const ethnicityMap: Record<string, string> = {
        eastAsian: 'East Asian',
        southeastAsian: 'Southeast Asian',
        southAsian: 'South Asian',
        caucasian: 'Caucasian',
        black: 'Black/African',
        hispanic: 'Hispanic/Latino',
        middleEastern: 'Middle Eastern',
        korean: 'Korean',
        asian: 'Asian',
        western: 'Western/Caucasian',
        any: ''
      }
      const bodyTypeMap: Record<string, string> = {
        slim: 'slim slender body with thin waist and lean figure',
        average: 'average body build',
        athletic: 'athletic toned body with defined muscles and fit physique',
        curvy: 'curvy voluptuous figure with prominent curves, full hips and bust',
        muscular: 'muscular well-built physique with strong defined muscles',
        any: ''
      }
      const heightMap: Record<string, string> = { short: 'petite/short', average: 'average height', tall: 'tall', any: '' }
      const hairStyleMap: Record<string, string> = { short: 'short hair', medium: 'medium-length hair', long: 'long hair', any: '' }
      const hairColorMap: Record<string, string> = { black: 'black hair', brown: 'brown hair', blonde: 'blonde hair', any: '' }
      const outfitStyleMap: Record<string, string> = { casual: 'casual outfit', formal: 'formal attire', sporty: 'sporty/athletic wear', professional: 'professional business attire', elegant: 'elegant outfit', any: '' }

      const avatarParts: string[] = []
      if (aiAvatarOptions.ethnicity && aiAvatarOptions.ethnicity !== 'any' && ethnicityMap[aiAvatarOptions.ethnicity]) {
        avatarParts.push(ethnicityMap[aiAvatarOptions.ethnicity])
      }
      if (aiAvatarOptions.targetGender && aiAvatarOptions.targetGender !== 'any' && genderMap[aiAvatarOptions.targetGender]) {
        avatarParts.push(genderMap[aiAvatarOptions.targetGender])
      }
      if (aiAvatarOptions.targetAge && aiAvatarOptions.targetAge !== 'any' && ageMap[aiAvatarOptions.targetAge]) {
        avatarParts.push(`person ${ageMap[aiAvatarOptions.targetAge]}`)
      }
      if (aiAvatarOptions.height && aiAvatarOptions.height !== 'any' && heightMap[aiAvatarOptions.height]) {
        avatarParts.push(heightMap[aiAvatarOptions.height])
      }
      if (aiAvatarOptions.bodyType && aiAvatarOptions.bodyType !== 'any' && bodyTypeMap[aiAvatarOptions.bodyType]) {
        avatarParts.push(`with ${bodyTypeMap[aiAvatarOptions.bodyType]}`)
      }
      if (aiAvatarOptions.hairStyle && aiAvatarOptions.hairStyle !== 'any' && hairStyleMap[aiAvatarOptions.hairStyle]) {
        avatarParts.push(hairStyleMap[aiAvatarOptions.hairStyle])
      }
      if (aiAvatarOptions.hairColor && aiAvatarOptions.hairColor !== 'any' && hairColorMap[aiAvatarOptions.hairColor]) {
        avatarParts.push(hairColorMap[aiAvatarOptions.hairColor])
      }
      if (aiAvatarOptions.outfitStyle && aiAvatarOptions.outfitStyle !== 'any' && outfitStyleMap[aiAvatarOptions.outfitStyle]) {
        avatarParts.push(`wearing ${outfitStyleMap[aiAvatarOptions.outfitStyle]}`)
      }
      if (aiAvatarOptions.style && aiAvatarOptions.style !== 'any' && styleMap[aiAvatarOptions.style]) {
        avatarParts.push(`${styleMap[aiAvatarOptions.style]} appearance`)
      }

      // 의상 지정이 없는 경우 기본 완전한 의상 추가
      const hasOutfitSpecified = aiAvatarOptions.outfitStyle && aiAvatarOptions.outfitStyle !== 'any'
      if (!hasOutfitSpecified) {
        if (adType === 'wearing') {
          // 착용샷: 제품이 의상이므로 제품 제외한 코디 의상 추천
          avatarParts.push('wearing a complete coordinated outfit that complements the advertised product (select appropriate top/bottom/accessories EXCLUDING the product being worn)')
        } else {
          // 그 외: 제품에 어울리는 완전한 의상 추천
          avatarParts.push('wearing a stylish complete outfit appropriate for the scene (including both top and bottom clothing that complements the product)')
        }
      }

      // 모든 옵션이 '무관'이거나 설정되지 않은 경우
      if (avatarParts.length === 0) {
        avatarParts.push('person suitable for this product advertisement')
      } else if (!avatarParts.some(p => p.includes('person'))) {
        avatarParts.push('person')
      }

      const avatarDescription = avatarParts.join(' ')
      promptToSave = `A ${avatarDescription}. ${finalPrompt}`
      console.log('재시도: AI 아바타 설명 추가:', { avatarDescription })
    }

    const aspectRatio = imageSizeToAspectRatio(imageAd.image_size || '1024x1024')

    let requestId: string
    let provider: 'fal' | 'kie'

    if (isAiGeneratedAvatar) {
      // AI 생성 아바타: kie.ai GPT-Image 1.5 사용
      const kieAspectRatio: GPTImageAspectRatio = aspectRatio === '1:1' ? '1:1' : aspectRatio === '3:2' ? '3:2' : '2:3'
      const kieQuality = quality === 'high' ? 'high' : 'medium'

      const response = await submitKieGptImageToQueue(imageUrls, promptToSave, kieAspectRatio, kieQuality)
      requestId = response.request_id
      provider = 'kie'
    } else {
      // 기존 아바타: fal.ai Seedream 4.5 Edit 사용
      const seedreamQuality = quality === 'high' ? 'high' : 'basic'

      const response = await submitSeedreamEditToQueue({
        prompt: promptToSave,
        image_urls: imageUrls,
        aspect_ratio: aspectRatio,
        quality: seedreamQuality,
      })
      requestId = response.request_id
      provider = 'fal'
    }

    const fal_request_id = `${provider}:${requestId}`

    // 기존 실패한 광고를 재사용 (상태 업데이트 + 새 프롬프트 저장)
    const { error: updateError } = await supabase
      .from('image_ads')
      .update({
        status: 'IN_QUEUE',
        fal_request_id: fal_request_id,
        prompt: promptToSave,  // AI 아바타인 경우 아바타 설명 포함
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('이미지 광고 재시도 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: 'Failed to update image ad' },
        { status: 500 }
      )
    }

    // 크레딧은 이미 차감되었으므로 재차감 없음
    console.log('이미지 광고 재시도 (크레딧 차감 없음):', { userId: user.id, imageAdId: id, requestId: fal_request_id })

    return NextResponse.json({
      success: true,
      imageAdId: id,
      requestId: fal_request_id,
    })
  } catch (error) {
    console.error('이미지 광고 재시도 오류:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 광고 유형별 프롬프트 접두사
function getTypePromptPrefix(adType: string): string {
  switch (adType) {
    case 'productOnly':
      return 'Create a professional product photography showcasing the product from the reference image.'
    case 'holding':
      return 'Create an advertisement image where the model from the reference is naturally holding the product.'
    case 'using':
      return 'Create an advertisement image where the model from the reference is actively using the product.'
    case 'wearing':
      return 'Create a fashion advertisement image showcasing the model WEARING the clothing/underwear product from the reference image. The product is the actual item to be worn, NOT an accessory to hold.'
    case 'lifestyle':
      return 'Create a lifestyle advertisement showing the model naturally incorporating the product into daily life.'
    case 'unboxing':
      return 'Create an unboxing/review style advertisement with the model opening or presenting the product.'
    case 'seasonal':
      return 'Create a seasonal/themed advertisement with festive atmosphere.'
    default:
      return 'Create a professional advertisement image.'
  }
}
