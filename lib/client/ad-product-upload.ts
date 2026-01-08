/**
 * 광고 제품 이미지 업로드 유틸리티
 *
 * 브라우저에서 이미지를 압축하고 R2에 직접 업로드합니다.
 * - 소스 이미지: 배경 제거 전 원본 이미지
 * - 결과 이미지: 배경 제거 후 이미지 (원본 + 압축)
 */

// ============================================================
// 상수 정의
// ============================================================

/** WebP 압축 품질 (0-1) */
const WEBP_QUALITY = 0.95

// ============================================================
// 타입 정의
// ============================================================

interface PresignedUrlResult {
  uploadUrl: string
  publicUrl: string
  key: string
}

interface AdProductUploadUrls {
  original: PresignedUrlResult
  compressed: PresignedUrlResult
}

export interface ImageUploadResult {
  originalUrl: string
  compressedUrl: string
}

// ============================================================
// 내부 함수
// ============================================================

/**
 * 이미지 URL을 Blob으로 다운로드
 */
async function fetchImageAsBlob(imageUrl: string): Promise<{ blob: Blob; contentType: string }> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`이미지 다운로드 실패: ${response.statusText}`)
  }

  const blob = await response.blob()
  const contentType = response.headers.get('content-type') || 'image/png'

  return { blob, contentType }
}

/**
 * 이미지를 WebP로 압축
 */
async function compressToWebP(imageBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context 생성 실패'))
        return
      }

      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('WebP 변환 실패'))
          }
        },
        'image/webp',
        WEBP_QUALITY
      )
    }

    img.onerror = () => {
      reject(new Error('이미지 로드 실패'))
    }

    const reader = new FileReader()
    reader.onload = () => {
      img.src = reader.result as string
    }
    reader.onerror = () => {
      reject(new Error('Blob 읽기 실패'))
    }
    reader.readAsDataURL(imageBlob)
  })
}

/**
 * Presigned URL을 사용하여 이미지 업로드
 */
async function uploadToPresignedUrl(
  uploadUrl: string,
  blob: Blob,
  contentType: string
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': contentType,
    },
  })

  if (!response.ok) {
    throw new Error(`업로드 실패: ${response.statusText}`)
  }
}

/**
 * 콘텐츠 타입에서 확장자 추출
 */
function getExtensionFromContentType(contentType: string): string {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    return 'jpg'
  }
  if (contentType.includes('webp')) {
    return 'webp'
  }
  return 'png'
}

// ============================================================
// 공개 함수
// ============================================================

/**
 * 소스 이미지 Presigned URL 요청
 *
 * @param productId - 광고 제품 ID
 * @param originalExt - 이미지 확장자
 * @returns 업로드 URL
 */
export async function requestSourceUploadUrl(
  productId: string,
  originalExt: string = 'png'
): Promise<PresignedUrlResult> {
  const response = await fetch(`/api/ad-products/${productId}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'source', originalExt }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '업로드 URL 요청 실패')
  }

  const { uploadUrl } = await response.json()
  return uploadUrl
}

/**
 * 결과 이미지 Presigned URL 요청
 *
 * @param productId - 광고 제품 ID
 * @param originalExt - 이미지 확장자
 * @returns 업로드 URL 세트
 */
export async function requestResultUploadUrls(
  productId: string,
  originalExt: string = 'png'
): Promise<AdProductUploadUrls> {
  const response = await fetch(`/api/ad-products/${productId}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'result', originalExt }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '업로드 URL 요청 실패')
  }

  const { uploadUrls } = await response.json()
  return uploadUrls
}

/**
 * 소스 이미지를 R2에 업로드 (File 객체로부터)
 *
 * @param productId - 광고 제품 ID
 * @param file - 업로드할 파일
 * @returns 업로드된 이미지 URL
 */
export async function uploadSourceImage(
  productId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'

  // Presigned URL 요청
  const uploadUrl = await requestSourceUploadUrl(productId, ext)

  // 업로드
  await uploadToPresignedUrl(uploadUrl.uploadUrl, file, file.type)

  return uploadUrl.publicUrl
}

/**
 * 결과 이미지를 R2에 업로드
 *
 * fal.ai에서 배경이 제거된 이미지를 다운로드하고:
 * 1. 원본 이미지를 R2에 직접 업로드
 * 2. WebP로 압축한 이미지를 R2에 직접 업로드
 *
 * @param productId - 광고 제품 ID
 * @param imageUrl - 원본 이미지 URL (fal.ai 생성 이미지)
 * @returns 업로드된 이미지 URL (원본 + 압축)
 */
export async function uploadAdProductResultImage(
  productId: string,
  imageUrl: string
): Promise<ImageUploadResult> {
  // 1. 이미지 다운로드
  const { blob: originalBlob, contentType } = await fetchImageAsBlob(imageUrl)
  const originalExt = getExtensionFromContentType(contentType)

  // 2. WebP로 압축
  const compressedBlob = await compressToWebP(originalBlob)

  // 3. Presigned URL 요청
  const uploadUrls = await requestResultUploadUrls(productId, originalExt)

  // 4. 원본 및 압축 이미지 병렬 업로드
  await Promise.all([
    uploadToPresignedUrl(uploadUrls.original.uploadUrl, originalBlob, contentType),
    uploadToPresignedUrl(uploadUrls.compressed.uploadUrl, compressedBlob, 'image/webp'),
  ])

  return {
    originalUrl: uploadUrls.original.publicUrl,
    compressedUrl: uploadUrls.compressed.publicUrl,
  }
}
