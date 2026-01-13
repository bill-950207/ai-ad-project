/**
 * 제품 URL에서 정보 추출 API
 *
 * POST /api/ad-products/extract-url
 * - 먼저 HTML 스크래핑 시도
 * - 실패하거나 정보 부족 시 Gemini의 googleSearch/urlContext로 정보 검색
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
      return {
        title: title || undefined,
        description: description || undefined,
        price,
        brand,
        imageUrl: imageUrl || undefined,
      }
    }

    return null
  } catch (error) {
    console.error('스크래핑 오류:', error)
    return null
  }
}

/**
 * Gemini를 사용하여 제품 정보 추출
 */
async function extractWithGemini(url: string): Promise<ExtractedProductInfo> {
  const prompt = `다음 URL은 제품 상세 페이지입니다. URL에 직접 접근하여 제품 정보를 추출해주세요.
필요한 경우 Google 검색을 사용하여 추가 정보를 수집할 수 있습니다.

URL: ${url}

다음 정보를 추출해주세요:
1. 제품명 (title)
2. 제품 설명 (description) - 핵심 내용을 2-3문장으로 요약
3. 가격 (price) - 통화 기호 포함
4. 브랜드명 (brand)
5. 주요 특징/셀링 포인트 (features) - 3-5개의 핵심 특징
6. 대표 제품 이미지 URL (imageUrl) - 있는 경우만

정보를 찾을 수 없는 필드는 null로 표시하세요.`

  const config: GenerateContentConfig = {
    tools: [
      { urlContext: {} },
      { googleSearch: {} },
    ],
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          nullable: true,
          description: '제품명',
        },
        description: {
          type: Type.STRING,
          nullable: true,
          description: '제품 설명 (2-3문장 요약)',
        },
        price: {
          type: Type.STRING,
          nullable: true,
          description: '가격 (통화 기호 포함)',
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
          description: '주요 특징/셀링 포인트 (3-5개)',
        },
        imageUrl: {
          type: Type.STRING,
          nullable: true,
          description: '대표 제품 이미지 URL',
        },
      },
    },
  }

  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config,
    })

    const responseText = response.text || '{}'
    const result = JSON.parse(responseText)

    return {
      title: result.title || undefined,
      description: result.description || undefined,
      price: result.price || undefined,
      brand: result.brand || undefined,
      features: result.features || undefined,
      imageUrl: result.imageUrl || undefined,
    }
  } catch (error) {
    console.error('Gemini 추출 오류:', error)
    throw new Error('제품 정보를 추출할 수 없습니다')
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
    let productInfo = await scrapeProductInfo(validUrl.href)

    // 스크래핑 결과 확인 (최소 title 또는 description이 있어야 함)
    const hasMinimalInfo = productInfo && (productInfo.title || productInfo.description)

    // 2단계: 스크래핑 실패 또는 정보 부족 시 Gemini 사용
    if (!hasMinimalInfo) {
      console.log('Gemini 추출 시도:', validUrl.href)
      productInfo = await extractWithGemini(validUrl.href)
    }

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
      source: hasMinimalInfo ? 'scraping' : 'gemini',
    })
  } catch (error) {
    console.error('URL 추출 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract product info' },
      { status: 500 }
    )
  }
}
