/**
 * 광고 음악 설정 추천 API
 *
 * POST /api/ad-music/recommend
 * - 선택한 제품 정보를 분석하여 최적의 음악 설정을 추천합니다.
 * - LLM을 활용하여 제품에 맞는 분위기, 장르, 제품 유형을 추천합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { GoogleGenAI, GenerateContentConfig, ThinkingLevel, Type } from '@google/genai'

// Gemini 클라이언트 (lib/gemini/client.ts와 동일한 설정)
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

const MODEL_NAME = 'gemini-3-flash-preview'

// 분위기 옵션
const MOOD_OPTIONS = ['bright', 'calm', 'emotional', 'professional', 'exciting', 'trendy', 'playful', 'romantic', 'nostalgic']

// 장르 옵션
const GENRE_OPTIONS = ['pop', 'electronic', 'classical', 'jazz', 'rock', 'hiphop', 'ambient', 'acoustic', 'lofi', 'cinematic', 'rnb', 'folk']

// 제품 유형 옵션
const PRODUCT_TYPE_OPTIONS = ['cosmetics', 'food', 'tech', 'fashion', 'health', 'automobile', 'finance', 'lifestyle', 'sports', 'kids', 'pet', 'travel']

interface MusicRecommendation {
  mood: string
  genre: string
  productType: string
  reasoning: {
    mood: string
    genre: string
    productType: string
  }
  suggestedName: string
}

async function recommendMusicSettings(
  productName: string,
  productDescription: string,
  productCategory?: string
): Promise<MusicRecommendation> {

  const prompt = `You are an expert music director for advertising. Analyze the product information and recommend the best music settings for creating an advertisement background music.

=== PRODUCT INFORMATION ===
Product Name: ${productName}
Product Description: ${productDescription}
${productCategory ? `Product Category: ${productCategory}` : ''}

=== AVAILABLE OPTIONS ===

**Mood Options (choose one):**
- bright: Uplifting, cheerful, positive energy - best for happy/fun products
- calm: Relaxing, soothing, peaceful - best for wellness/relaxation products
- emotional: Touching, heartfelt, cinematic - best for meaningful/premium products
- professional: Corporate, confident, sophisticated - best for B2B/financial products
- exciting: Energetic, dynamic, thrilling - best for sports/action products
- trendy: Modern, fresh, contemporary - best for youth/fashion products
- playful: Fun, whimsical, lighthearted - best for kids/family/fun products
- romantic: Tender, loving, intimate - best for couples/gifts/special occasions
- nostalgic: Retro, sentimental, warm memories - best for heritage/traditional brands

**Genre Options (choose one):**
- pop: Pop music, catchy melody - most versatile, mainstream appeal
- electronic: Electronic, synth, modern beats - tech/modern products
- classical: Orchestral, elegant, refined - luxury/premium products
- jazz: Jazz, smooth, sophisticated - upscale/adult products
- rock: Rock, guitar-driven, powerful - energetic/bold products
- hiphop: Hip-hop, rhythmic, urban - youth/streetwear products
- ambient: Ambient, atmospheric, ethereal - wellness/nature products
- acoustic: Acoustic, warm, natural - organic/handmade products
- lofi: Lo-fi, chill, relaxed beats - casual/lifestyle/cafe products
- cinematic: Epic, dramatic, movie soundtrack - premium/luxury/impact products
- rnb: R&B, smooth, soulful - beauty/fashion/adult products
- folk: Rustic, storytelling, earthy - artisan/handmade/organic products

**Product Type Options (choose one):**
- cosmetics: Beauty, skincare, makeup products
- food: Food, beverages, restaurants
- tech: Technology, electronics, apps
- fashion: Clothing, accessories, lifestyle brands
- health: Health, wellness, fitness products
- automobile: Cars, vehicles, transportation
- finance: Banking, insurance, investment
- lifestyle: Home, daily life, general consumer goods
- sports: Sports, fitness, athletic gear
- kids: Children's products, toys, education
- pet: Pet products, animal care
- travel: Travel, tourism, vacation services

=== TASK ===
Analyze the product and recommend the BEST combination of mood, genre, and productType that would create the most effective advertisement music.

Consider:
1. Target audience demographics
2. Brand positioning (luxury vs accessible, young vs mature)
3. Product category characteristics
4. Emotional response you want to evoke
5. Commercial effectiveness

Provide reasoning for each choice.`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MEDIUM,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      required: ['mood', 'genre', 'productType', 'reasoning', 'suggestedName'],
      properties: {
        mood: {
          type: Type.STRING,
          description: 'Recommended mood from the available options',
          enum: MOOD_OPTIONS,
        },
        genre: {
          type: Type.STRING,
          description: 'Recommended genre from the available options',
          enum: GENRE_OPTIONS,
        },
        productType: {
          type: Type.STRING,
          description: 'Best matching product type from the available options',
          enum: PRODUCT_TYPE_OPTIONS,
        },
        reasoning: {
          type: Type.OBJECT,
          description: 'Reasoning for each recommendation',
          required: ['mood', 'genre', 'productType'],
          properties: {
            mood: {
              type: Type.STRING,
              description: 'Why this mood was chosen (1-2 sentences, in Korean)',
            },
            genre: {
              type: Type.STRING,
              description: 'Why this genre was chosen (1-2 sentences, in Korean)',
            },
            productType: {
              type: Type.STRING,
              description: 'Why this product type was chosen (1-2 sentences, in Korean)',
            },
          },
        },
        suggestedName: {
          type: Type.STRING,
          description: 'Suggested music name based on the product (in Korean, e.g., "봄향기 화장품 광고 음악")',
        },
      },
    },
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  const responseText = response.text || ''
  const result = JSON.parse(responseText) as MusicRecommendation

  // Validate that the values are in the allowed options
  if (!MOOD_OPTIONS.includes(result.mood)) {
    result.mood = 'bright'
  }
  if (!GENRE_OPTIONS.includes(result.genre)) {
    result.genre = 'pop'
  }
  if (!PRODUCT_TYPE_OPTIONS.includes(result.productType)) {
    result.productType = 'lifestyle'
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // 제품 정보 조회
    const product = await prisma.ad_products.findFirst({
      where: {
        id: productId,
        user_id: user.id,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // LLM으로 음악 설정 추천
    const recommendation = await recommendMusicSettings(
      product.name,
      product.description || ''
    )

    return NextResponse.json({
      recommendation,
      product: {
        id: product.id,
        name: product.name,
      },
    })
  } catch (error) {
    console.error('음악 설정 추천 오류:', error)
    return NextResponse.json(
      { error: 'Failed to recommend music settings' },
      { status: 500 }
    )
  }
}
