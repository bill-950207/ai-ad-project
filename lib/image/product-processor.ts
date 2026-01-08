/**
 * 광고 제품 이미지 처리 유틸리티
 *
 * 배경 제거된 제품 이미지를 아바타와 비교하여
 * 적절한 크기로 조절하고 캔버스 중앙에 배치합니다.
 */

import sharp from 'sharp'

// 캔버스 크기 (아바타 이미지와 동일)
const CANVAS_WIDTH = 1024
const CANVAS_HEIGHT = 1536

// 참조 아바타 이미지 URL (제품 크기 비교용)
const REFERENCE_AVATAR_URL = 'https://pub-ec68419ff8bc464ca734a0ddb80a2823.r2.dev/avatars/compressed/5e0f3953-0983-492c-9f47-0410e584849e_1767873505794.webp'

// 제품이 차지할 최대 비율 (캔버스 대비)
const MAX_PRODUCT_WIDTH_RATIO = 0.6   // 캔버스 너비의 60%
const MAX_PRODUCT_HEIGHT_RATIO = 0.5  // 캔버스 높이의 50%

/**
 * 배경 제거된 제품 이미지를 처리하여 캔버스에 배치
 *
 * @param productImageUrl - 배경 제거된 제품 이미지 URL
 * @returns 처리된 이미지 Buffer (PNG)
 */
export async function processProductImage(productImageUrl: string): Promise<Buffer> {
  // 1. 제품 이미지 다운로드
  const productResponse = await fetch(productImageUrl)
  if (!productResponse.ok) {
    throw new Error('Failed to fetch product image')
  }
  const productBuffer = Buffer.from(await productResponse.arrayBuffer())

  // 2. 제품 이미지 메타데이터 가져오기
  const productMeta = await sharp(productBuffer).metadata()
  const productWidth = productMeta.width || 0
  const productHeight = productMeta.height || 0

  if (productWidth === 0 || productHeight === 0) {
    throw new Error('Invalid product image dimensions')
  }

  // 3. 제품 크기 계산 (캔버스 대비 비율)
  const maxWidth = Math.floor(CANVAS_WIDTH * MAX_PRODUCT_WIDTH_RATIO)
  const maxHeight = Math.floor(CANVAS_HEIGHT * MAX_PRODUCT_HEIGHT_RATIO)

  // 비율 유지하면서 최대 크기 내로 조절
  let newWidth = productWidth
  let newHeight = productHeight

  // 가로 비율 체크
  if (newWidth > maxWidth) {
    const ratio = maxWidth / newWidth
    newWidth = maxWidth
    newHeight = Math.floor(newHeight * ratio)
  }

  // 세로 비율 체크
  if (newHeight > maxHeight) {
    const ratio = maxHeight / newHeight
    newHeight = maxHeight
    newWidth = Math.floor(newWidth * ratio)
  }

  // 4. 제품 이미지 리사이즈
  const resizedProduct = await sharp(productBuffer)
    .resize(newWidth, newHeight, {
      fit: 'inside',
      withoutEnlargement: false,
    })
    .png()
    .toBuffer()

  // 5. 투명 캔버스 생성 및 제품 이미지 중앙 배치
  const left = Math.floor((CANVAS_WIDTH - newWidth) / 2)
  const top = Math.floor((CANVAS_HEIGHT - newHeight) / 2)

  const result = await sharp({
    create: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: resizedProduct,
        left,
        top,
      },
    ])
    .png()
    .toBuffer()

  return result
}

/**
 * URL에서 이미지를 다운로드하여 Buffer로 반환
 *
 * @param url - 이미지 URL
 * @returns 이미지 Buffer
 */
export async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

/**
 * 처리된 제품 이미지를 Data URL로 변환
 *
 * @param productImageUrl - 배경 제거된 제품 이미지 URL
 * @returns Data URL 형식의 이미지
 */
export async function processProductImageToDataUrl(productImageUrl: string): Promise<string> {
  const buffer = await processProductImage(productImageUrl)
  const base64 = buffer.toString('base64')
  return `data:image/png;base64,${base64}`
}
