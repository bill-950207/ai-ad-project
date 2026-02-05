/**
 * 제품 URL에서 정보 추출 API
 *
 * POST /api/ad-products/extract-url
 * - 먼저 HTML 스크래핑 시도
 * - 스크래핑 성공 시: LLM으로 데이터 정리/보완 (광고 문구 제거, 요약 등)
 * - 스크래핑 실패 시: 에러 반환
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI, GenerateContentConfig, Type, ThinkingLevel } from '@google/genai'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

const MODEL_NAME = 'gemini-3-flash-preview'

interface ExtractedProductInfo {
  title?: string
  description?: string
  price?: string
  brand?: string
  features?: string[]
  imageUrl?: string
}

/**
 * 이미지 URL이 클라이언트 브라우저에서 접근 가능한지 실제로 요청해서 확인
 * - 레퍼러 없이 요청하여 클라이언트 환경과 유사하게 테스트
 */
async function isImageAccessible(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        // 레퍼러 제거하여 클라이언트 직접 접근과 유사하게
        'Referer': '',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.log(`이미지 접근 실패 (${response.status}):`, imageUrl)
      return false
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.startsWith('image/')) {
      console.log('이미지가 아닌 응답:', imageUrl, contentType)
      return false
    }

    return true
  } catch (error) {
    console.log('이미지 접근 오류:', imageUrl, error)
    return false
  }
}

/**
 * HTML에서 메타 정보 추출 시도
 */
async function scrapeProductInfo(url: string): Promise<ExtractedProductInfo | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()

    // 간단한 메타 태그 파싱
    const getMetaContent = (name: string): string | undefined => {
      const patterns = [
        new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'),
      ]
      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match) return match[1]
      }
      return undefined
    }

    const getTagContent = (tag: string): string | undefined => {
      const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'))
      return match ? match[1].trim() : undefined
    }

    // Open Graph 및 메타 태그에서 정보 추출
    const title = getMetaContent('og:title') ||
      getMetaContent('twitter:title') ||
      getTagContent('title')

    const description = getMetaContent('og:description') ||
      getMetaContent('twitter:description') ||
      getMetaContent('description')

    const imageUrl = getMetaContent('og:image') ||
      getMetaContent('twitter:image')

    // 가격 추출 시도 (JSON-LD에서)
    let price: string | undefined
    let brand: string | undefined
    try {
      const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
      if (jsonLdMatch) {
        for (const jsonScript of jsonLdMatch) {
          const jsonContent = jsonScript.replace(/<script[^>]*>|<\/script>/gi, '')
          const parsed = JSON.parse(jsonContent)
          const product = parsed['@type'] === 'Product' ? parsed : parsed['@graph']?.find((item: { '@type': string }) => item['@type'] === 'Product')
          if (product) {
            if (product.offers?.price) {
              price = `${product.offers.priceCurrency || ''} ${product.offers.price}`.trim()
            }
            if (product.brand?.name) {
              brand = product.brand.name
            }
            break
          }
        }
      }
    } catch {
      // JSON-LD 파싱 실패 무시
    }

    // 최소한의 정보가 있으면 반환
    if (title || description) {
      // 이미지 URL 검증 (실제 접근 가능 여부 확인)
      let validatedImageUrl: string | undefined
      if (imageUrl) {
        const accessible = await isImageAccessible(imageUrl)
        if (accessible) {
          validatedImageUrl = imageUrl
        }
      }

      return {
        title: title || undefined,
        description: description || undefined,
        price,
        brand,
        imageUrl: validatedImageUrl,
      }
    }

    return null
  } catch (error) {
    console.error('스크래핑 오류:', error)
    return null
  }
}

// LLM 응답 스키마 (공통)
const productInfoSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      nullable: true,
      description: '제품명 (브랜드명 포함, 간결하게)',
    },
    description: {
      type: Type.STRING,
      nullable: true,
      description: '제품 설명 (핵심 내용 2-3문장 요약, 광고 문구나 불필요한 내용 제외)',
    },
    price: {
      type: Type.STRING,
      nullable: true,
      description: '가격 (통화 기호 포함, 숫자 포맷 정리)',
    },
    brand: {
      type: Type.STRING,
      nullable: true,
      description: '브랜드명',
    },
    features: {
      type: Type.ARRAY,
      nullable: true,
      items: { type: Type.STRING },
      description: '주요 특징/셀링 포인트 (3-5개, 간결한 문장)',
    },
    imageUrl: {
      type: Type.STRING,
      nullable: true,
      description: '대표 제품 이미지 URL',
    },
  },
}

/**
 * 스크래핑된 데이터를 LLM으로 정리/보완
 */
async function cleanScrapedDataWithLLM(
  scrapedData: ExtractedProductInfo,
  url: string
): Promise<ExtractedProductInfo> {
  const prompt = `다음은 제품 페이지에서 스크래핑한 원본 데이터입니다. 이 데이터를 깔끔하게 정리해주세요.

=== 원본 데이터 ===
제품명: ${scrapedData.title || '없음'}
설명: ${scrapedData.description || '없음'}
가격: ${scrapedData.price || '없음'}
브랜드: ${scrapedData.brand || '없음'}
이미지 URL: ${scrapedData.imageUrl || '없음'}

=== URL (참고용) ===
${url}

=== 정리 지침 ===
1. 제품명 (title):
   - 불필요한 수식어, 광고 문구, 특수문자 제거
   - 브랜드명 + 제품명 형태로 간결하게
   - 예: "[무료배송] 더페이스샵 파워 퍼펙션..." → "더페이스샵 파워 퍼펙션 BB크림"

2. 설명 (description):
   - 광고 문구, 배송 정보, 이벤트 정보 제거
   - 제품의 핵심 기능과 특징만 2-3문장으로 요약
   - 자연스러운 문장으로 재구성

3. 가격 (price):
   - 통화 기호와 숫자만 유지 (예: "₩15,000" 또는 "$29.99")
   - 할인가가 있으면 할인가 사용

4. 브랜드 (brand):
   - 정확한 브랜드명만 추출

5. 특징 (features):
   - 설명에서 3-5개의 핵심 특징/셀링포인트 추출
   - 각 특징은 한 문장으로 간결하게
   - 중복 내용 제거

6. 이미지 URL: 원본 유지 (수정하지 않음)

정보가 부족하거나 없는 필드는 null로 표시하세요.`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.LOW,
    },
    responseMimeType: 'application/json',
    responseSchema: productInfoSchema,
  }

  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config,
    })

    const responseText = response.text || '{}'
    const result = JSON.parse(responseText)

    // 이미지 URL은 스크래핑 단계에서 이미 검증됨 (scrapedData.imageUrl)
    // LLM은 이미지 URL을 수정하지 않도록 프롬프트에 명시
    return {
      title: result.title || scrapedData.title || undefined,
      description: result.description || scrapedData.description || undefined,
      price: result.price || scrapedData.price || undefined,
      brand: result.brand || scrapedData.brand || undefined,
      features: result.features || undefined,
      imageUrl: scrapedData.imageUrl, // 원본 유지 (이미 검증됨)
    }
  } catch (error) {
    console.error('스크래핑 데이터 정리 오류:', error)
    // LLM 정리 실패 시 원본 데이터 반환
    return scrapedData
  }
}

/**
 * POST /api/ad-products/extract-url
 *
 * URL에서 제품 정보를 추출합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body as { url: string }

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // URL 유효성 검사
    let validUrl: URL
    try {
      validUrl = new URL(url.trim())
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // 1단계: 스크래핑 시도
    console.log('스크래핑 시도:', validUrl.href)
    const scrapedInfo = await scrapeProductInfo(validUrl.href)

    // 스크래핑 결과 확인 (최소 title 또는 description이 있어야 함)
    const hasMinimalInfo = scrapedInfo && (scrapedInfo.title || scrapedInfo.description)

    if (!hasMinimalInfo) {
      // 스크래핑 실패 시 에러 반환
      console.log('스크래핑 실패:', validUrl.href)
      return NextResponse.json(
        { error: '제품 정보를 가져올 수 없습니다' },
        { status: 400 }
      )
    }

    // 2단계: 스크래핑 성공 시 LLM으로 데이터 정리/보완
    console.log('스크래핑 성공, LLM으로 데이터 정리:', validUrl.href)
    const productInfo = await cleanScrapedDataWithLLM(scrapedInfo, validUrl.href)

    return NextResponse.json({
      success: true,
      productInfo: {
        title: productInfo?.title || null,
        description: productInfo?.description || null,
        price: productInfo?.price || null,
        brand: productInfo?.brand || null,
        features: productInfo?.features || null,
        imageUrl: productInfo?.imageUrl || null,
      },
    })
  } catch (error) {
    console.error('URL 추출 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract product info' },
      { status: 500 }
    )
  }
}
