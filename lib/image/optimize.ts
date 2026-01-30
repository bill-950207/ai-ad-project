/**
 * 이미지 최적화 유틸리티
 *
 * Cloudflare Image Resizing을 사용하여 이미지 크기를 최적화합니다.
 * R2 URL을 Cloudflare CDN 리사이징 URL로 변환합니다.
 */

interface ImageOptimizeOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'auto'
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
}

/**
 * Cloudflare Image Resizing URL 생성
 *
 * 주의: Cloudflare Image Resizing은 Pro 플랜 이상에서만 사용 가능합니다.
 * NEXT_PUBLIC_ENABLE_IMAGE_OPTIMIZATION=true 환경 변수로 활성화합니다.
 *
 * @param url - 원본 이미지 URL
 * @param options - 리사이징 옵션
 * @returns 최적화된 이미지 URL
 *
 * @example
 * optimizeImageUrl('https://cdn.example.com/image.jpg', { width: 200, quality: 75 })
 * // => 'https://cdn.example.com/cdn-cgi/image/width=200,quality=75,format=auto/image.jpg'
 */
export function optimizeImageUrl(url: string, options: ImageOptimizeOptions = {}): string {
  if (!url) return url

  // 이미지 최적화가 비활성화되면 원본 URL 반환
  // Cloudflare Image Resizing은 Pro 플랜 이상에서만 사용 가능
  const enableOptimization = process.env.NEXT_PUBLIC_ENABLE_IMAGE_OPTIMIZATION === 'true'
  if (!enableOptimization) return url

  // 이미 최적화된 URL이면 그대로 반환
  if (url.includes('/cdn-cgi/image/')) return url

  // Data URL이면 그대로 반환
  if (url.startsWith('data:')) return url

  // 외부 URL (다른 도메인)이면 그대로 반환
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL
  if (r2PublicUrl && !url.startsWith(r2PublicUrl)) return url

  try {
    const urlObj = new URL(url)
    const origin = urlObj.origin
    const pathname = urlObj.pathname

    // 옵션 문자열 생성
    const params: string[] = []
    if (options.width) params.push(`width=${options.width}`)
    if (options.height) params.push(`height=${options.height}`)
    if (options.quality) params.push(`quality=${options.quality}`)
    if (options.fit) params.push(`fit=${options.fit}`)
    params.push(`format=${options.format || 'auto'}`)

    const optionsStr = params.join(',')

    return `${origin}/cdn-cgi/image/${optionsStr}${pathname}`
  } catch {
    // URL 파싱 실패 시 원본 반환
    return url
  }
}

/**
 * 랜딩 페이지 썸네일용 최적화 URL (작은 크기)
 */
export function optimizeThumbnailUrl(url: string): string {
  return optimizeImageUrl(url, {
    width: 300,
    quality: 70,
    format: 'webp',
    fit: 'cover',
  })
}

/**
 * 레인 배경용 최적화 URL (아주 작은 크기)
 */
export function optimizeRainUrl(url: string): string {
  return optimizeImageUrl(url, {
    width: 150,
    quality: 60,
    format: 'webp',
    fit: 'cover',
  })
}

/**
 * 갤러리 카드용 최적화 URL
 */
export function optimizeGalleryUrl(url: string): string {
  return optimizeImageUrl(url, {
    width: 400,
    quality: 75,
    format: 'webp',
    fit: 'cover',
  })
}

/**
 * 라이트박스용 최적화 URL (고품질)
 */
export function optimizeLightboxUrl(url: string): string {
  return optimizeImageUrl(url, {
    width: 1200,
    quality: 85,
    format: 'auto',
    fit: 'scale-down',
  })
}
