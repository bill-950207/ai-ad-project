/**
 * 참조 영상 분석 API
 *
 * POST: 업로드된 영상 파일 또는 YouTube URL을 분석하여 광고 요소를 추출합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI, GenerateContentConfig, ThinkingLevel, Type } from '@google/genai'
import { uploadBufferToR2 } from '@/lib/storage/r2'

// Gemini 클라이언트 초기화
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
})

const MODEL_NAME = 'gemini-3-flash-preview'

interface AnalyzedElements {
  background: string
  mood: string
  cameraAngle: string
  productPlacement: string
  lighting: string
  colorTone: string
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

    const formData = await request.formData()
    const type = formData.get('type') as string
    const productName = formData.get('productName') as string
    const productDescription = formData.get('productDescription') as string

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    let videoUrl: string | null = null
    let analysisContent: string = ''

    if (type === 'file') {
      // 파일 업로드 처리
      const file = formData.get('file') as File
      if (!file) {
        return NextResponse.json(
          { error: 'File is required for file type' },
          { status: 400 }
        )
      }

      // R2에 업로드
      const buffer = Buffer.from(await file.arrayBuffer())
      const fileName = `product-ad/reference-${user.id}-${Date.now()}.${file.name.split('.').pop()}`
      videoUrl = await uploadBufferToR2(buffer, fileName, file.type)

      // Gemini에서 영상 분석 (URL을 통해)
      if (videoUrl) {
        analysisContent = await analyzeVideoWithGemini(videoUrl, productName, productDescription)
      }
    } else if (type === 'youtube') {
      // YouTube URL 처리
      const url = formData.get('url') as string
      if (!url) {
        return NextResponse.json(
          { error: 'URL is required for youtube type' },
          { status: 400 }
        )
      }

      videoUrl = url
      // YouTube URL을 Gemini에 전달하여 분석
      // Gemini는 YouTube URL을 직접 분석할 수 있음
      analysisContent = await analyzeYouTubeWithGemini(url, productName, productDescription)
    }

    if (!analysisContent) {
      return NextResponse.json(
        { error: 'Failed to analyze video' },
        { status: 500 }
      )
    }

    // JSON 파싱
    const result = JSON.parse(analysisContent) as {
      elements: AnalyzedElements
      description: string
    }

    return NextResponse.json({
      elements: result.elements,
      description: result.description,
      videoUrl,
    })
  } catch (error) {
    console.error('참조 영상 분석 오류:', error)
    return NextResponse.json(
      { error: 'Failed to analyze reference video' },
      { status: 500 }
    )
  }
}

async function analyzeVideoWithGemini(
  _videoUrl: string,
  productName: string,
  productDescription: string
): Promise<string> {
  // 영상 파일을 직접 분석하는 대신, 제품 정보 기반으로 추천 요소를 생성합니다.
  // TODO: Gemini File API를 통한 실제 영상 분석 구현
  const prompt = `You are an expert advertising analyst.
Based on the product information, suggest appropriate advertising elements that would typically work well for this type of product.

OUTPUT LANGUAGE: Korean

Product Name: ${productName || 'Unknown product'}
Product Description: ${productDescription || 'No description provided'}

=== TASK ===
Since we cannot directly analyze the reference video, please recommend advertising elements based on:
1. The product type and category
2. Common advertising practices for similar products
3. What typically works well in product advertisements

Provide realistic and practical suggestions for each element.`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.LOW,
    },
    responseMimeType: 'application/json',
    responseSchema: getResponseSchema(),
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  return response.text || ''
}

async function analyzeYouTubeWithGemini(
  youtubeUrl: string,
  productName: string,
  productDescription: string
): Promise<string> {
  // YouTube URL을 컨텍스트로 제공하여 분석 시도
  const prompt = `You are an expert advertising analyst.
Analyze advertising elements based on the product information and the referenced YouTube video style.

OUTPUT LANGUAGE: Korean

Product Name: ${productName || 'Unknown product'}
Product Description: ${productDescription || 'No description provided'}
Reference YouTube URL: ${youtubeUrl}

=== TASK ===
Based on typical advertising video styles and the product information, suggest appropriate advertising elements.
Consider what visual styles and techniques would work well for this type of product advertisement.`

  const config: GenerateContentConfig = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.LOW,
    },
    responseMimeType: 'application/json',
    responseSchema: getResponseSchema(),
  }

  const response = await genAI.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  })

  return response.text || ''
}

// 영상 분석용 프롬프트 생성 (향후 Gemini File API 구현 시 사용 예정)
function _buildAnalysisPrompt(productName: string, productDescription: string): string {
  return `You are an expert advertising analyst.
Analyze this video advertisement and extract the key advertising elements.

OUTPUT LANGUAGE: Korean

${productName ? `Target Product: ${productName}` : ''}
${productDescription ? `Product Description: ${productDescription}` : ''}

=== ELEMENTS TO EXTRACT ===

1. background (배경/장소): What is the setting/background of the ad?
   - Examples: 스튜디오, 실내, 야외, 도시, 자연, 추상적 배경 등

2. mood (분위기/톤): What feeling does the ad convey?
   - Examples: 고급스러운, 친근한, 모던한, 역동적인, 차분한, 트렌디한 등

3. cameraAngle (카메라 구도): What camera angles are primarily used?
   - Examples: 클로즈업, 미디엄 샷, 와이드 샷, 탑다운, 로우앵글 등

4. productPlacement (제품 배치/연출): How is the product presented?
   - Examples: 중앙 배치, 플로팅, 회전, 언박싱, 사용 장면 등

5. lighting (조명 스타일): What lighting style is used?
   - Examples: 스튜디오 조명, 자연광, 드라마틱, 소프트, 백라이트 등

6. colorTone (색상 톤): What is the dominant color palette?
   - Examples: 밝은, 따뜻한, 차가운, 모노톤, 비비드, 파스텔 등

=== GUIDELINES ===
1. Focus on visual elements that can be replicated
2. Be specific but concise
3. Describe elements in Korean
4. Provide a brief overall description of the ad style`
}

function getResponseSchema() {
  return {
    type: Type.OBJECT,
    required: ['elements', 'description'],
    properties: {
      elements: {
        type: Type.OBJECT,
        required: ['background', 'mood', 'cameraAngle', 'productPlacement', 'lighting', 'colorTone'],
        properties: {
          background: { type: Type.STRING, description: '배경/장소' },
          mood: { type: Type.STRING, description: '분위기/톤' },
          cameraAngle: { type: Type.STRING, description: '카메라 구도' },
          productPlacement: { type: Type.STRING, description: '제품 배치/연출' },
          lighting: { type: Type.STRING, description: '조명 스타일' },
          colorTone: { type: Type.STRING, description: '색상 톤' },
        },
      },
      description: {
        type: Type.STRING,
        description: '영상의 전체적인 광고 스타일 설명 (2-3문장, 한국어)',
      },
    },
  }
}
