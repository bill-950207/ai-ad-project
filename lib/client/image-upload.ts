/**
 * 클라이언트 이미지 업로드 유틸리티
 *
 * 브라우저에서 이미지를 압축하고 R2에 직접 업로드합니다.
 * - 원본 이미지: 그대로 업로드 (재가공용)
 * - 압축 이미지: WebP로 변환하여 업로드 (조회용)
 */

// ============================================================
// 상수 정의
// ============================================================

/** WebP 압축 품질 (0-1) */
const WEBP_QUALITY = 0.95

// ============================================================
// 타입 정의
// ============================================================

/** Presigned URL 응답 */
interface PresignedUrlResult {
  uploadUrl: string
  publicUrl: string
  key: string
}

/** 아바타 업로드 URL 세트 */
interface AvatarUploadUrls {
  original: PresignedUrlResult
  compressed: PresignedUrlResult
}

/** 이미지 업로드 결과 */
export interface ImageUploadResult {
  originalUrl: string    // 원본 이미지 URL
  compressedUrl: string  // 압축 이미지 URL
}

// ============================================================
// 내부 함수
// ============================================================

/**
 * 이미지 URL을 Blob으로 다운로드
 *
 * @param imageUrl - 이미지 URL
 * @returns 이미지 Blob과 콘텐츠 타입
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
 *
 * Canvas API를 사용하여 브라우저에서 WebP 변환
 *
 * @param imageBlob - 원본 이미지 Blob
 * @returns 압축된 WebP Blob
 */
async function compressToWebP(imageBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      // Canvas에 이미지 그리기
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context 생성 실패'))
        return
      }

      ctx.drawImage(img, 0, 0)

      // WebP로 변환
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

    // Blob을 Data URL로 변환하여 로드
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
 *
 * @param uploadUrl - Presigned URL
 * @param blob - 업로드할 이미지 Blob
 * @param contentType - 콘텐츠 타입
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
 *
 * @param contentType - MIME 타입
 * @returns 파일 확장자
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
 * Presigned URL 요청
 *
 * 서버에서 R2 업로드용 presigned URL을 받아옵니다.
 *
 * @param avatarId - 아바타 ID
 * @param originalExt - 원본 이미지 확장자
 * @returns 업로드 URL 세트
 */
export async function requestUploadUrls(
  avatarId: string,
  originalExt: string = 'png'
): Promise<AvatarUploadUrls> {
  const response = await fetch(`/api/avatars/${avatarId}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalExt }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '업로드 URL 요청 실패')
  }

  const { uploadUrls } = await response.json()
  return uploadUrls
}

/**
 * 이미지를 R2에 업로드 (클라이언트 직접 업로드)
 *
 * fal.ai에서 생성된 이미지를 다운로드하고:
 * 1. 원본 이미지를 R2에 직접 업로드
 * 2. WebP로 압축한 이미지를 R2에 직접 업로드
 *
 * @param avatarId - 아바타 ID
 * @param imageUrl - 원본 이미지 URL (fal.ai 생성 이미지)
 * @returns 업로드된 이미지 URL (원본 + 압축)
 */
export async function uploadAvatarImage(
  avatarId: string,
  imageUrl: string
): Promise<ImageUploadResult> {
  // 1. 이미지 다운로드
  const { blob: originalBlob, contentType } = await fetchImageAsBlob(imageUrl)
  const originalExt = getExtensionFromContentType(contentType)

  // 2. WebP로 압축
  const compressedBlob = await compressToWebP(originalBlob)

  // 3. Presigned URL 요청
  const uploadUrls = await requestUploadUrls(avatarId, originalExt)

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

// ============================================================
// 의상 이미지 업로드 함수
// ============================================================

/** 의상 업로드 URL 세트 */
interface OutfitUploadUrls {
  original: PresignedUrlResult
  compressed: PresignedUrlResult
}

/**
 * 의상 결과 이미지용 Presigned URL 요청
 *
 * @param avatarId - 아바타 ID
 * @param outfitId - 의상 ID
 * @param originalExt - 원본 이미지 확장자
 * @returns 업로드 URL 세트
 */
export async function requestOutfitUploadUrls(
  avatarId: string,
  outfitId: string,
  originalExt: string = 'png'
): Promise<OutfitUploadUrls> {
  const response = await fetch(`/api/avatars/${avatarId}/outfits/${outfitId}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalExt }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '업로드 URL 요청 실패')
  }

  const { uploadUrls } = await response.json()
  return uploadUrls
}

/**
 * 의상 결과 이미지를 R2에 업로드
 *
 * fal.ai에서 생성된 의상 교체 이미지를 다운로드하고:
 * 1. 원본 이미지를 R2에 직접 업로드
 * 2. WebP로 압축한 이미지를 R2에 직접 업로드
 *
 * @param avatarId - 아바타 ID
 * @param outfitId - 의상 ID
 * @param imageUrl - 원본 이미지 URL (fal.ai 생성 이미지)
 * @returns 업로드된 이미지 URL (원본 + 압축)
 */
export async function uploadOutfitImage(
  avatarId: string,
  outfitId: string,
  imageUrl: string
): Promise<ImageUploadResult> {
  // 1. 이미지 다운로드
  const { blob: originalBlob, contentType } = await fetchImageAsBlob(imageUrl)
  const originalExt = getExtensionFromContentType(contentType)

  // 2. WebP로 압축
  const compressedBlob = await compressToWebP(originalBlob)

  // 3. Presigned URL 요청
  const uploadUrls = await requestOutfitUploadUrls(avatarId, outfitId, originalExt)

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
